/**
 * Google Sheets Database Service for Imperio Lux
 * Manages Google Sheets as the cloud database engine using Google Sheets API v4.
 */

export const DEFAULT_SPREADSHEET_ID = '12hdlu9ph-YSU9IfwXh44cqJVHjaNxQD3MP3CXyrfwwk';
const SPREADSHEET_ID_STORAGE_KEY = 'pv_sheets_spreadsheet_id';

export function getStoredSpreadsheetId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SPREADSHEET_ID;
}

export function setStoredSpreadsheetId(id: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, id.trim());
    }
  } catch (e) {
    // ignore
  }
}

export function getSpreadsheetUrl(spreadsheetId: string = getStoredSpreadsheetId()): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ||
        `Error HTTP ${res.status} al consultar Google Sheets (${res.statusText})`
    );
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

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.warn('Could not add some tabs, continuing:', errBody);
  }
}

/**
 * Convert an array of objects into a 2D array of [headers, ...rows]
 */
export function objectsToSheetRows(records: any[]): { headers: string[]; rows: any[][] } {
  if (!records || records.length === 0) {
    return { headers: ['id', 'estado'], rows: [] };
  }

  // Collect all unique keys from all records to ensure no columns are missed
  const keySet = new Set<string>();
  records.forEach((rec) => {
    if (rec && typeof rec === 'object') {
      Object.keys(rec).forEach((k) => keySet.add(k));
    }
  });

  const headers = Array.from(keySet);
  // Put 'id' first if present
  if (headers.includes('id')) {
    const idx = headers.indexOf('id');
    headers.splice(idx, 1);
    headers.unshift('id');
  }

  const rows = records.map((rec) => {
    return headers.map((header) => {
      const val = rec[header];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return val;
    });
  });

  return { headers, rows };
}

/**
 * Convert 2D sheet rows into array of objects
 */
export function sheetRowsToObjects(values: any[][]): any[] {
  if (!values || values.length < 2) return [];

  const headers = values[0].map((h: any) => String(h || '').trim());
  const dataRows = values.slice(1);

  return dataRows
    .map((row) => {
      const obj: any = {};
      let hasData = false;

      headers.forEach((header, index) => {
        if (!header) return;
        let val = row[index];
        if (val === undefined || val === null || val === '') {
          obj[header] = '';
          return;
        }

        hasData = true;
        const strVal = String(val).trim();

        // Convert booleans
        if (strVal.toUpperCase() === 'TRUE') {
          obj[header] = true;
        } else if (strVal.toUpperCase() === 'FALSE') {
          obj[header] = false;
        } else if (/^-?\d+(\.\d+)?$/.test(strVal)) {
          // Convert numbers if numeric string
          const num = Number(strVal);
          obj[header] = isNaN(num) ? strVal : num;
        } else if ((strVal.startsWith('{') && strVal.endsWith('}')) || (strVal.startsWith('[') && strVal.endsWith(']'))) {
          // Parse JSON if possible
          try {
            obj[header] = JSON.parse(strVal);
          } catch {
            obj[header] = strVal;
          }
        } else {
          obj[header] = strVal;
        }
      });

      return hasData ? obj : null;
    })
    .filter(Boolean);
}

/**
 * Upload a single table into a sheet tab (clears and writes new content)
 */
export async function writeTableToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  records: any[]
): Promise<number> {
  const { headers, rows } = objectsToSheetRows(records);
  const values = [headers, ...rows];

  // 1. Clear existing sheet content
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  }).catch(() => {});

  // 2. Write new values
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Error al escribir en pestaña ${sheetName} de Google Sheets`
    );
  }

  return records.length;
}

/**
 * Read records from a sheet tab
 */
export async function readTableFromSheet<T = any>(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<T[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?valueRenderOption=UNFORMATTED_VALUE`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Error al leer pestaña ${sheetName} de Google Sheets`
    );
  }

  const data = await res.json();
  return sheetRowsToObjects(data.values || []) as T[];
}

/**
 * Append a single row to a sheet tab
 */
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rowRecord: any
): Promise<void> {
  // Read header row to match order
  const getHeaderUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!1:1`;
  const headerRes = await fetch(getHeaderUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let headers: string[] = [];
  if (headerRes.ok) {
    const headerData = await headerRes.json();
    headers = (headerData.values?.[0] || []).map((h: any) => String(h).trim());
  }

  if (headers.length === 0) {
    // If no header yet, write table with this record
    await writeTableToSheet(accessToken, spreadsheetId, sheetName, [rowRecord]);
    return;
  }

  const rowValues = headers.map((header) => {
    const val = rowRecord[header];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return val;
  });

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`;
  await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [rowValues] }),
  });
}
