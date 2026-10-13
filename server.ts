import express from 'express';
import 'dotenv/config';
import { createServer } from 'node:http';
import { createSign, randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json({ limit: '10mb' }));
const root = path.dirname(fileURLToPath(import.meta.url));
const backupConfigPath = process.env.BACKUP_CONFIG_FILE || path.join(root, '.runtime', 'backup-scheduler.json');
let tokenCache: { token: string; expires: number } | null = null;

type AuthUser = { id: string; name: string; email: string; role: string; type: 'admin' | 'employee' | 'client' };
const sessions = new Map<string, { user: AuthUser; expires: number }>();
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const recoveryCodes = new Map<string, { codeHash: string; expires: number; attempts: number; row: Record<string, string>; headers: string[]; mode: 'username' | 'password' }>();
const recoveryRequestAttempts = new Map<string, { count: number; resetAt: number }>();
const USERS_SHEET = 'Usuarios';
const AUTH_HEADERS = ['usuario', 'contrasena_salt', 'contrasena_hash'];

async function readUsersSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId;
  const range = encodeURIComponent(`${USERS_SHEET}!A:Z`);
  const data = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
  const values: unknown[][] = data.values || [];
  const headers = (values[0] || []).map((v) => String(v || '').trim());
  const missing = AUTH_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) {
    const nextHeaders = [...headers, ...missing];
    await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${USERS_SHEET}!A1`)}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [nextHeaders] }),
    });
    headers.push(...missing);
  }
  if (!headers.length) throw new Error('La hoja Usuarios debe incluir sus encabezados y los datos de cada cuenta.');
  const rows = values.slice(1).map((valuesRow, index) => ({
    rowNumber: index + 2,
    data: Object.fromEntries(headers.map((header, i) => [header, String(valuesRow[i] ?? '').trim()])),
  }));
  return { spreadsheetId, headers, rows };
}

async function writeUserRow(spreadsheetId: string, headers: string[], rowNumber: number, row: Record<string, string>) {
  const values = headers.map((header) => row[header] ?? '');
  await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${USERS_SHEET}!A${rowNumber}`)}?valueInputOption=RAW`, {
    method: 'PUT', body: JSON.stringify({ values: [values] }),
  });
}

function normalizeUsername(value: unknown) { return String(value || '').trim().toLocaleLowerCase('es'); }
function verifyPassword(password: string, salt: string, hash: string) {
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function classifyUser(row: Record<string, string>): AuthUser['type'] {
  const type = `${row.tipo_usuario || ''} ${row.rol || ''} ${row.role || ''}`.toLocaleLowerCase('es');
  if (/admin|administrador/.test(type)) return 'admin';
  if (/empleado|employee|cajero|vendedor/.test(type)) return 'employee';
  return 'client';
}
function safeUser(row: Record<string, string>): AuthUser {
  const type = classifyUser(row);
  return { id: row.id, name: row.nombre || row.name || 'Usuario', email: row.email || '', role: row.rol || row.role || row.tipo_usuario || type, type };
}
function currentSession(req: express.Request) {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('imperio_session='))?.slice('imperio_session='.length);
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return null; }
  return { token: token!, ...session };
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

// Stable database health endpoint for the client. Credentials stay on this server;
// the browser receives connection metadata only, never a Google access token.
app.get('/api/database/status', async (_req, res) => {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || await readFile(process.env.GOOGLE_SERVICE_ACCOUNT_FILE || path.join(root, 'service-account.json'), 'utf8'));
    const spreadsheetId = String(_req.query.spreadsheetId || process.env.GOOGLE_SHEETS_ID || backupConfig.spreadsheetId);
    const result = await googleApi(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties.title`);
    res.json({ connected: true, provider: 'google-sheets', spreadsheetId, spreadsheetTitle: result.properties?.title || '', serviceAccount: credentials.client_email });
  } catch (error) {
    res.status(503).json({ connected: false, provider: 'google-sheets', error: error instanceof Error ? error.message : 'No se pudo conectar con Google Sheets.' });
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
    const found = rows.find(({ data }) => normalizeUsername(data.usuario) === username && data.estado.toLowerCase() !== 'false' && data.estado.toLowerCase() !== 'inactivo');
    if (!found || !verifyPassword(password, found.data.contrasena_salt, found.data.contrasena_hash)) {
      const current = loginAttempts.get(ip);
      loginAttempts.set(ip, { count: current?.resetAt && current.resetAt > Date.now() ? (current.count + 1) : 1, resetAt: current?.resetAt && current.resetAt > Date.now() ? current.resetAt : Date.now() + 15 * 60_000 });
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    loginAttempts.delete(ip);
    const token = randomBytes(32).toString('base64url');
    const user = safeUser(found.data);
    sessions.set(token, { user, expires: Date.now() + 12 * 60 * 60_000 });
    res.setHeader('Set-Cookie', `imperio_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ user });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo validar la cuenta en Google Sheets.' }); }
});

app.post('/api/auth/logout', (req, res) => {
  const session = currentSession(req);
  if (session) sessions.delete(session.token);
  res.setHeader('Set-Cookie', 'imperio_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
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
    const { rows } = await readUsersSheet();
    const normalized = normalizeUsername(identifier);
    const recoveryId = randomBytes(24).toString('base64url');
    const found = mode === 'username'
      ? rows.find(({ data }) => data.email.toLocaleLowerCase('es') === normalized)
      : rows.find(({ data }) => normalizeUsername(data.usuario) === normalized);
    if (found?.data.email) {
      const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
      const codeHash = createHash('sha256').update(code).digest('hex');
      recoveryCodes.set(recoveryId, { codeHash, expires: Date.now() + 10 * 60_000, attempts: 0, row: found.data, headers: (await readUsersSheet()).headers, mode });
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
      const text = mode === 'username'
        ? `Tu usuario de Imperio Lux es: ${found.data.usuario || '(sin usuario asignado)'}. Código de verificación: ${code}. Vence en 10 minutos.`
        : `Tu código para restablecer la contraseña de Imperio Lux es: ${code}. Vence en 10 minutos.`;
      await transporter.sendMail({ from: process.env.SMTP_FROM, to: found.data.email, subject: 'Recuperación de cuenta · Imperio Lux', text });
    }
    // Generic response and opaque handle prevent revealing whether a username or email exists.
    res.json({ message: 'Si los datos corresponden a una cuenta, recibirás instrucciones en el correo registrado.', recoveryId });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo enviar el correo de recuperación.' }); }
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
    res.json({ users: rows.map(({ data }) => ({ id: data.id, name: data.nombre || data.name || '', email: data.email || '', type: classifyUser(data), username: data.usuario || '', configured: Boolean(data.contrasena_hash) })) });
  } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo leer la hoja Usuarios.' }); }
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
    const { spreadsheetId, headers, rows } = await readUsersSheet();
    const byId = new Map(rows.map(({ data }) => [data.id, data]));
    const merged: Record<string, string>[] = incoming.map((raw: Record<string, unknown>) => {
      const id = String(raw.id ?? '');
      const existing = byId.get(id) || {};
      const safe: Record<string, string> = Object.fromEntries(Object.entries(raw)
        .filter(([key]) => !AUTH_HEADERS.includes(key))
        .map(([key, value]) => [key, value === null || value === undefined ? '' : String(value)]));
      return { ...existing, ...safe };
    });
    const mergedHeaders = [...new Set(merged.flatMap((row) => Object.keys(row)))];
    const nextHeaders = [...headers, ...mergedHeaders.filter((header) => !headers.includes(header))];
    const valueRows = [nextHeaders, ...merged.map((row) => nextHeaders.map((header) => row[header] || ''))];
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
    const upstreamPath = req.originalUrl.replace(/^\/api\/google-sheets/, '');
    if (upstreamPath.includes('..')) return res.status(400).json({ error: { message: 'Ruta inválida' } });
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
  app.get(['/admin', '/login', '/empleado', '/cliente'], (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}

const server = createServer(app);
await loadBackupConfig();
void readUsersSheet().then(() => console.log('Columnas de autenticación listas en Google Sheets.')).catch((error) => console.error('No se pudieron preparar las columnas de autenticación en Google Sheets:', error instanceof Error ? error.message : 'Error desconocido'));
if (process.env.VERCEL !== '1') {
  setInterval(() => { void checkScheduledBackup(); }, 30_000);
  void checkScheduledBackup();
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Imperio Lux disponible en puerto ${process.env.PORT || 3000}`));
}

export default app;
