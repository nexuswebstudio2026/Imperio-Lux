import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, FileSpreadsheet, LoaderCircle, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSpreadsheetUrl } from '../../lib/sheets';

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
  const { googleSheetsId } = useApp();
  const [workbook, setWorkbook] = useState<SheetsResponse | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

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
          <code className="mt-1 block truncate text-xs text-emerald-300">{workbook?.spreadsheetId || googleSheetsId}</code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
            <p className="font-bold">No se pudo leer Google Sheets</p>
            <p className="mt-1">{error}</p>
          </div>
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
              </>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">Selecciona una hoja para consultar sus datos.</div>
            )}
          </section>
        </div>
      )}
    </section>
  );
};
