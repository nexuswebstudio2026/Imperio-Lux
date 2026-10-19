import express from 'express';
import 'dotenv/config';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { createHmac, createSign, randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import { put as putBlob } from '@vercel/blob';
import multer from 'multer';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const nativeAppOrigins = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost']);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && nativeAppOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '10mb' }));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
});
const deployedCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || (() => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
})();
const deployedCommitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || (() => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%s'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
})();
const backupConfigPath = process.env.BACKUP_CONFIG_FILE || path.join(root, '.runtime', 'backup-scheduler.json');
let tokenCache: { token: string; expires: number } | null = null;

type AuthUser = { id: string; name: string; email: string; role: string; type: 'admin' | 'employee' | 'client' | 'supplier' };
const sessions = new Map<string, { user: AuthUser; expires: number }>();
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const recoveryCodes = new Map<string, { codeHash: string; expires: number; attempts: number; row: Record<string, string>; headers: string[]; mode: 'username' | 'password' }>();
const recoveryRequestAttempts = new Map<string, { count: number; resetAt: number }>();
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();
const registrationConfirmAttempts = new Map<string, { count: number; resetAt: number }>();
const USERS_SHEET = 'Usuarios';
const AUTH_HEADERS = ['usuario', 'contrasena_salt', 'contrasena_hash'];
const USER_PROFILE_HEADERS = ['id', 'tipo_usuario', 'nombre', 'email', 'numero_documento', 'telefono', 'documento_id', 'tipo_persona', 'direccion', 'cargo', 'rol', 'estado'];

app.get('/api/system/version', (_req, res) => {
  void (async () => {
    try {
      const response = await fetch('https://api.github.com/repos/nexuswebstudio2026/Imperio-Lux/commits?per_page=1', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`GitHub devolvió HTTP ${response.status} al consultar el último commit.`);
      }
      const commits = await response.json() as Array<{ sha?: string; commit?: { message?: string } }>;
      const commit = commits[0];
      const title = String(commit?.commit?.message || '').split(/\r?\n/, 1)[0].trim();
      if (!title) throw new Error('GitHub no devolvió el título del último commit.');
      const releaseVersion = title.match(/\bv\.?\s*(\d+(?:\.\d+)+)\b/i)?.[1] || null;
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300');
      res.json({
        commit: commit?.sha || '',
        version: commit?.sha?.slice(0, 12) || 'unknown',
        releaseVersion,
        displayVersion: releaseVersion ? `Gana Pro V.${releaseVersion}` : title,
        title,
        source: 'github',
      });
    } catch (error) {
      const releaseVersion = deployedCommitMessage.match(/\bv\.?\s*(\d+(?:\.\d+)+)\b/i)?.[1] || null;
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30');
      res.json({
        commit: deployedCommitSha ? deployedCommitSha.slice(0, 12) : 'local',
        version: deployedCommitSha ? deployedCommitSha.slice(0, 12) : 'local',
        releaseVersion,
        displayVersion: releaseVersion ? `Gana Pro V.${releaseVersion}` : deployedCommitMessage || 'Versión local',
        title: deployedCommitMessage || 'Versión local',
        source: 'deployment',
        warning: error instanceof Error ? error.message : 'No se pudo consultar la versión más reciente en GitHub.',
      });
    }
  })();
});

function normalizeUsersHeader(value: unknown) {
  const header = String(value || '').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  return header === 'tipo_usuairo' ? 'tipo_usuario' : header;
}

async function readUsersSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
  const range = encodeURIComponent(`${USERS_SHEET}!A:Z`);
  const data = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
  const values: unknown[][] = data.values || [];
  const headers = (values[0] || []).map((v) => String(v || '').trim());
  const normalizedHeaders = headers.map(normalizeUsersHeader);
  const missing = [...USER_PROFILE_HEADERS, ...AUTH_HEADERS].filter((header) => !normalizedHeaders.includes(header));
  if (missing.length) {
    const nextHeaders = [...headers, ...missing];
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${USERS_SHEET}!A1`)}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [nextHeaders] }),
    });
    headers.push(...missing);
  }
  if (!headers.length) throw new Error('La hoja Usuarios debe incluir sus encabezados y los datos de cada cuenta.');
  const rows = values.slice(1).map((valuesRow, index) => {
    const data: Record<string, string> = {};
    headers.forEach((header, i) => {
      const key = normalizeUsersHeader(header);
      const value = String(valuesRow[i] ?? '').trim();
      if (value || !(key in data)) data[key] = value;
    });
    return { rowNumber: index + 2, data };
  });
  return { spreadsheetId, headers, rows };
}

async function writeUserRow(spreadsheetId: string, headers: string[], rowNumber: number, row: Record<string, string>) {
  const values = headers.map((header) => row[normalizeUsersHeader(header)] ?? '');
  await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${USERS_SHEET}!A${rowNumber}`)}?valueInputOption=RAW`, {
    method: 'PUT', body: JSON.stringify({ values: [values] }),
  });
}

function normalizeUsername(value: unknown) { return String(value || '').trim().toLocaleLowerCase('es'); }
async function readSheetRecords(sheetName: string): Promise<Record<string, unknown>[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
  if (!spreadsheetId) throw new Error('No hay una hoja de cálculo configurada.');
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const result = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
  const values: unknown[][] = result.values || [];
  const headers = (values[0] || []).map((value) => String(value || '').trim());
  return values.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}
async function readSheetGrid(sheetName: string) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
  if (!spreadsheetId) throw new Error('No hay una hoja de cálculo configurada.');
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const result = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
  const values: unknown[][] = result.values || [];
  const headers = (values[0] || []).map((value) => String(value || '').trim());
  if (!headers.length) throw new Error(`La hoja ${sheetName} no tiene encabezados.`);
  return { spreadsheetId, headers, rows: values.slice(1).map((row, index) => ({ rowNumber: index + 2, data: Object.fromEntries(headers.map((header, column) => [normalizeUsersHeader(header), String(row[column] ?? '').trim()])) })) };
}
async function writeSheetGridRow(spreadsheetId: string, sheetName: string, headers: string[], rowNumber: number, data: Record<string, string>) {
  const values = headers.map((header) => data[normalizeUsersHeader(header)] ?? '');
  await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A${rowNumber}`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: [values] }) });
}
async function appendSheetGridRow(spreadsheetId: string, sheetName: string, headers: string[], data: Record<string, string>) {
  const values = headers.map((header) => data[normalizeUsersHeader(header)] ?? '');
  await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:Z`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: 'POST', body: JSON.stringify({ values: [values] }) });
}
function isPublicRecordActive(value: unknown) {
  return value === true || value === 1 || ['true', 'activo', 'active'].includes(String(value || '').trim().toLocaleLowerCase('es'));
}
function verifyPassword(password: string, salt: string, hash: string) {
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function classifyUser(row: Record<string, string>): AuthUser['type'] {
  const type = `${row.tipo_usuario || ''} ${row.rol || ''} ${row.role || ''}`.toLocaleLowerCase('es');
  if (/admin|administrador/.test(type)) return 'admin';
  if (/proveedor|supplier/.test(type)) return 'supplier';
  if (/empleado|employee|cajero|vendedor/.test(type)) return 'employee';
  return 'client';
}
function safeUser(row: Record<string, string>): AuthUser {
  const type = classifyUser(row);
  return { id: row.id, name: row.nombre || row.name || 'Usuario', email: row.email || '', role: row.rol || row.role || row.tipo_usuario || type, type };
}
function sessionSigningKey(): Buffer | null {
  const configuredSecret = process.env.AUTH_SESSION_SECRET;
  if (configuredSecret && configuredSecret.length >= 32) {
    return createHash('sha256').update(configuredSecret).digest();
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '') as { private_key?: string };
    if (typeof credentials.private_key === 'string' && credentials.private_key.length > 0) {
      return createHash('sha256').update(`imperio-auth-session:${credentials.private_key}`).digest();
    }
  } catch {
    return null;
  }
  return null;
}
async function authSigningKey(): Promise<Buffer> {
  const configuredKey = sessionSigningKey();
  if (configuredKey) return configuredKey;
  const credentials = await serviceAccountCredentials();
  return createHash('sha256').update(`imperio-auth-session:${credentials.private_key}`).digest();
}
function signRegistrationPayload(payload: Record<string, unknown>, key: Buffer) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}
function createSessionToken(user: AuthUser, expires: number): string {
  const key = sessionSigningKey();
  if (process.env.VERCEL === '1') {
    if (!key) throw new Error('Configura GOOGLE_SERVICE_ACCOUNT_JSON o AUTH_SESSION_SECRET para mantener la sesión en Vercel.');
    const payload = Buffer.from(JSON.stringify({ user, expires })).toString('base64url');
    const signature = createHmac('sha256', key).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }
  return randomBytes(32).toString('base64url');
}
function currentSession(req: express.Request) {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('imperio_session='))?.slice('imperio_session='.length);
  if (!token) return null;

  const localSession = sessions.get(token);
  if (localSession) {
    if (localSession.expires >= Date.now()) return { token, ...localSession };
    sessions.delete(token);
  }

  const key = sessionSigningKey();
  if (!key) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expectedSignature = createHmac('sha256', key).update(payload).digest();
  const actualSignature = Buffer.from(signature, 'base64url');
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { user?: AuthUser; expires?: number };
    if (!session.user || typeof session.user.id !== 'string' || typeof session.user.type !== 'string' || typeof session.expires !== 'number' || session.expires < Date.now()) {
      return null;
    }
    return { token, user: session.user, expires: session.expires };
  } catch {
    return null;
  }
}
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = currentSession(req);
  if (!session) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  if (session.user.type !== 'admin') return res.status(403).json({ error: 'No tienes permisos para esta sección.' });
  next();
}

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
  spreadsheetId: process.env.GOOGLE_SHEETS_ID || '1CzufAtWYpkx5dYWjPiqdltMyiuIWeR7G4zTKy3_uxcg',
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

async function migrateCompanyRucHeaderToNit(): Promise<'renamed' | 'already-nit'> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
  if (!spreadsheetId) throw new Error('No hay una hoja de cálculo configurada para actualizar la columna fiscal de empresas.');

  const range = encodeURIComponent('empresas!A1:ZZ1');
  const result = await googleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`
  );
  const headers: string[] = (result.values?.[0] || []).map((value: unknown) => String(value ?? '').trim());
  const rucIndex = headers.findIndex((header) => header.toLocaleLowerCase('es') === 'ruc');
  const nitIndex = headers.findIndex((header) => header.toLocaleLowerCase('es') === 'nit');

  if (rucIndex < 0) {
    if (nitIndex >= 0) return 'already-nit';
    throw new Error('No se encontró la columna RUC en la fila de encabezados de la pestaña empresas.');
  }
  if (nitIndex >= 0) {
    throw new Error('La pestaña empresas ya tiene columnas RUC y NIT separadas; no se renombró para evitar sobrescribir datos.');
  }

  let column = '';
  for (let index = rucIndex + 1; index > 0; index = Math.floor((index - 1) / 26)) {
    column = String.fromCharCode(65 + ((index - 1) % 26)) + column;
  }
  await googleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`empresas!${column}1`)}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [['NIT']] }) }
  );
  return 'renamed';
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
    accion: action, descripcion: description, fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
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

async function serviceAccountCredentials(): Promise<{ client_email: string; private_key: string }> {
  const configuredJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  let credentials: unknown;

  if (configuredJson) {
    try {
      credentials = JSON.parse(configuredJson);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no contiene un JSON válido de cuenta de servicio.');
    }
  } else {
    const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE
      || (process.env.VERCEL ? undefined : path.join(root, 'service-account.json'));
    if (!credentialsPath) {
      throw new Error('Falta GOOGLE_SERVICE_ACCOUNT_JSON en las variables de entorno de Vercel.');
    }
    try {
      credentials = JSON.parse(await readFile(credentialsPath, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`No se encontró la cuenta de servicio en "${credentialsPath}". Configura GOOGLE_SERVICE_ACCOUNT_JSON en Vercel.`);
      }
      throw error;
    }
  }

  if (
    !credentials
    || typeof credentials !== 'object'
    || !('client_email' in credentials)
    || typeof credentials.client_email !== 'string'
    || !('private_key' in credentials)
    || typeof credentials.private_key !== 'string'
  ) {
    throw new Error('La cuenta de servicio debe incluir client_email y private_key.');
  }
  return credentials as { client_email: string; private_key: string };
}

async function accessToken() {
  if (tokenCache && tokenCache.expires > Date.now() + 60_000) return tokenCache.token;
  const raw = await serviceAccountCredentials();
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

// Stable database health endpoint for the client. Credentials stay on this server;
// the browser receives connection metadata only, never a Google access token.
app.get('/api/database/status', async (_req, res) => {
  try {
    const credentials = await serviceAccountCredentials();
    const spreadsheetId = String(_req.query.spreadsheetId || process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId);
    const result = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties.title`);
    res.json({ connected: true, provider: 'google-sheets', spreadsheetId, spreadsheetTitle: result.properties?.title || '', serviceAccount: credentials.client_email });
  } catch (error) {
    res.status(503).json({ connected: false, provider: 'google-sheets', error: error instanceof Error ? error.message : 'No se pudo conectar con Google Sheets.' });
  }
});

app.get('/api/database/sheets', requireAdmin, async (_req, res) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
    if (!spreadsheetId) throw new Error('No hay una hoja de cálculo configurada en el servidor.');

    const metadata = await googleApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties.title,sheets.properties`
    );
    const sheets = (metadata.sheets || []).map((sheet: any) => sheet.properties);
    const ranges = new URLSearchParams({ valueRenderOption: 'UNFORMATTED_VALUE' });
    sheets.forEach((sheet: any) => {
      const escapedTitle = String(sheet.title).replace(/'/g, "''");
      ranges.append('ranges', `'${escapedTitle}'!A:ZZ`);
    });

    const values = sheets.length
      ? await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${ranges.toString()}`)
      : { valueRanges: [] };
    const resultSheets = sheets.map((sheet: any, index: number) => {
      const valuesInSheet: unknown[][] = values.valueRanges?.[index]?.values || [];
      const headers = (valuesInSheet[0] || []).map((value) => String(value ?? '').trim());
      const visibleColumns = headers
        .map((header, columnIndex) => ({ header, columnIndex }))
        .filter(({ header }) => !/password|contrasena|contraseña|secret|access_token|refresh_token/i.test(header));
      const rows = valuesInSheet.slice(1)
        .filter((row) => row.some((cell) => cell !== '' && cell !== null && cell !== undefined))
        .map((row) => Object.fromEntries(visibleColumns.map(({ header, columnIndex }) => [header, row[columnIndex] ?? ''])));
      return {
        title: sheet.title,
        sheetId: sheet.sheetId,
        index: sheet.index,
        headers: visibleColumns.map(({ header }) => header),
        rows,
        recordCount: rows.length,
      };
    });

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      spreadsheetId,
      title: metadata.properties?.title || 'Google Sheets',
      sheets: resultSheets,
    });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudieron leer las hojas de Google Sheets.' });
  }
});

app.get('/api/storefront/catalog', async (_req, res) => {
  try {
    const [products, categories, brands] = await Promise.all([
      readSheetRecords('productos'),
      readSheetRecords('categorias'),
      readSheetRecords('marcas'),
    ]);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.json({
      products: products.filter((record) => isPublicRecordActive(record.estado)).map((record) => ({
        id: Number(record.id) || 0,
        nombre: String(record.nombre || ''),
        descripcion: String(record.descripcion || ''),
        imagen: String(record.imagen || ''),
        categoria_id: Number.isFinite(Number(record.categoria_id)) ? Number(record.categoria_id) : 0,
        marca_id: Number(record.marca_id) || 0,
        precio_venta: Number(record.precio_venta) || 0,
        estado: true,
      })),
      categories: categories.filter((record) => isPublicRecordActive(record.estado)).map((record) => ({
        id: Number(record.id) || 0,
        nombre: String(record.nombre || ''),
        descripcion: String(record.descripcion || ''),
        estado: true,
      })),
      brands: brands.filter((record) => isPublicRecordActive(record.estado)).map((record) => ({
        id: Number(record.id) || 0,
        nombre: String(record.nombre || ''),
        descripcion: String(record.descripcion || ''),
        estado: true,
      })),
    });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo cargar el catálogo desde Google Sheets.' });
  }
});

const QUOTES_SHEET = 'Cotizaciones';
const QUOTES_HEADERS = ['id', 'fecha', 'cliente_nombre', 'cliente_whatsapp', 'cliente_correo', 'productos_json', 'total', 'pdf_token_hash'];

async function ensureQuotesSheet(spreadsheetId: string) {
  let metadata = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`);
  let sheet = (metadata.sheets || []).find((item: any) => item.properties?.title === QUOTES_SHEET);
  if (!sheet) {
    try {
      await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
        method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: QUOTES_SHEET } } }] }),
      });
    } catch (error) {
      // Two first-time quote requests can race to create the same tab.
      metadata = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`);
      if (!(metadata.sheets || []).some((item: any) => item.properties?.title === QUOTES_SHEET)) throw error;
    }
  }
  const headerRange = encodeURIComponent(`${QUOTES_SHEET}!A1:H1`);
  const headerResult = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${headerRange}?valueRenderOption=UNFORMATTED_VALUE`);
  const currentHeaders: string[] = headerResult.values?.[0] || [];
  if (!QUOTES_HEADERS.every((header, index) => currentHeaders[index] === header)) {
    if (currentHeaders.length) throw new Error('La hoja Cotizaciones ya existe con encabezados diferentes. Renómbrala o corrige sus encabezados para continuar.');
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${headerRange}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [QUOTES_HEADERS] }),
    });
  }
}

function createQuotePdf(quote: { id: string; createdAt: string; name: string; phone: string; email: string; items: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>; total: number }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 24;
  doc.setFillColor(17, 27, 45);
  doc.rect(0, 0, pageWidth, 43, 'F');
  doc.setTextColor(225, 201, 148);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('IMPERIO LUX', margin, y);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(21);
  doc.text('Cotización', margin, y + 11);
  doc.setFontSize(10);
  doc.text(quote.id, pageWidth - margin, y + 10, { align: 'right' });
  y = 56;
  doc.setTextColor(35, 43, 56);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Datos del cliente', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const details = [`Nombre: ${quote.name}`, `WhatsApp: ${quote.phone}`, ...(quote.email ? [`Correo: ${quote.email}`] : []), `Fecha: ${new Date(quote.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`];
  for (const line of details) { doc.text(line, margin, y); y += 6; }
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Productos solicitados', margin, y);
  y += 8;
  for (const item of quote.items) {
    const nameLines = doc.splitTextToSize(item.name, contentWidth - 56) as string[];
    const rowHeight = Math.max(13, nameLines.length * 5 + 6);
    if (y + rowHeight + 35 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 22; }
    doc.setDrawColor(224, 228, 234);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(nameLines, margin, y + 6);
    doc.text(`${item.quantity} × ${item.unitPrice.toLocaleString('es-CO')} COP`, pageWidth - margin, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.lineTotal.toLocaleString('es-CO')} COP`, pageWidth - margin, y + rowHeight - 2, { align: 'right' });
    y += rowHeight;
  }
  if (y + 30 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 22; }
  y += 4;
  doc.setDrawColor(184, 150, 82);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(125, 95, 43);
  doc.text(`Total estimado: ${quote.total.toLocaleString('es-CO')} COP`, pageWidth - margin, y, { align: 'right' });
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 108, 119);
  doc.text(doc.splitTextToSize('Cotización informativa, sujeta a disponibilidad y confirmación del negocio. Los precios pueden variar hasta confirmar el pedido.', contentWidth), margin, y);
  return Buffer.from(doc.output('arraybuffer'));
}

app.post('/api/storefront/quotes', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 120);
    const phone = String(req.body?.phone || '').trim().slice(0, 40);
    const email = String(req.body?.email || '').trim().slice(0, 160);
    const requestedItems = req.body?.items;
    if (name.length < 2 || !phone || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ error: 'Revisa el nombre y los datos de contacto de la cotización.' });
    }
    if (!Array.isArray(requestedItems) || !requestedItems.length || requestedItems.length > 100) {
      return res.status(400).json({ error: 'Selecciona al menos un producto para cotizar.' });
    }
    const products = await readSheetRecords('productos');
    const items = requestedItems.map((requested: any) => {
      const id = Number(requested?.id);
      const quantity = Number(requested?.quantity);
      const record = products.find((product) => Number(product.id) === id && isPublicRecordActive(product.estado));
      if (!record || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Uno de los productos ya no está disponible o tiene una cantidad inválida. Actualiza el catálogo e inténtalo de nuevo.');
      const unitPrice = Number(record.precio_venta);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`El producto ${String(record.nombre || '')} no tiene un precio de venta válido.`);
      return { id, name: String(record.nombre || '').slice(0, 180), quantity, unitPrice, lineTotal: unitPrice * quantity };
    });
    if (new Set(items.map((item) => item.id)).size !== items.length) return res.status(400).json({ error: 'Hay productos repetidos en la solicitud.' });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
    if (!spreadsheetId) throw new Error('No hay una hoja de cálculo configurada en el servidor.');
    await ensureQuotesSheet(spreadsheetId);
    const createdAt = new Date().toISOString();
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${QUOTES_SHEET}!A:H`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const appended = await googleApi(appendUrl, {
      method: 'POST', body: JSON.stringify({ values: [['', createdAt, name, phone, email, JSON.stringify(items), total, tokenHash]] }),
    });
    const rowNumber = Number(String(appended.updates?.updatedRange || '').match(/![A-Z]+(\d+)/)?.[1]);
    if (!Number.isInteger(rowNumber) || rowNumber < 2) throw new Error('Google Sheets guardó la cotización, pero no devolvió la fila para generar el consecutivo.');
    const quoteId = `COT-${String(rowNumber - 1).padStart(6, '0')}`;
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${QUOTES_SHEET}!A${rowNumber}`)}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [[quoteId]] }),
    });
    const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`);
    const pdfUrl = `${baseUrl}/api/quotes/${quoteId}/${token}.pdf`;
    return res.status(201).json({ id: quoteId, createdAt, total, items, pdfUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la cotización.';
    return res.status(502).json({ error: message });
  }
});

app.get('/api/quotes/:quoteId/:token.pdf', async (req, res) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
    if (!spreadsheetId) return res.status(503).json({ error: 'No hay una hoja de cálculo configurada.' });
    const range = encodeURIComponent(`${QUOTES_SHEET}!A:H`);
    const result = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
    const headers: string[] = result.values?.[0] || [];
    const row = (result.values || []).slice(1).find((values: unknown[]) => String(values[0]) === req.params.quoteId);
    const tokenHashIndex = headers.indexOf('pdf_token_hash');
    const expectedHash = String(row?.[tokenHashIndex] || '');
    const actualHash = createHash('sha256').update(req.params.token).digest('hex');
    if (!row || expectedHash.length !== actualHash.length || !timingSafeEqual(Buffer.from(expectedHash), Buffer.from(actualHash))) return res.status(404).send('Cotización no encontrada.');
    const data = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])) as Record<string, any>;
    const quote = {
      id: String(data.id), createdAt: String(data.fecha), name: String(data.cliente_nombre), phone: String(data.cliente_whatsapp), email: String(data.cliente_correo),
      items: JSON.parse(String(data.productos_json || '[]')) as Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>, total: Number(data.total) || 0,
    };
    const pdf = createQuotePdf(quote);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${quote.id}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(pdf);
  } catch (error) {
    return res.status(503).send(error instanceof Error ? error.message : 'No se pudo generar el PDF de la cotización.');
  }
});

app.get('/api/auth/session', (req, res) => {
  const session = currentSession(req);
  res.json({ user: session?.user || null });
});

app.post('/api/auth/login', async (req, res) => {
  const ip = req.ip || 'unknown';
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.resetAt > Date.now() && attempt.count >= 8) return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos y vuelve a intentarlo.' });
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || '');
    if (!username || !password || password.length > 256) return res.status(400).json({ error: 'Escribe tu usuario y contraseña.' });
    const { rows } = await readUsersSheet();
    const found = rows.find(({ data }) => normalizeUsername(data.usuario) === username);
    if (!found || !verifyPassword(password, found.data.contrasena_salt, found.data.contrasena_hash)) {
      const current = loginAttempts.get(ip);
      loginAttempts.set(ip, { count: current?.resetAt && current.resetAt > Date.now() ? (current.count + 1) : 1, resetAt: current?.resetAt && current.resetAt > Date.now() ? current.resetAt : Date.now() + 15 * 60_000 });
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    if (!isPublicRecordActive(found.data.estado)) return res.status(403).json({ error: /^pendiente|pending$/i.test(found.data.estado) ? 'Tu solicitud de acceso está pendiente de aprobación por el administrador.' : 'Esta cuenta está inactiva. Contacta al administrador.' });
    loginAttempts.delete(ip);
    const user = safeUser(found.data);
    const expectedType = String(req.body?.expectedType || '');
    if (expectedType && expectedType !== user.type) {
      return res.status(403).json({ error: 'Esta cuenta no tiene acceso al portal seleccionado.' });
    }
    const expires = Date.now() + 12 * 60 * 60_000;
    const token = createSessionToken(user, expires);
    if (process.env.VERCEL !== '1') sessions.set(token, { user, expires });
    const crossSiteNative = nativeAppOrigins.has(String(req.headers.origin || ''));
    res.setHeader('Set-Cookie', `imperio_session=${token}; HttpOnly; SameSite=${crossSiteNative ? 'None' : 'Lax'}; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' || crossSiteNative ? '; Secure' : ''}`);
    res.json({ user });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo validar la cuenta en Google Sheets.' }); }
});

app.post('/api/upload-image', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = (req as express.Request & {
      file?: { buffer: Buffer; mimetype: string; originalname: string; size: number };
    }).file;
    if (!file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Por favor, selecciona un archivo de imagen válido (JPG, PNG, WebP o GIF).' });
    }
    if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ error: 'El almacenamiento de fotos de Vercel Blob no está configurado.' });
    }

    const extension = file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg'
      ? 'jpg'
      : file.mimetype.slice('image/'.length);
    const pathname = `productos/${Date.now()}-${randomBytes(8).toString('hex')}.${extension}`;
    const blob = await putBlob(pathname, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      ...(process.env.BLOB_STORE_ID ? { storeId: process.env.BLOB_STORE_ID } : {}),
      ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    });

    res.status(201).json({ success: true, url: blob.url });
  } catch (error) {
    console.error('No se pudo subir la imagen del producto a Vercel Blob:', error);
    res.status(502).json({ error: error instanceof Error ? error.message : 'No se pudo guardar la imagen en Vercel Blob.' });
  }
});

app.get('/api/portal/data', async (req, res) => {
  const session = currentSession(req);
  if (!session) return res.status(401).json({ error: 'Inicia sesión para consultar tu portal.' });
  const { user } = session;
  if (user.type !== 'client' && user.type !== 'supplier') return res.status(403).json({ error: 'Esta cuenta no tiene acceso a un portal de cliente o proveedor.' });

  try {
    const entityPrefix = user.type === 'supplier' ? 'PROV' : 'CLI';
    const sheetName = user.type === 'supplier' ? 'proveedores' : 'clientes';
    const transactionSheet = user.type === 'supplier' ? 'compras' : 'ventas';
    const transactionIdField = user.type === 'supplier' ? 'proveedor_id' : 'cliente_id';
    const [entities, transactions] = await Promise.all([
      readSheetRecords(sheetName),
      readSheetRecords(transactionSheet),
    ]);
    const linkedId = user.id.match(new RegExp(`^${entityPrefix}-(\\d+)$`, 'i'))?.[1];
    const matches = linkedId
      ? entities.filter((record) => String(record.id) === linkedId)
      : entities.filter((record) => normalizeUsername(record.email) === normalizeUsername(user.email));
    let entity = matches[0];
    if (!entity && matches.length === 0 && user.type === 'client') {
      const accounts = await readUsersSheet();
      const account = accounts.rows.find(({ data }) => data.id === user.id);
      if (account) entity = { id: user.id, razon_social: account.data.nombre, email: account.data.email };
    }
    if (!entity || matches.length > 1) {
      return res.status(matches.length > 1 ? 409 : 404).json({ error: 'No se pudo identificar un único registro asociado a esta cuenta. Contacta al administrador.' });
    }
    const entityId = String(entity.id || user.id);
    const ownTransactions = transactions
      .filter((record) => String(record[transactionIdField]) === entityId)
      .sort((first, second) => String(second.fecha_hora || '').localeCompare(String(first.fecha_hora || '')))
      .slice(0, 200)
      .map((record) => ({
        number: String(record.numero_comprobante || record.numero || record.id || ''),
        date: String(record.fecha_hora || record.fecha_compra || record.fecha || ''),
        total: Number(record.total) || 0,
        status: String(record.estado || ''),
        ...(user.type === 'supplier' ? { paymentStatus: String(record.estado_pago || '') } : {}),
      }));
    res.json({
      type: user.type,
      profile: {
        name: String(entity.razon_social || ''),
        email: String(entity.email || ''),
        phone: String(entity.telefono || ''),
        address: String(entity.direccion || ''),
        document: String(entity.numero_documento || ''),
      },
      transactions: ownTransactions,
    });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo cargar la información del portal.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const session = currentSession(req);
  if (session) sessions.delete(session.token);
  const crossSiteNative = nativeAppOrigins.has(String(req.headers.origin || ''));
  res.setHeader('Set-Cookie', `imperio_session=; HttpOnly; SameSite=${crossSiteNative ? 'None' : 'Lax'}; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' || crossSiteNative ? '; Secure' : ''}`);
  res.json({ ok: true });
});

app.post('/api/auth/recovery/request', async (req, res) => {
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM);
  if (!smtpConfigured) return res.status(503).json({ error: 'La recuperación por correo todavía no está habilitada. Configura SMTP en el servidor.' });
  const mode = req.body?.mode === 'username' ? 'username' : 'password';
  const requestIp = req.ip || 'unknown';
  const requestLimit = recoveryRequestAttempts.get(requestIp);
  if (requestLimit && requestLimit.resetAt > Date.now() && requestLimit.count >= 4) return res.status(429).json({ error: 'Demasiadas solicitudes. Espera 15 minutos y vuelve a intentarlo.' });
  recoveryRequestAttempts.set(requestIp, { count: requestLimit?.resetAt && requestLimit.resetAt > Date.now() ? requestLimit.count + 1 : 1, resetAt: requestLimit?.resetAt && requestLimit.resetAt > Date.now() ? requestLimit.resetAt : Date.now() + 15 * 60_000 });
  const identifier = String(req.body?.identifier || '').trim();
  if (!identifier || identifier.length > 254) return res.status(400).json({ error: 'Escribe tu usuario o correo registrado.' });
  try {
    const { rows, headers } = await readUsersSheet();
    const normalized = normalizeUsername(identifier);
    const expectedType = String(req.body?.portalType || '');
    const recoveryId = randomBytes(24).toString('base64url');
    const matchesPortal = (data: Record<string, string>) => expectedType
      ? classifyUser(data) === expectedType
      : classifyUser(data) !== 'admin';
    const match = rows.find(({ data }) => matchesPortal(data) && (mode === 'username'
      ? data.email.toLocaleLowerCase('es') === normalized
      : normalizeUsername(data.usuario) === normalized));
    if (!match) return res.status(404).json({ error: mode === 'username'
      ? 'No hay un usuario registrado con este correo electrónico en Google Sheets.'
      : 'Este usuario no está registrado en Google Sheets.' });
    if (!match.data.email) return res.status(409).json({ error: 'La cuenta no tiene un correo electrónico registrado. Contacta al administrador.' });

    const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
    const codeHash = createHash('sha256').update(code).digest('hex');
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    const text = mode === 'username'
      ? `Tu código para recuperar el usuario de Imperio Lux es: ${code}. Vence en 10 minutos.`
      : `Tu código para restablecer la contraseña de Imperio Lux es: ${code}. Vence en 10 minutos.`;
    const delivery = await transporter.sendMail({ from: process.env.SMTP_FROM, to: match.data.email, subject: 'Recuperación de cuenta · Imperio Lux', text });
    const acceptedRecipients = (delivery.accepted || []).map((recipient) => recipient.toLocaleLowerCase('es'));
    if (!acceptedRecipients.includes(match.data.email.toLocaleLowerCase('es'))) {
      return res.status(502).json({ error: 'El servidor de correo no aceptó el destinatario. Revisa el correo registrado o contacta al administrador.' });
    }
    recoveryCodes.set(recoveryId, { codeHash, expires: Date.now() + 10 * 60_000, attempts: 0, row: match.data, headers, mode });
    res.json({ message: `Enviamos el código al correo registrado en Google Sheets. Revisa tu bandeja de entrada y spam.`, recoveryId });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo enviar el correo de recuperación.' }); }
});

app.post('/api/auth/register', async (req, res) => {
  const ip = req.ip || 'unknown';
  const currentLimit = registrationAttempts.get(ip);
  if (currentLimit && currentLimit.resetAt > Date.now() && currentLimit.count >= 5) return res.status(429).json({ error: 'Demasiados intentos de registro. Espera 15 minutos e inténtalo de nuevo.' });
  registrationAttempts.set(ip, { count: currentLimit?.resetAt && currentLimit.resetAt > Date.now() ? currentLimit.count + 1 : 1, resetAt: currentLimit?.resetAt && currentLimit.resetAt > Date.now() ? currentLimit.resetAt : Date.now() + 15 * 60_000 });
  try {
    const type = String(req.body?.type || '') as 'client' | 'supplier' | 'employee';
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLocaleLowerCase('es');
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const document = String(req.body?.document || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const address = String(req.body?.address || '').trim();
    const cargo = String(req.body?.cargo || '').trim();
    const documentTypeId = String(req.body?.documentTypeId || '1').trim();
    const personType = String(req.body?.personType || 'Natural').trim();
    if (!['client', 'supplier', 'employee'].includes(type)) return res.status(400).json({ error: 'El tipo de usuario no es válido.' });
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || username.length < 4 || username.length > 64 || password.length < 10 || password.length > 256) {
      return res.status(400).json({ error: 'Completa el nombre, correo válido, usuario (4–64 caracteres) y contraseña (mínimo 10 caracteres).' });
    }
    if (!document || document.length > 32 || !/^[1-4]$/.test(documentTypeId) || phone.length > 32 || address.length > 240 || cargo.length > 120 || !['Natural', 'Juridica'].includes(personType)) return res.status(400).json({ error: 'Revisa el documento, teléfono y los datos del registro.' });

    const { rows } = await readUsersSheet();
    if (rows.some(({ data }) => normalizeUsername(data.usuario) === normalizeUsername(username))) return res.status(409).json({ error: 'Ese nombre de usuario ya está ocupado.' });
    if (rows.some(({ data }) => data.email.toLocaleLowerCase('es') === email)) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Intenta iniciar sesión o restablecer tu contraseña.' });

    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM);
    if (!smtpConfigured) return res.status(503).json({ error: 'El registro requiere correo de verificación. Configura SMTP en el servidor.' });
    const label = type === 'supplier' ? 'Proveedor' : type === 'employee' ? 'Empleado' : 'Cliente';
    const prefix = type === 'supplier' ? 'PROV' : type === 'employee' ? 'EMP' : 'CLI';
    const id = `${prefix}-PEND-${randomBytes(8).toString('hex').toUpperCase()}`;
    if (rows.some(({ data }) => data.id === id)) return res.status(409).json({ error: 'Ya hay una cuenta asociada a este registro. Intenta iniciar sesión o contacta al administrador.' });
    const salt = randomBytes(16).toString('hex');
    const row: Record<string, string> = {
      id,
      tipo_usuario: label,
      nombre: name,
      email,
      numero_documento: document,
      telefono: phone,
      documento_id: documentTypeId,
      tipo_persona: personType,
      direccion: address,
      cargo,
      rol: label,
      estado: 'Pendiente',
      usuario: username,
      contrasena_salt: salt,
      contrasena_hash: scryptSync(password, salt, 64).toString('hex'),
    };
    const key = await authSigningKey();
    const nonce = randomBytes(16).toString('hex');
    const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
    const codeMac = createHmac('sha256', key).update(`registro:${nonce}:${code}`).digest('hex');
    const registrationToken = signRegistrationPayload({ expiresAt: Date.now() + 10 * 60_000, nonce, codeMac, row }, key);
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verifica tu correo · Imperio Lux',
      text: `Tu código para solicitar acceso de ${label} en Imperio Lux es: ${code}. Vence en 10 minutos. La cuenta quedará pendiente de aprobación del administrador. Si no solicitaste esta cuenta, ignora este mensaje.`,
    });
    return res.status(200).json({ message: 'Enviamos un código de verificación al correo indicado. Al verificarlo, tu solicitud quedará pendiente de aprobación.', registrationToken });
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo registrar la cuenta en Google Sheets.' });
  }
});

app.post('/api/auth/register/confirm', async (req, res) => {
  const ip = req.ip || 'unknown';
  const currentLimit = registrationConfirmAttempts.get(ip);
  if (currentLimit && currentLimit.resetAt > Date.now() && currentLimit.count >= 6) return res.status(429).json({ error: 'Se alcanzó el límite de códigos. Espera 15 minutos y solicita un código nuevo.' });
  registrationConfirmAttempts.set(ip, { count: currentLimit?.resetAt && currentLimit.resetAt > Date.now() ? currentLimit.count + 1 : 1, resetAt: currentLimit?.resetAt && currentLimit.resetAt > Date.now() ? currentLimit.resetAt : Date.now() + 15 * 60_000 });
  try {
    const token = String(req.body?.registrationToken || '');
    const code = String(req.body?.code || '');
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra || token.length > 6000) return res.status(400).json({ error: 'El registro venció. Solicita un código nuevo.' });
    const key = await authSigningKey();
    const expectedSignature = createHmac('sha256', key).update(encoded).digest();
    const actualSignature = Buffer.from(signature, 'base64url');
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return res.status(400).json({ error: 'El código no es válido o venció.' });
    const pending = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { expiresAt: number; nonce: string; codeMac: string; row: Record<string, string> };
    const suppliedMac = createHmac('sha256', key).update(`registro:${pending.nonce}:${code}`).digest();
    const expectedMac = Buffer.from(pending.codeMac || '', 'hex');
    if (!/^\d{6}$/.test(code) || pending.expiresAt < Date.now() || suppliedMac.length !== expectedMac.length || !timingSafeEqual(suppliedMac, expectedMac)) {
      return res.status(400).json({ error: 'El código no es válido o venció.' });
    }
    const row = pending.row;
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    if (rows.some(({ data }) => normalizeUsername(data.usuario) === normalizeUsername(row.usuario))) return res.status(409).json({ error: 'Ese nombre de usuario ya está ocupado. Inicia el registro nuevamente con otro.' });
    if (rows.some(({ data }) => data.email.toLocaleLowerCase('es') === row.email.toLocaleLowerCase('es'))) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    if (rows.some(({ data }) => data.id === row.id)) return res.status(409).json({ error: 'Ya existe una cuenta para ese registro asociado.' });
    const values = headers.map((header) => row[normalizeUsersHeader(header)] ?? '');
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${USERS_SHEET}!A:Z`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST', body: JSON.stringify({ values: [values] }),
    });
    registrationConfirmAttempts.delete(ip);
    return res.status(201).json({ message: 'Correo verificado. Tu solicitud quedó registrada en Usuarios y está pendiente de aprobación del administrador.' });
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo confirmar el registro.' });
  }
});

app.post('/api/auth/recovery/confirm', async (req, res) => {
  const recoveryId = String(req.body?.recoveryId || '');
  const code = String(req.body?.code || '');
  const recovery = recoveryCodes.get(recoveryId);
  const suppliedHash = createHash('sha256').update(code).digest();
  const expectedHash = recovery ? Buffer.from(recovery.codeHash, 'hex') : Buffer.alloc(32);
  const codeMatches = suppliedHash.length === expectedHash.length && timingSafeEqual(suppliedHash, expectedHash);
  if (recovery) recovery.attempts += 1;
  if (!recovery || recovery.expires < Date.now() || recovery.attempts > 6 || !/^\d{6}$/.test(code) || !codeMatches) {
    if (recovery && recovery.attempts >= 6) recoveryCodes.delete(recoveryId);
    if (recovery?.expires && recovery.expires < Date.now()) recoveryCodes.delete(recoveryId);
    return res.status(400).json({ error: 'El código no es válido o venció.' });
  }
  const { spreadsheetId, headers, rows } = await readUsersSheet();
  const match = rows.find(({ data }) => data.id === recovery.row.id);
  if (!match) return res.status(400).json({ error: 'No se encontró la cuenta.' });
  const nextUsername = String(req.body?.newUsername || '').trim();
  const nextPassword = String(req.body?.newPassword || '');
  if (recovery.mode === 'username' && nextUsername) {
    if (nextUsername.length < 4 || nextUsername.length > 64) return res.status(400).json({ error: 'El usuario debe tener entre 4 y 64 caracteres.' });
    if (rows.some(({ data }) => data.id !== match.data.id && normalizeUsername(data.usuario) === normalizeUsername(nextUsername))) return res.status(409).json({ error: 'Ese nombre de usuario ya está ocupado.' });
    match.data.usuario = nextUsername;
  } else if (recovery.mode === 'password') {
    if (nextPassword.length < 10 || nextPassword.length > 256) return res.status(400).json({ error: 'La contraseña nueva debe tener al menos 10 caracteres.' });
    match.data.contrasena_salt = randomBytes(16).toString('hex');
    match.data.contrasena_hash = scryptSync(nextPassword, match.data.contrasena_salt, 64).toString('hex');
  } else return res.status(400).json({ error: 'Indica el nuevo usuario para completar el cambio.' });
  await writeUserRow(spreadsheetId, headers, match.rowNumber, match.data);
  recoveryCodes.delete(recoveryId);
  for (const [token, session] of sessions) if (session.user.id === match.data.id) sessions.delete(token);
  res.json({ message: 'La información de la cuenta fue actualizada.' });
});

app.post('/api/auth/bootstrap-admin', async (req, res) => {
  const configuredSecret = process.env.AUTH_BOOTSTRAP_SECRET;
  const suppliedSecret = String(req.body?.bootstrapSecret || '');
  const expectedSecret = Buffer.from(configuredSecret || '');
  const providedSecret = Buffer.from(suppliedSecret);
  const paddedSecret = Buffer.alloc(expectedSecret.length);
  providedSecret.copy(paddedSecret, 0, 0, expectedSecret.length);
  const secretMatches = Boolean(configuredSecret && providedSecret.length === expectedSecret.length && timingSafeEqual(expectedSecret, paddedSecret));
  if (!secretMatches) return res.status(403).json({ error: 'Configuración inicial no autorizada.' });
  try {
    const email = String(req.body?.email || '').trim().toLocaleLowerCase('es');
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (username.length < 4 || password.length < 10) return res.status(400).json({ error: 'El usuario requiere 4 caracteres y la contraseña al menos 10.' });
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const admins = rows.filter(({ data }) => classifyUser(data) === 'admin');
    if (!admins.length) return res.status(409).json({ error: 'Agrega primero la fila del administrador a la hoja Usuarios.' });
    if (admins.some(({ data }) => data.usuario || data.contrasena_hash)) return res.status(409).json({ error: 'Ya existe una cuenta de administrador configurada.' });
    const admin = admins.find(({ data }) => data.email.toLocaleLowerCase('es') === email);
    if (!admin) return res.status(404).json({ error: 'El correo no coincide con un administrador registrado.' });
    if (rows.some(({ data }) => normalizeUsername(data.usuario) === normalizeUsername(username))) return res.status(409).json({ error: 'Ese nombre de usuario ya está ocupado.' });
    admin.data.usuario = username;
    admin.data.contrasena_salt = randomBytes(16).toString('hex');
    admin.data.contrasena_hash = scryptSync(password, admin.data.contrasena_salt, 64).toString('hex');
    await writeUserRow(spreadsheetId, headers, admin.rowNumber, admin.data);
    res.json({ message: 'Cuenta de administrador configurada.' });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo configurar la cuenta.' }); }
});

app.get('/api/auth/admin/users', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await readUsersSheet();
    res.json({ users: rows.filter(({ data }) => data.id).map(({ data }) => ({ id: data.id, name: data.nombre || data.name || '', email: data.email || '', document: data.numero_documento || data.documento || '', phone: data.telefono || data.celular || '', type: classifyUser(data), username: data.usuario || '', configured: Boolean(data.contrasena_hash), cargo: data.cargo || '', rol: data.rol || '', pending: /^pendiente|pending$/i.test(data.estado || ''), estado: isPublicRecordActive(data.estado) })) });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo leer la hoja Usuarios.' }); }
});

app.post('/api/auth/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const target = rows.find(({ data }) => data.id === String(req.params.id || ''));
    if (!target) return res.status(404).json({ error: 'No se encontró la solicitud.' });
    if (!/^pendiente|pending$/i.test(target.data.estado || '')) return res.status(409).json({ error: 'La solicitud ya fue procesada o no está pendiente.' });
    const type = classifyUser(target.data);
    const sheetName = type === 'employee' ? 'empleados' : type === 'supplier' ? 'proveedores' : type === 'client' ? 'clientes' : '';
    if (!sheetName) return res.status(400).json({ error: 'No se puede aprobar este tipo de cuenta.' });
    if (!target.data.email || !target.data.numero_documento) return res.status(400).json({ error: 'La solicitud no tiene correo y documento. Completa esos datos antes de aprobar.' });
    const entity = await readSheetGrid(sheetName);
    const existing = entity.rows.find(({ data }) => data.email.toLocaleLowerCase('es') === target.data.email.toLocaleLowerCase('es'));
    const duplicateDocument = entity.rows.find(({ data }) => data.numero_documento && data.numero_documento === target.data.numero_documento && data.email.toLocaleLowerCase('es') !== target.data.email.toLocaleLowerCase('es'));
    if (duplicateDocument) return res.status(409).json({ error: `El documento ya está asociado a otro registro en ${sheetName}.` });
    const numericIds = entity.rows.map(({ data }) => Number(data.id)).filter((value) => Number.isInteger(value) && value > 0);
    const entityId = existing?.data.id || String(Math.max(0, ...numericIds) + 1);
    const fullName = target.data.nombre || '';
    const nameParts = fullName.trim().split(/\s+/);
    const entityRecord: Record<string, string> = {
      ...(existing?.data || {}),
      id: entityId,
      numero_documento: target.data.numero_documento,
      documento_id: target.data.documento_id || '1',
      telefono: target.data.telefono || '',
      email: target.data.email,
      estado: 'true',
      tipo_persona: target.data.tipo_persona || 'Natural',
      direccion: target.data.direccion || '',
      razon_social: fullName,
      nombre: nameParts[0] || fullName,
      apellido: nameParts.slice(1).join(' '),
      cargo: target.data.cargo || (type === 'employee' ? 'Por asignar' : ''),
    };
    if (existing) await writeSheetGridRow(entity.spreadsheetId, sheetName, entity.headers, existing.rowNumber, entityRecord);
    else await appendSheetGridRow(entity.spreadsheetId, sheetName, entity.headers, entityRecord);
    target.data.id = `${type === 'employee' ? 'EMP' : type === 'supplier' ? 'PROV' : 'CLI'}-${entityId}`;
    target.data.estado = 'Activo';
    if (type === 'employee' && !target.data.cargo) target.data.cargo = 'Por asignar';
    await writeUserRow(spreadsheetId, headers, target.rowNumber, target.data);
    res.json({ message: `Solicitud aprobada y registro creado en ${sheetName}.`, entity: sheetName, id: target.data.id });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo aprobar la solicitud.' }); }
});

app.post('/api/auth/admin/users/sync-employee-details', requireAdmin, async (_req, res) => {
  try {
    const employeeRecords = await readSheetRecords('Empleados');
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const employees = employeeRecords.map((record) => {
      const normalized = Object.fromEntries(Object.entries(record).map(([key, value]) => [normalizeUsersHeader(key), String(value ?? '').trim()]));
      return {
        id: normalized.id,
        email: (normalized.email || normalized.correo_electronico || '').toLocaleLowerCase('es'),
        name: [normalized.nombre, normalized.apellido].filter(Boolean).join(' ').trim(),
        document: normalized.numero_documento || normalized.numero_de_documento || normalized.documento || normalized.cedula || '',
        phone: normalized.telefono || normalized.celular || normalized.numero_telefonico || '',
        cargo: normalized.cargo || '',
      };
    });
    let updated = 0;
    for (const row of rows) {
      if (classifyUser(row.data) !== 'employee') continue;
      const employee = employees.find((candidate) => candidate.id && row.data.id === `EMP-${candidate.id}`)
        || employees.find((candidate) => candidate.email && row.data.email.toLocaleLowerCase('es') === candidate.email);
      if (!employee) continue;
      if (employee.email) row.data.email = employee.email;
      if (employee.document) row.data.numero_documento = employee.document;
      if (employee.phone) row.data.telefono = employee.phone;
      if (employee.name) row.data.nombre = employee.name;
      if (employee.cargo) row.data.cargo = employee.cargo;
      await writeUserRow(spreadsheetId, headers, row.rowNumber, row.data);
      updated += 1;
    }
    res.json({ message: `Se sincronizaron los datos de contacto de ${updated} empleado(s) desde la hoja Empleados.`, count: updated });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudieron sincronizar los datos de empleados.' }); }
});

app.post('/api/auth/admin/users', requireAdmin, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLocaleLowerCase('es');
    const type = String(req.body?.type || '').trim();
    const id = String(req.body?.id || '').trim() || `USR-${randomBytes(8).toString('hex').toUpperCase()}`;
    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Indica nombre y correo electrónico válido.' });
    if (!['admin', 'employee', 'customer', 'supplier'].includes(type)) return res.status(400).json({ error: 'El tipo de usuario no es válido.' });
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    if (rows.some(({ data }) => data.id === id || data.email.toLocaleLowerCase('es') === email)) return res.status(409).json({ error: 'Ya existe una cuenta con ese ID o correo.' });
    const record: Record<string, string> = { id, tipo_usuario: type, nombre: name, email, numero_documento: String(req.body?.document || '').trim(), telefono: String(req.body?.phone || '').trim(), cargo: String(req.body?.cargo || '').trim(), rol: String(req.body?.rol || '').trim(), estado: req.body?.estado === false ? 'Inactivo' : 'Activo', usuario: '', contrasena_salt: '', contrasena_hash: '' };
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${USERS_SHEET}!A:Z`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: 'POST', body: JSON.stringify({ values: [headers.map((header) => record[normalizeUsersHeader(header)] ?? '')] }) });
    res.status(201).json({ message: 'Usuario creado en Google Sheets.', id });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo crear el usuario.' }); }
});

app.put('/api/auth/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '');
    const partial = req.body?.partial === true;
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLocaleLowerCase('es');
    const type = String(req.body?.type || '').trim();
    if ((!partial || name) && !name) return res.status(400).json({ error: 'Indica el nombre del usuario.' });
    if ((!partial || email) && (!email || !/^\S+@\S+\.\S+$/.test(email))) return res.status(400).json({ error: 'Indica correo electrónico válido.' });
    if ((!partial || type) && !['admin', 'employee', 'customer', 'supplier'].includes(type)) return res.status(400).json({ error: 'El tipo de usuario no es válido.' });
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const target = rows.find(({ data }) => data.id === id);
    if (!target) return res.status(404).json({ error: 'No se encontró el usuario.' });
    if (email && rows.some(({ data }) => data.id !== id && data.email.toLocaleLowerCase('es') === email)) return res.status(409).json({ error: 'Ese correo ya pertenece a otro usuario.' });
    if (name) target.data.nombre = name;
    if (email) target.data.email = email;
    if (type) target.data.tipo_usuario = type;
    if (req.body?.document !== undefined && (!partial || String(req.body.document).trim())) target.data.numero_documento = String(req.body.document).trim();
    if (req.body?.phone !== undefined && (!partial || String(req.body.phone).trim())) target.data.telefono = String(req.body.phone).trim();
    if (req.body?.cargo !== undefined && (!partial || String(req.body.cargo).trim())) target.data.cargo = String(req.body.cargo).trim();
    if (req.body?.rol !== undefined && (!partial || String(req.body.rol).trim())) target.data.rol = String(req.body.rol).trim();
    if (req.body?.estado !== undefined) target.data.estado = req.body.estado === false ? 'Inactivo' : 'Activo';
    await writeUserRow(spreadsheetId, headers, target.rowNumber, target.data);
    res.json({ message: 'Usuario actualizado en Google Sheets.' });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el usuario.' }); }
});

app.post('/api/auth/admin/users/delete', requireAdmin, async (req, res) => {
  try {
    const ids = [...new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map((id: unknown) => String(id)))];
    if (!ids.length || ids.length > 500) return res.status(400).json({ error: 'Selecciona entre 1 y 500 usuarios.' });
    const activeSession = currentSession(req);
    if (activeSession && ids.includes(activeSession.user.id)) return res.status(400).json({ error: 'No puedes eliminar la cuenta con la que tienes la sesión activa.' });
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const targets = rows.filter(({ data }) => ids.includes(data.id));
    if (!targets.length) return res.status(404).json({ error: 'No se encontraron los usuarios seleccionados.' });
    const keep = rows.filter(({ data }) => !ids.includes(data.id));
    const values = [headers, ...keep.map(({ data }) => headers.map((header) => data[normalizeUsersHeader(header)] ?? ''))];
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${USERS_SHEET}!A:Z`)}:clear`, { method: 'POST', body: JSON.stringify({}) });
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${USERS_SHEET}!A1`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values }) });
    for (const [token, session] of sessions) if (ids.includes(session.user.id)) sessions.delete(token);
    res.json({ message: `Se eliminaron ${targets.length} usuario(s) de la hoja Usuarios.`, count: targets.length });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudieron eliminar los usuarios.' }); }
});

app.post('/api/auth/admin/credentials', requireAdmin, async (req, res) => {
  try {
    const id = String(req.body?.id || '');
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (username.length < 4 || username.length > 64 || password.length < 10 || password.length > 256) return res.status(400).json({ error: 'El usuario debe tener entre 4 y 64 caracteres y la contraseña al menos 10.' });
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const target = rows.find(({ data }) => data.id === id);
    if (!target) return res.status(404).json({ error: 'No se encontró el usuario.' });
    if (rows.some(({ data }) => data.id !== id && normalizeUsername(data.usuario) === normalizeUsername(username))) return res.status(409).json({ error: 'Ese nombre de usuario ya está ocupado.' });
    target.data.usuario = username;
    target.data.contrasena_salt = randomBytes(16).toString('hex');
    target.data.contrasena_hash = scryptSync(password, target.data.contrasena_salt, 64).toString('hex');
    await writeUserRow(spreadsheetId, headers, target.rowNumber, target.data);
    res.json({ message: 'Credenciales actualizadas correctamente.' });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudieron guardar las credenciales.' }); }
});

app.post('/api/auth/admin/sync-users', requireAdmin, async (req, res) => {
  try {
    const incoming = Array.isArray(req.body?.users) ? req.body.users : null;
    if (!incoming || incoming.length > 1000) return res.status(400).json({ error: 'La lista de usuarios no es válida.' });
    const { spreadsheetId, rows } = await readUsersSheet();
    const byId = new Map(rows.map(({ data }) => [data.id, data]));
    const claimedIds = new Set<string>();
    const merged: Record<string, string>[] = incoming.map((raw: Record<string, unknown>) => {
      const id = String(raw.id ?? '');
      const email = normalizeUsername(raw.email);
      const existing = byId.get(id) || rows.find(({ data }) =>
        !claimedIds.has(data.id) && email && normalizeUsername(data.email) === email
      )?.data || {};
      if (existing.id) claimedIds.add(existing.id);
      const safe: Record<string, string> = Object.fromEntries(Object.entries(raw)
        .filter(([key]) => !AUTH_HEADERS.includes(key))
        .map(([key, value]) => [key, value === null || value === undefined ? '' : String(value)]));
      return { ...existing, ...safe };
    });
    for (const { data } of rows) {
      if (!claimedIds.has(data.id) && !merged.some((record) => record.id === data.id)) merged.push(data);
    }
    const mergedHeaders = [...new Set(merged.flatMap((row) => Object.keys(row).map(normalizeUsersHeader)))];
    const nextHeaders = [...new Set([...USER_PROFILE_HEADERS, ...AUTH_HEADERS, ...mergedHeaders])];
    const valueRows = [nextHeaders, ...merged.map((row) => nextHeaders.map((header) => row[header] ?? ''))];
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${USERS_SHEET}!A:Z`)}:clear`, { method: 'POST', body: JSON.stringify({}) });
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${USERS_SHEET}!A1`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: valueRows }) });
    res.json({ count: merged.length });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo sincronizar la hoja Usuarios.' }); }
});

app.get('/api/backups/config', requireAdmin, (_req, res) => res.json(publicBackupConfig()));

app.post('/api/backups/config', requireAdmin, async (req, res) => {
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

app.post('/api/backups/run', requireAdmin, async (_req, res) => {
  try { res.json({ backup: await runDriveBackup('Manual'), config: publicBackupConfig() }); }
  catch (error) { res.status(502).json({ error: error instanceof Error ? error.message : 'No se pudo crear el respaldo.' }); }
});

app.use('/api/google-sheets', requireAdmin, async (req, res) => {
  try {
    // Express strips the mounted /api/google-sheets prefix from req.url.
    // req.originalUrl can still contain Vercel's internal rewrite query and
    // must not be forwarded to the Google API.
    const requestUrl = new URL(req.url, 'https://sheets.googleapis.com');
    requestUrl.searchParams.delete('__vercel_path');
    requestUrl.searchParams.delete('route');
    const upstreamPath = `${requestUrl.pathname}${requestUrl.search}`;
    if (!upstreamPath.startsWith('/v4/') || upstreamPath.includes('..')) {
      return res.status(400).json({ error: { message: 'Ruta de Google Sheets inválida.' } });
    }
    const token = await accessToken();
    const upstream = await fetch(`https://sheets.googleapis.com${upstreamPath}`, { method: req.method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body) });
    res.status(upstream.status);
    const body = await upstream.text();
    res.type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (error) { res.status(502).json({ error: { message: error instanceof Error ? error.message : 'Error de conexión con Google Sheets' } }); }
});

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else if (process.env.VERCEL !== '1') {
  app.use(express.static(path.join(root, 'dist')));
  app.get(['/admin', '/admin/*', '/login', '/acceso', '/acceso/*', '/empleado', '/empleado/*', '/cliente', '/cliente/*', '/proveedor', '/proveedor/*', '/catalogo', '/nosotros', '/contacto'], (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}

const server = createServer(app);
await loadBackupConfig();
await migrateCompanyRucHeaderToNit()
  .then((result) => console.log(result === 'renamed'
    ? 'Se renombró la columna RUC a NIT en la pestaña empresas de Google Sheets.'
    : 'La pestaña empresas ya utiliza la columna NIT.'))
  .catch((error: unknown) => {
    console.error('No se pudo renombrar RUC a NIT en la pestaña empresas:', error instanceof Error ? error.message : 'Error desconocido');
  });
void readUsersSheet().then(() => console.log('Columnas de autenticación listas en Google Sheets.')).catch((error) => console.error('No se pudieron preparar las columnas de autenticación en Google Sheets:', error instanceof Error ? error.message : 'Error desconocido'));
if (process.env.VERCEL !== '1') {
  const quoteSpreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
  if (quoteSpreadsheetId) void ensureQuotesSheet(quoteSpreadsheetId)
    .then(() => console.log('Hoja Cotizaciones lista en Google Sheets.'))
    .catch((error) => console.error('No se pudo preparar la hoja Cotizaciones:', error instanceof Error ? error.message : 'Error desconocido'));
}
if (process.env.VERCEL !== '1') {
  setInterval(() => { void checkScheduledBackup(); }, 30_000);
  void checkScheduledBackup();
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Imperio Lux disponible en puerto ${process.env.PORT || 3000}`));
}

export default app;
