import express from 'express';
import 'dotenv/config';
import { createServer } from 'node:http';
import { createSign } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json({ limit: '10mb' }));
const root = path.dirname(fileURLToPath(import.meta.url));
const backupConfigPath = process.env.BACKUP_CONFIG_FILE || path.join(root, '.runtime', 'backup-scheduler.json');
let tokenCache: { token: string; expires: number } | null = null;

type BackupConfig = {
  enabled: boolean;
  folderId: string;
  spreadsheetId: string;
  hour: number;
  minute: number;
  timezone: string;
  lastRunDate?: string;
  lastAttemptAt?: number;
  lastBackup?: { id: string; name: string; url: string; createdAt: string };
  lastError?: string;
};

const defaultBackupConfig: BackupConfig = {
  enabled: false,
  folderId: '',
  spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
  hour: 2,
  minute: 0,
  timezone: 'America/Bogota',
};
let backupConfig: BackupConfig = { ...defaultBackupConfig };
let backupRunning = false;

async function loadBackupConfig() {
  try {
    backupConfig = { ...defaultBackupConfig, ...JSON.parse(await readFile(backupConfigPath, 'utf8')) };
  } catch {
    backupConfig = { ...defaultBackupConfig };
  }
}

async function saveBackupConfig() {
  await mkdir(path.dirname(backupConfigPath), { recursive: true });
  await writeFile(backupConfigPath, JSON.stringify(backupConfig, null, 2), 'utf8');
}

function publicBackupConfig() {
  const { enabled, folderId, spreadsheetId, hour, minute, timezone, lastBackup, lastError } = backupConfig;
  return { enabled, folderId, spreadsheetId, hour, minute, timezone, lastBackup: lastBackup || null, lastError: lastError || null };
}

async function googleApi(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as any)?.error?.message || `Google respondió HTTP ${response.status}`);
  return data as any;
}

function zonedDateTime(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, hour: Number(values.hour), minute: Number(values.minute) };
}

async function appendBackupActivity(action: string, description: string) {
  const spreadsheetId = backupConfig.spreadsheetId;
  if (!spreadsheetId) throw new Error('No hay una hoja principal configurada para guardar el log de actividad.');
  const range = encodeURIComponent('activity_logs!A1:Z');
  const result = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
  const headers: string[] = result.values?.[0] || ['id', 'usuario_id', 'usuario_nombre', 'modulo', 'accion', 'descripcion', 'fecha'];
  const record: Record<string, unknown> = {
    id: Date.now(), usuario_id: 0, usuario_nombre: 'Sistema de respaldos', modulo: 'Google Drive',
    accion: action, descripcion, fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  const values = headers.map((header) => {
    const value = record[header];
    return value === undefined ? '' : value;
  });
  await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('activity_logs')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST', body: JSON.stringify({ values: [values] }),
  });
}

async function runDriveBackup(source: 'Programado' | 'Manual') {
  if (backupRunning) throw new Error('Ya hay un respaldo en curso.');
  if (!backupConfig.folderId || !backupConfig.spreadsheetId) throw new Error('Configura la carpeta de Drive y la hoja principal antes de respaldar.');
  backupRunning = true;
  try {
    const now = new Date();
    const name = `Imperio-Lux-Respaldo-${now.toISOString().replace(/[:.]/g, '-')}`;
    const copied = await googleApi(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(backupConfig.spreadsheetId)}/copy?supportsAllDrives=true&fields=id,name,webViewLink,createdTime`, {
      method: 'POST', body: JSON.stringify({ name, parents: [backupConfig.folderId] }),
    });
    const record = { id: copied.id, name: copied.name || name, url: copied.webViewLink || `https://drive.google.com/open?id=${copied.id}`, createdAt: copied.createdTime || now.toISOString() };
    backupConfig.lastBackup = record;
    backupConfig.lastError = undefined;
    backupConfig.lastAttemptAt = Date.now();
    backupConfig.lastRunDate = zonedDateTime(now, backupConfig.timezone).date;
    await saveBackupConfig();
    await appendBackupActivity('Respaldo creado', `${source}: respaldo de la hoja ${backupConfig.spreadsheetId} creado en Drive (${record.name}).`);
    return record;
  } catch (error) {
    backupConfig.lastError = error instanceof Error ? error.message : 'Error al realizar el respaldo.';
    backupConfig.lastAttemptAt = Date.now();
    await saveBackupConfig();
    try { await appendBackupActivity('Respaldo fallido', `${source}: ${backupConfig.lastError}`); } catch (logError) { console.error('No se pudo escribir el fallo de respaldo en activity_logs:', logError); }
    throw error;
  } finally {
    backupRunning = false;
  }
}

async function checkScheduledBackup() {
  if (!backupConfig.enabled || !backupConfig.folderId || backupRunning) return;
  const now = new Date();
  const local = zonedDateTime(now, backupConfig.timezone);
  if (local.date === backupConfig.lastRunDate || local.hour * 60 + local.minute < backupConfig.hour * 60 + backupConfig.minute) return;
  if (backupConfig.lastAttemptAt && Date.now() - backupConfig.lastAttemptAt < 15 * 60_000) return;
  try { await runDriveBackup('Programado'); }
  catch (error) { console.error('Respaldo diario de Google Drive fallido:', error); }
}

async function accessToken() {
  if (tokenCache && tokenCache.expires > Date.now() + 60_000) return tokenCache.token;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : JSON.parse(await readFile(process.env.GOOGLE_SERVICE_ACCOUNT_FILE || path.join(root, 'service-account.json'), 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({ iss: raw.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const signer = createSign('RSA-SHA256'); signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(raw.private_key, 'base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || 'No se pudo autenticar la cuenta de servicio de Google');
  tokenCache = { token: data.access_token, expires: Date.now() + (data.expires_in || 3600) * 1000 };
  return data.access_token;
}

app.get('/api/sheets/status', async (_req, res) => {
  try { const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || await readFile(process.env.GOOGLE_SERVICE_ACCOUNT_FILE || path.join(root, 'service-account.json'), 'utf8')); await accessToken(); res.json({ connected: true, email: credentials.client_email }); }
  catch (error) { res.status(503).json({ connected: false, error: error instanceof Error ? error.message : 'Configuración de Google incompleta' }); }
});

app.get('/api/backups/config', (_req, res) => res.json(publicBackupConfig()));

app.post('/api/backups/config', async (req, res) => {
  try {
    const folderInput = String(req.body?.folderId || '').trim();
    const folderId = folderInput.match(/\/folders\/([\w-]+)/)?.[1] || folderInput;
    const spreadsheetId = String(req.body?.spreadsheetId || '').trim();
    const hour = Number(req.body?.hour);
    const minute = Number(req.body?.minute);
    const timezone = String(req.body?.timezone || 'America/Bogota');
    const enabled = Boolean(req.body?.enabled);
    if (enabled && (!folderId || !spreadsheetId)) return res.status(400).json({ error: 'Indica la hoja principal y la carpeta de Drive.' });
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) return res.status(400).json({ error: 'La hora debe estar entre 00:00 y 23:59.' });
    try { new Intl.DateTimeFormat('en', { timeZone: timezone }); } catch { return res.status(400).json({ error: 'La zona horaria no es válida.' }); }
    if (enabled) {
      const folder = await googleApi(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?supportsAllDrives=true&fields=id,name,mimeType`);
      if (folder.mimeType !== 'application/vnd.google-apps.folder') return res.status(400).json({ error: 'El ID indicado no corresponde a una carpeta de Google Drive.' });
      await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId`);
    }
    const localNow = zonedDateTime(new Date(), timezone);
    if (localNow.hour * 60 + localNow.minute >= hour * 60 + minute && backupConfig.lastRunDate !== localNow.date) {
      backupConfig.lastRunDate = localNow.date;
    }
    backupConfig = { ...backupConfig, enabled, folderId, spreadsheetId, hour, minute, timezone };
    await saveBackupConfig();
    res.json(publicBackupConfig());
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'No se pudo guardar la programación.' }); }
});

app.post('/api/backups/run', async (_req, res) => {
  try { res.json({ backup: await runDriveBackup('Manual'), config: publicBackupConfig() }); }
  catch (error) { res.status(502).json({ error: error instanceof Error ? error.message : 'No se pudo crear el respaldo.' }); }
});

app.use('/api/google-sheets', async (req, res) => {
  try {
    const upstreamPath = req.originalUrl.replace(/^\/api\/google-sheets/, '');
    if (upstreamPath.includes('..')) return res.status(400).json({ error: { message: 'Ruta inválida' } });
    const token = await accessToken();
    const upstream = await fetch(`https://sheets.googleapis.com${upstreamPath}`, { method: req.method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body) });
    res.status(upstream.status);
    const body = await upstream.text();
    res.type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (error) { res.status(502).json({ error: { message: error instanceof Error ? error.message : 'Error de conexión con Google Sheets' } }); }
});

if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else app.use(express.static(path.join(root, 'dist')));

const server = createServer(app);
await loadBackupConfig();
setInterval(() => { void checkScheduledBackup(); }, 30_000);
void checkScheduledBackup();
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Imperio Lux disponible en puerto ${process.env.PORT || 3000}`));
