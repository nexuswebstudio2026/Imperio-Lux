import * as XLSX from 'xlsx';

export interface TableExportItem {
  name: string;
  label?: string;
  data: any[];
}

/**
 * Format a record so values look clean in Excel
 */
function formatRecordForExcel(record: any): any {
  if (!record || typeof record !== 'object') return record;
  const formatted: any = {};
  for (const [key, val] of Object.entries(record)) {
    if (val === null || val === undefined) {
      formatted[key] = '';
    } else if (typeof val === 'boolean') {
      formatted[key] = val ? 'SÍ' : 'NO';
    } else if (typeof val === 'object') {
      try {
        formatted[key] = JSON.stringify(val);
      } catch {
        formatted[key] = String(val);
      }
    } else {
      formatted[key] = val;
    }
  }
  return formatted;
}

/**
 * Calculate auto column widths for a worksheet
 */
function autoFitColumns(ws: XLSX.WorkSheet, data: any[]) {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0] || {});
  const colWidths = keys.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(data.length, 100); i++) {
      const cellVal = String(data[i]?.[key] ?? '');
      if (cellVal.length > maxLen) {
        maxLen = Math.min(cellVal.length, 50); // Cap at 50 chars wide
      }
    }
    return { wch: Math.max(maxLen + 3, 10) };
  });
  ws['!cols'] = colWidths;
}

/**
 * Export all 21 tables of the database to a multi-tab Excel (.xlsx) file
 */
export function exportAllTablesToExcel(
  tables: TableExportItem[],
  filename: string = `Imperio_Lux_BaseDatos_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const wb = XLSX.utils.book_new();

  tables.forEach((table) => {
    const rawData = table.data || [];
    const formattedData =
      rawData.length > 0
        ? rawData.map(formatRecordForExcel)
        : [{ id: 1, info: 'Sin registros en esta tabla' }];

    const ws = XLSX.utils.json_to_sheet(formattedData);
    autoFitColumns(ws, formattedData);

    // Sheet names in Excel must be <= 31 chars and not contain: \ / ? * : [ ]
    let sheetName = (table.name || 'Hoja').slice(0, 31).replace(/[\\/?*:\[\]]/g, '_');
    // Ensure uniqueness
    let finalName = sheetName;
    let counter = 1;
    while (wb.SheetNames.includes(finalName)) {
      finalName = `${sheetName.slice(0, 28)}_${counter++}`;
    }

    XLSX.utils.book_append_sheet(wb, ws, finalName);
  });

  XLSX.writeFile(wb, filename);
}

/**
 * Export a single table to Excel (.xlsx)
 */
export function exportSingleTableToExcel(
  tableName: string,
  data: any[],
  filename?: string
): void {
  const finalFilename =
    filename || `Imperio_Lux_${tableName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wb = XLSX.utils.book_new();
  const formattedData =
    data.length > 0 ? data.map(formatRecordForExcel) : [{ id: 1, info: 'Sin registros' }];
  const ws = XLSX.utils.json_to_sheet(formattedData);
  autoFitColumns(ws, formattedData);

  const cleanName = tableName.slice(0, 31).replace(/[\\/?*:\[\]]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, cleanName);
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Open or download the live Google Sheets document in Excel (.xlsx) format
 */
export function downloadGoogleSheetsLiveExcel(spreadsheetId: string): void {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
  const a = document.createElement('a');
  a.href = exportUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.download = `Imperio_Lux_GoogleSheets_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
