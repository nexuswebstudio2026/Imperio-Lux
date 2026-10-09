import express from 'express';
import 'dotenv/config';
import { createServer } from 'node:http';
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json({ limit: '10mb' }));
const root = path.dirname(fileURLToPath(import.meta.url));
let tokenCache: { token: string; expires: number } | null = null;

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
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Imperio Lux disponible en puerto ${process.env.PORT || 3000}`));
