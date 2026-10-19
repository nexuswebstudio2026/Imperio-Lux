/**
 * Google Sheets Database Service for Imperio Lux
 * Manages Google Sheets as the cloud database engine using Google Sheets API v4.
 */
import { requestGoogleSheetsApi } from './databaseApi';

async function apiErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({})) as {
    error?: string | { message?: string };
    message?: string;
  };
  const message = typeof body.error === 'string'
    ? body.error
    : body.error?.message || body.message;

  if (response.status === 401 && message?.toLowerCase().includes('inicia sesión')) {
    return 'La sesión de administrador no está activa. Vuelve a iniciar sesión en el panel y repite la sincronización.';
  }

  return message || `${fallback} (HTTP ${response.status})`;
}

export const DEFAULT_SPREADSHEET_ID = '1CzufAtWYpkx5dYWjPiqdltMyiuIWeR7G4zTKy3_uxcg';
const PREVIOUS_DEFAULT_SPREADSHEET_ID = '12hdlu9ph-YSU9IfwXh44cqJVHjaNxQD3MP3CXyrfwwk';
const SPREADSHEET_ID_STORAGE_KEY = 'pv_sheets_spreadsheet_id';
const SPREADSHEETS_HISTORY_STORAGE_KEY = 'pv_sheets_history_list';

/**
 * Cleanly extracts a Google Spreadsheet ID from either a raw ID or full Google Sheets URL.
 * Handles forms like:
 * - 1CzufAtWYpkx5dYWjPiqdltMyiuIWeR7G4zTKy3_uxcg
 * - https://docs.google.com/spreadsheets/d/1CzufAtWYpkx5dYWjPiqdltMyiuIWeR7G4zTKy3_uxcg/edit#gid=0
 * - https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Remove any query params or trailing slashes if pasted without full path
  return trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');
}

export interface LinkedSpreadsheet {
  id: string;
  title: string;
  url: string;
  sheetsCount?: number;
  lastValidated?: string;
  isDefault?: boolean;
}

export function getLinkedSpreadsheetsHistory(): LinkedSpreadsheet[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(SPREADSHEETS_HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // Default preset
  return [
    {
      id: DEFAULT_SPREADSHEET_ID,
      title: 'Imperio Lux - Base de Datos Central (Predeterminada)',
      url: `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`,
      sheetsCount: 22,
      isDefault: true,
    },
  ];
}

export function saveLinkedSpreadsheet(item: LinkedSpreadsheet): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = getLinkedSpreadsheetsHistory();
      const filtered = current.filter((s) => s.id !== item.id);
      const updated = [item, ...filtered].slice(0, 8); // Keep last 8
      localStorage.setItem(SPREADSHEETS_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    // ignore
  }
}

export function removeLinkedSpreadsheet(id: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = getLinkedSpreadsheetsHistory();
      const updated = current.filter((s) => s.id !== id);
      localStorage.setItem(SPREADSHEETS_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    // ignore
  }
}

export function getStoredSpreadsheetId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
      if (stored && stored.trim()) {
        const cleanId = extractSpreadsheetId(stored.trim());
        if (cleanId === PREVIOUS_DEFAULT_SPREADSHEET_ID) {
          localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, DEFAULT_SPREADSHEET_ID);
          return DEFAULT_SPREADSHEET_ID;
        }
        return cleanId;
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SPREADSHEET_ID;
}

export function setStoredSpreadsheetId(id: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const clean = extractSpreadsheetId(id);
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, clean);
    }
  } catch (e) {
    // ignore
  }
}

export function getSpreadsheetUrl(spreadsheetId: string = getStoredSpreadsheetId()): string {
  const clean = extractSpreadsheetId(spreadsheetId);
  return `https://docs.google.com/spreadsheets/d/${clean}/edit`;
}

export interface ConnectionValidationResult {
  success: boolean;
  spreadsheetId: string;
  title?: string;
  url?: string;
  sheetsCount?: number;
  sheets?: SheetTabInfo[];
  latencyMs?: number;
  validatedAt?: string;
  error?: string;
}

/**
 * Validates connection to a specific Google Spreadsheet before allowing data sync.
 * Checks:
 * 1. Valid Access Token
 * 2. ID structure
 * 3. Accessibility / Permissions (read properties and tabs)
 * 4. Latency and tab count
 */
export async function validateSpreadsheetConnection(
  accessToken: string,
  rawSpreadsheetId: string
): Promise<ConnectionValidationResult> {
  const startTime = Date.now();
  const cleanId = extractSpreadsheetId(rawSpreadsheetId);

  if (!cleanId) {
    return {
      success: false,
      spreadsheetId: '',
      error: 'Debes ingresar un ID de hoja de cálculo válido o enlace de Google Sheets.',
    };
  }

  if (!accessToken) {
    return {
      success: false,
      spreadsheetId: cleanId,
      error: 'Sesión no iniciada. Debes autenticarte con tu cuenta de Google para validar la hoja.',
    };
  }

  try {
    const meta = await fetchSpreadsheetMetadata(accessToken, cleanId);
    const latencyMs = Date.now() - startTime;
    const validatedAt = new Date().toISOString();

    const result: ConnectionValidationResult = {
      success: true,
      spreadsheetId: cleanId,
      title: meta.title || 'Hoja de Cálculo de Google',
      url: getSpreadsheetUrl(cleanId),
      sheetsCount: meta.sheets.length,
      sheets: meta.sheets,
      latencyMs,
      validatedAt,
    };

    // Save to history automatically on successful validation
    saveLinkedSpreadsheet({
      id: cleanId,
      title: meta.title || 'Hoja de Cálculo',
      url: getSpreadsheetUrl(cleanId),
      sheetsCount: meta.sheets.length,
      lastValidated: validatedAt,
      isDefault: cleanId === DEFAULT_SPREADSHEET_ID,
    });

    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    let message = err?.message || 'Error desconocido al validar la hoja de cálculo.';

    if (message.includes('404')) {
      message = `No se encontró la hoja de cálculo con ID "${cleanId}". Verifica que el ID sea correcto y que el documento exista en Google Drive.`;
    } else if (message.includes('403')) {
      message = `Permisos insuficientes para acceder a la hoja "${cleanId}". Asegúrate de que el documento esté compartido con permisos de lectura/edición para tu cuenta de Google.`;
    }

    return {
      success: false,
      spreadsheetId: cleanId,
      latencyMs,
      error: message,
    };
  }
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetTabInfo[];
}

/**
 * Fetch spreadsheet metadata and list of sheet tabs
 */
export async function fetchSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string = getStoredSpreadsheetId()
): Promise<SpreadsheetMetadata> {
  const url = `/api/google-sheets/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`;
  const res = await requestGoogleSheetsApi(url.replace('/api/google-sheets', ''), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(await apiErrorMessage(res, 'No se pudo consultar Google Sheets.'));
  }

  const data = await res.json();
  return {
    spreadsheetId,
    title: data.properties?.title || 'Hoja de Cálculo',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties.gridProperties?.rowCount,
      columnCount: s.properties.gridProperties?.columnCount,
    })),
  };
}

/**
 * Create tabs in the spreadsheet if they don't already exist
 */
export async function ensureSheetTabsExist(
  accessToken: string,
  spreadsheetId: string,
  requiredTabNames: string[],
  existingTabs: string[]
): Promise<void> {
  const missingTabs = requiredTabNames.filter((tab) => !existingTabs.includes(tab));
  if (missingTabs.length === 0) return;

  const requests = missingTabs.map((title) => ({
    addSheet: {
      properties: {
        title,
        gridProperties: {
          rowCount: 1000,
          columnCount: 26,
        },
      },
    },
  }));

  const url = `/api/google-sheets/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const res = await requestGoogleSheetsApi(url.replace('/api/google-sheets', ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    throw new Error(await apiErrorMessage(res, 'No se pudieron crear las pestañas faltantes en Google Sheets.'));
  }
}

export const TABLE_DEFAULT_HEADERS: Record<string, string[]> = {
  productos: ['id', 'codigo', 'nombre', 'descripcion', 'categoria_id', 'marca_id', 'presentacion_id', 'precio_compra', 'precio_venta', 'stock', 'stock_minimo', 'estado', 'created_at', 'FotoProducto'],
  categorias: ['id', 'nombre', 'descripcion', 'estado'],
  marcas: ['id', 'nombre', 'descripcion', 'estado'],
  presentaciones: ['id', 'nombre', 'simbolo', 'estado'],
  clientes: ['id', 'tipo_documento', 'numero_documento', 'nombre_razon_social', 'telefono', 'email', 'direccion', 'estado', 'created_at'],
  proveedores: ['id', 'tipo_documento', 'numero_documento', 'nombre_razon_social', 'contacto_nombre', 'telefono', 'email', 'direccion', 'estado'],
  empleados: ['id', 'nombre', 'apellido', 'nombre_completo', 'tipo_documento', 'numero_documento', 'cargo', 'telefono', 'email', 'salario', 'fecha_ingreso', 'estado'],
  ventas: ['id', 'serie', 'numero', 'cliente_id', 'cliente_nombre', 'tipo_comprobante', 'metodo_pago', 'subtotal', 'igv', 'total', 'estado', 'fecha_venta'],
  compras: ['id', 'serie', 'numero', 'proveedor_id', 'proveedor_nombre', 'tipo_comprobante', 'metodo_pago', 'subtotal', 'igv', 'total', 'estado', 'fecha_compra'],
  cajas: ['id', 'nombre', 'usuario_id', 'monto_apertura', 'monto_cierre', 'total_ventas', 'estado', 'fecha_apertura', 'fecha_cierre'],
  movimientos_caja: ['id', 'caja_id', 'tipo', 'concepto', 'monto', 'usuario_id', 'fecha'],
  inventario_ajustes: ['id', 'producto_id', 'producto_nombre', 'tipo_ajuste', 'cantidad', 'motivo', 'usuario_id', 'fecha'],
  kardex: ['id', 'producto_id', 'producto_nombre', 'tipo_movimiento', 'motivo', 'cantidad', 'costo_unitario', 'total', 'saldo_stock', 'fecha'],
  empresas: ['id', 'nombre', 'propietario', 'NIT', 'porcentaje_impuesto', 'abreviatura_impuesto', 'direccion', 'ubicacion', 'telefono', 'correo', 'moneda_id'],
  users: ['id', 'name', 'email', 'role_id', 'role_name', 'status', 'created_at'],
  Usuarios: ['id', 'tipo_usuario', 'nombre', 'email', 'cargo', 'rol', 'estado', 'usuario', 'contrasena_salt', 'contrasena_hash'],
  roles: ['id', 'name', 'description', 'permissions'],
  monedas: ['id', 'estandar_iso', 'nombre_completo', 'simbolo'],
  documentos: ['id', 'nombre'],
  comprobantes: ['id', 'nombre', 'serie', 'correlativo', 'es_default'],
  activity_logs: ['id', 'usuario_id', 'usuario_nombre', 'modulo', 'accion', 'descripcion', 'fecha'],
  notificaciones: ['id', 'titulo', 'mensaje', 'tipo', 'leida', 'fecha'],
};

export function objectsToSheetRows(
  records: Record<string, unknown>[],
  tableName?: string
): { headers: string[]; rows: unknown[][] } {
  const normalizedRecords: Record<string, unknown>[] = tableName === 'productos'
    ? records.map((record): Record<string, unknown> => {
      const { imagen, FotoProducto, ...rest } = record;
      return { ...rest, FotoProducto: FotoProducto ?? imagen ?? '' };
    })
    : tableName === 'empresas'
      ? records.map((record): Record<string, unknown> => {
        const { ruc, NIT, ...rest } = record;
        return { ...rest, NIT: NIT ?? ruc ?? '' };
      })
    : records;

  const keySet = new Set<string>();
  normalizedRecords.forEach((record) => Object.keys(record).forEach((key) => keySet.add(key)));
  const knownHeaders = tableName ? TABLE_DEFAULT_HEADERS[tableName] : undefined;
  const headers = knownHeaders
    ? [...knownHeaders.filter((header) => keySet.has(header)), ...[...keySet].filter((header) => !knownHeaders.includes(header))]
    : [...keySet];

  if (headers.length === 0) headers.push(...(knownHeaders || ['id', 'estado']));
  const rows = normalizedRecords.map((record) => headers.map((header) => {
    const value = record[header];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return value;
  }));
  return { headers, rows };
}

export function sheetRowsToObjects(values: unknown[][], tableName?: string): Record<string, unknown>[] {
  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header ?? '').trim());
  return values.slice(1)
    .map((row) => {
      const record: Record<string, unknown> = {};
      let hasData = false;
      headers.forEach((header, index) => {
        if (!header) return;
        const value = row[index];
        if (value === undefined || value === null || value === '') {
          record[header] = '';
          return;
        }
        hasData = true;
        const normalized = String(value).trim();
        if (normalized.toUpperCase() === 'TRUE') record[header] = true;
        else if (normalized.toUpperCase() === 'FALSE') record[header] = false;
        else if (/^-?\d+(?:\.\d+)?$/.test(normalized)) record[header] = Number(normalized);
        else if ((normalized.startsWith('{') && normalized.endsWith('}')) || (normalized.startsWith('[') && normalized.endsWith(']'))) {
          try { record[header] = JSON.parse(normalized); }
          catch { record[header] = normalized; }
        } else record[header] = normalized;
      });
      if (tableName === 'productos' && !('imagen' in record) && 'FotoProducto' in record) {
        record.imagen = record.FotoProducto;
        delete record.FotoProducto;
      }
      if (tableName === 'empresas' && !('ruc' in record) && 'NIT' in record) {
        record.ruc = record.NIT;
        delete record.NIT;
      }
      return hasData ? record : null;
    })
    .filter((record): record is Record<string, unknown> => record !== null);
}

export async function writeTableToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  records: Record<string, unknown>[]
): Promise<number> {
  void accessToken;
  const { headers, rows } = objectsToSheetRows(records, sheetName);
  const range = encodeURIComponent(`${sheetName}!A:ZZ`);
  const clearResponse = await requestGoogleSheetsApi(`/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!clearResponse.ok) {
    throw new Error(await apiErrorMessage(clearResponse, `No se pudo limpiar la pestaña "${sheetName}".`));
  }
  const writeResponse = await requestGoogleSheetsApi(
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A1`)}?valueInputOption=USER_ENTERED`,
    { method: 'PUT', body: JSON.stringify({ values: [headers, ...rows] }) }
  );
  if (!writeResponse.ok) {
    throw new Error(await apiErrorMessage(writeResponse, `No se pudo guardar la pestaña "${sheetName}".`));
  }
  return records.length;
}

export async function readTableFromSheet<T = Record<string, unknown>>(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<T[]> {
  void accessToken;
  const response = await requestGoogleSheetsApi(
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:ZZ`)}?valueRenderOption=UNFORMATTED_VALUE`
  );
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, `No se pudo leer la pestaña "${sheetName}".`));
  }
  const data = await response.json() as { values?: unknown[][] };
  return sheetRowsToObjects(data.values || [], sheetName) as T[];
}

export async function readTablesFromSheets(
  accessToken: string,
  spreadsheetId: string,
  sheetNames: string[]
): Promise<Map<string, unknown[]>> {
  if (sheetNames.length === 0) return new Map();

  void accessToken;
  const ranges = sheetNames.map((sheetName) => `ranges=${encodeURIComponent(`${sheetName}!A:ZZ`)}`).join('&');
  const response = await requestGoogleSheetsApi(
    `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE`
  );
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, 'No se pudieron leer las pestañas de Google Sheets.'));
  }

  const data = await response.json() as { valueRanges?: Array<{ values?: unknown[][] }> };
  if (!Array.isArray(data.valueRanges) || data.valueRanges.length !== sheetNames.length) {
    throw new Error('Google Sheets devolvió una respuesta incompleta al leer varias pestañas.');
  }

  return new Map(sheetNames.map((sheetName, index) => [
    sheetName,
    sheetRowsToObjects(data.valueRanges?.[index]?.values || [], sheetName),
  ]));
}

export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  record: Record<string, unknown>
): Promise<void> {
  void accessToken;
  const rows = objectsToSheetRows([record], sheetName);
  const response = await requestGoogleSheetsApi(
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:ZZ`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: rows.rows }) }
  );
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, `No se pudo agregar el registro a "${sheetName}".`));
  }
}
