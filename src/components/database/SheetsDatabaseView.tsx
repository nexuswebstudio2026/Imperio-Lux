import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, ExternalLink, FileSpreadsheet, LoaderCircle, RefreshCw, Search, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSpreadsheetUrl } from '../../lib/sheets';
import { UsersCrudPanel } from './UsersCrudPanel';

interface SheetData {
  title: string;
  sheetId: number;
  index: number;
  headers: string[];
  rows: Record<string, unknown>[];
  recordCount: number;
}

interface SheetsResponse {
  spreadsheetId: string;
  title: string;
  sheets: SheetData[];
  error?: string;
}

export const SheetsDatabaseView: React.FC = () => {
  const { googleSheetsId, downloadAllFromGoogleSheets } = useApp();
  const [workbook, setWorkbook] = useState<SheetsResponse | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingWorkbook, setPendingWorkbook] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const workbookInput = useRef<HTMLInputElement>(null);

  const loadSheets = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/database/sheets', { credentials: 'same-origin' });
      const result = await response.json() as SheetsResponse;
      if (!response.ok) {
        throw new Error(result.error || (response.status === 401
          ? 'Inicia sesión como administrador para consultar las hojas.'
          : 'No se pudieron cargar las hojas de Google Sheets.'));
      }
      setWorkbook(result);
      setSelectedSheet((current) =>
        result.sheets.some((sheet) => sheet.title === current)
          ? current
          : result.sheets[0]?.title || ''
      );
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar las hojas de Google Sheets.';
      setError(message);
      console.error('Error al consultar las hojas de Google Sheets:', loadError);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSheets();
  }, [loadSheets]);

  const visibleSheets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    if (!query) return workbook?.sheets || [];
    return (workbook?.sheets || []).filter((sheet) => sheet.title.toLocaleLowerCase('es').includes(query));
  }, [search, workbook]);

  const currentSheet = workbook?.sheets.find((sheet) => sheet.title === selectedSheet);

  const handleExportWorkbook = async () => {
    setIsExporting(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/database/export', { credentials: 'same-origin' });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'No se pudo descargar el libro Excel.');
      }
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Imperio_Lux_BaseDatos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccessMessage('Se descargó el libro Excel con todas las hojas de Google Sheets.');
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No se pudo descargar el libro Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectWorkbook = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    setError('');
    setSuccessMessage('');
    if (!file) return;
    if (!file.name.toLocaleLowerCase('es').endsWith('.xlsx')) {
      setError('Selecciona un libro de Excel con extensión .xlsx.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('El archivo supera el límite de 4 MB. Descarga el libro actual y reduce su tamaño antes de subirlo.');
      return;
    }
    setPendingWorkbook(file);
  };

  const handleImportWorkbook = async () => {
    if (!pendingWorkbook) return;
    setIsImporting(true);
    setError('');
    setSuccessMessage('');
    try {
      const formData = new FormData();
      formData.append('file', pendingWorkbook);
      const response = await fetch('/api/database/import', { method: 'POST', credentials: 'same-origin', body: formData });
      const result = await response.json().catch(() => ({})) as { error?: string; message?: string; sheets?: number; rows?: number };
      if (!response.ok) throw new Error(result.error || 'No se pudo importar el archivo Excel.');

      setPendingWorkbook(null);
      try {
        await downloadAllFromGoogleSheets();
        await loadSheets(true);
        setSuccessMessage(`${result.message || 'Base de datos actualizada.'} Se sincronizaron ${result.sheets || 0} hojas y ${result.rows || 0} filas con el sistema.`);
      } catch {
        await loadSheets(true);
        setSuccessMessage('Google Sheets se actualizó. La vista del sistema no pudo sincronizarse automáticamente; pulsa Actualizar para recargarla.');
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'No se pudo importar el archivo Excel.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-400" />
            <h1 className="truncate text-xl font-black">Base de Datos · Google Sheets</h1>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {workbook?.title || 'Conexión automática mediante la cuenta de servicio'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Descarga todas las pestañas en Excel o sube el libro editado para sincronizar Google Sheets y el sistema.</p>
          <code className="mt-1 block truncate text-xs text-emerald-300">{workbook?.spreadsheetId || googleSheetsId}</code>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExportWorkbook()}
            disabled={isLoading || isExporting || isImporting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Preparando Excel…' : 'Descargar Excel'}
          </button>
          <input ref={workbookInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleSelectWorkbook} />
          <button
            type="button"
            onClick={() => workbookInput.current?.click()}
            disabled={isLoading || isExporting || isImporting}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
          >
            <Upload className={`h-4 w-4 ${isImporting ? 'animate-bounce' : ''}`} />
            Subir base de datos
          </button>
          <button
            type="button"
            onClick={() => void loadSheets(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <a
            href={getSpreadsheetUrl(workbook?.spreadsheetId || googleSheetsId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Abrir hoja <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">No se pudo completar la operación</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
          Leyendo pestañas y registros de Google Sheets…
        </div>
      ) : workbook && (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 dark:text-white">Hojas del archivo</h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {workbook.sheets.length}
                </span>
              </div>
              <label className="relative block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar hoja…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>
            <nav aria-label="Pestañas de Google Sheets" className="max-h-[65vh] overflow-y-auto p-2">
              {visibleSheets.map((sheet) => (
                <button
                  type="button"
                  key={sheet.sheetId}
                  onClick={() => setSelectedSheet(sheet.title)}
                  className={`mb-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selectedSheet === sheet.title
                      ? 'bg-emerald-600 font-semibold text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{sheet.title}</span>
                  <span className={`shrink-0 text-xs ${selectedSheet === sheet.title ? 'text-emerald-50' : 'text-slate-500'}`}>
                    {sheet.recordCount}
                  </span>
                </button>
              ))}
              {visibleSheets.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No se encontraron hojas.</p>
              )}
            </nav>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {currentSheet ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{currentSheet.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {currentSheet.recordCount} registros · {currentSheet.headers.length} columnas · lectura directa del archivo
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Conectado
                  </span>
                </div>
                {currentSheet.title.trim().toLocaleLowerCase('es') === 'usuarios' ? (
                  <div className="p-4"><UsersCrudPanel /></div>
                ) : (
                <div className="max-h-[70vh] overflow-auto">
                  {currentSheet.headers.length > 0 && currentSheet.rows.length > 0 ? (
                    <table className="min-w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        <tr>
                          <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-bold dark:border-slate-700">#</th>
                          {currentSheet.headers.map((header) => (
                            <th key={header} className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-bold dark:border-slate-700">
                              {header || '(sin encabezado)'}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentSheet.rows.map((row, rowIndex) => (
                          <tr key={`${currentSheet.sheetId}-${rowIndex}`} className="hover:bg-emerald-50/60 dark:hover:bg-slate-800/70">
                            <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 font-mono text-slate-400 dark:border-slate-800">{rowIndex + 1}</td>
                            {currentSheet.headers.map((header) => {
                              const value = row[header];
                              const display = value === null || value === undefined
                                ? ''
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value);
                              return (
                                <td
                                  key={header}
                                  title={display}
                                  className="max-w-72 whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                                >
                                  <span className="block truncate">{display || '—'}</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-10 text-center text-sm text-slate-500">
                      {currentSheet.headers.length === 0 ? 'Esta hoja todavía no tiene encabezados.' : 'Esta hoja no tiene registros.'}
                    </div>
                  )}
                </div>
                )}
              </>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">Selecciona una hoja para consultar sus datos.</div>
            )}
          </section>
        </div>
      )}

      {pendingWorkbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="excel-import-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"><Upload className="h-5 w-5" /></span>
                <div>
                  <h2 id="excel-import-title" className="font-bold text-slate-900 dark:text-white">¿Actualizar la base de datos?</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Confirma antes de subir el libro</p>
                </div>
              </div>
              <button type="button" onClick={() => setPendingWorkbook(null)} disabled={isImporting} aria-label="Cerrar" className="rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50"><X className="h-5 w-5" /></button>
            </header>
            <div className="space-y-4 p-5 text-sm text-slate-700 dark:text-slate-200">
              <p>Archivo seleccionado: <strong className="break-all">{pendingWorkbook.name}</strong></p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                Se reemplazarán los datos de las hojas en Google Sheets con el contenido del Excel. Conserva los nombres y encabezados de todas las pestañas. Esta acción afecta los registros existentes.
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Las credenciales no se escriben en el archivo descargado y se conservan en Sheets al coincidir el ID, correo o usuario. Solo se permiten archivos .xlsx de hasta 4 MB.</p>
            </div>
            <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <button type="button" onClick={() => setPendingWorkbook(null)} disabled={isImporting} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={() => void handleImportWorkbook()} disabled={isImporting} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60">
                {isImporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isImporting ? 'Actualizando…' : 'Actualizar Google Sheets'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
};
