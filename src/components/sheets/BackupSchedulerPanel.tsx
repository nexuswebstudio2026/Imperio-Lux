import React from 'react';
import { CalendarClock, CheckCircle2, Save } from 'lucide-react';

export interface BackupScheduleConfig {
  enabled: boolean;
  folderId: string;
  spreadsheetId: string;
  hour: number;
  minute: number;
  timezone: string;
  lastBackup: null | { id: string; name: string; url: string; createdAt: string };
  lastError: string | null;
}

interface Props {
  config: BackupScheduleConfig;
  setConfig: React.Dispatch<React.SetStateAction<BackupScheduleConfig>>;
  loaded: boolean;
  saving: boolean;
  onSave: () => void;
  spreadsheetId: string;
}

export const BackupSchedulerPanel: React.FC<Props> = ({ config, setConfig, loaded, saving, onSave, spreadsheetId }) => {
  const update = (changes: Partial<BackupScheduleConfig>) => setConfig((current) => ({ ...current, ...changes }));
  const time = `${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')}`;

  return (
    <section className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-slate-900 p-5 space-y-4" aria-labelledby="backup-scheduler-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h4 id="backup-scheduler-title" className="text-sm font-bold text-slate-900 dark:text-white">Respaldo automático diario en Google Drive</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lo ejecuta el servidor incluso cuando el panel está cerrado.</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${config.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
          {config.enabled ? 'PROGRAMADO' : 'DESACTIVADO'}
        </span>
      </header>

      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <input type="checkbox" checked={config.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
        Activar copia diaria de la hoja principal
      </label>

      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
        Carpeta de destino: ID o enlace de la carpeta de Google Drive
        <input value={config.folderId} onChange={(event) => update({ folderId: event.target.value })} placeholder="https://drive.google.com/drive/folders/…" className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-normal text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500" />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Hora del respaldo
          <input type="time" value={time} onChange={(event) => { const [hour, minute] = event.target.value.split(':').map(Number); update({ hour, minute }); }} className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-normal text-slate-900 dark:text-slate-100" />
        </label>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Zona horaria
          <select value={config.timezone} onChange={(event) => update({ timezone: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-normal text-slate-900 dark:text-slate-100">
            <option value="America/Bogota">Bogotá (UTC−5)</option>
            <option value="America/Mexico_City">Ciudad de México</option>
            <option value="America/Lima">Lima</option>
            <option value="America/Santiago">Santiago</option>
            <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
            <option value="Europe/Madrid">Madrid</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100 dark:border-slate-800 pt-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Hoja fuente: <span className="font-mono">{spreadsheetId || 'No configurada'}</span></p>
        <button type="button" onClick={onSave} disabled={!loaded || saving || !config.folderId.trim() || !spreadsheetId} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? <span className="animate-spin">◌</span> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Guardando…' : 'Guardar programación'}
        </button>
      </div>

      {config.lastBackup && <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />Último respaldo: <a href={config.lastBackup.url} target="_blank" rel="noreferrer" className="underline">{config.lastBackup.name}</a> · {new Date(config.lastBackup.createdAt).toLocaleString('es-CO')}</p>}
      {config.lastError && <p className="text-xs text-red-600 dark:text-red-300">Último error: {config.lastError}</p>}
    </section>
  );
};
