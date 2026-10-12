/** Client for the server-side Google Sheets database API. Service-account
 * credentials and Google access tokens never leave the Node server. */
export interface DatabaseConnectionStatus {
  connected: boolean;
  provider: 'google-sheets';
  spreadsheetId?: string;
  spreadsheetTitle?: string;
  serviceAccount?: string;
  error?: string;
}

export async function checkDatabaseConnection(spreadsheetId?: string): Promise<DatabaseConnectionStatus> {
  const query = spreadsheetId ? `?spreadsheetId=${encodeURIComponent(spreadsheetId)}` : '';
  const response = await fetch(`/api/database/status${query}`);
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.connected) {
    throw new Error(result.error || `No se pudo conectar con la base de datos (HTTP ${response.status}).`);
  }
  return result as DatabaseConnectionStatus;
}

/** Calls the Google Sheets API through the server proxy, which adds the
 * service-account access token. This is intentionally same-origin only. */
export async function requestGoogleSheetsApi(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/v4/') || path.includes('..')) {
    throw new Error('Ruta de Google Sheets inválida.');
  }
  return fetch(`/api/google-sheets${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}
