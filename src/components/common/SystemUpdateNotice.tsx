import React, { useEffect, useState } from 'react';
import { Check, GitCommitHorizontal, RefreshCw, Sparkles, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface SystemVersion {
  commit: string;
  version: string;
  displayVersion: string;
}

const LAST_SEEN_VERSION_KEY = 'imperio-lux:last-seen-system-version';
const isNativeApp = Capacitor.isNativePlatform();

export const SystemUpdateNotice: React.FC = () => {
  const [version, setVersion] = useState<SystemVersion | null>(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/system/version?check=${Date.now()}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo consultar la versión del sitio.');
        return response.json() as Promise<SystemVersion>;
      })
      .then((currentVersion) => {
        if (!currentVersion.version) return;
        setVersion(currentVersion);
        const lastSeenVersion = window.localStorage.getItem(LAST_SEEN_VERSION_KEY);
        if (lastSeenVersion !== currentVersion.version) setVisible(true);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('No se pudo consultar la versión del sitio:', error);
        }
      });

    return () => controller.abort();
  }, []);

  const rememberVersion = () => {
    if (version) window.localStorage.setItem(LAST_SEEN_VERSION_KEY, version.version);
    setVisible(false);
  };

  const refreshToLatest = async () => {
    if (version) window.localStorage.setItem(LAST_SEEN_VERSION_KEY, version.version);
    setRefreshing(true);
    if (isNativeApp) return;
    window.location.reload();
  };

  if (!visible || !version) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !refreshing) rememberVersion(); }}>
      <section
        aria-labelledby="system-update-title"
        aria-describedby="system-update-description"
        aria-modal="true"
        className="relative max-h-[min(88vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#bd9858]/35 bg-white p-6 shadow-[0_28px_100px_rgba(0,0,0,.38)] sm:p-9 dark:border-[#bd9858]/30 dark:bg-[#111b2b]"
        role="dialog"
      >
        <button type="button" onClick={rememberVersion} disabled={refreshing} aria-label="Cerrar aviso de actualización" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#bd9858]/15 text-[#8d6b32] dark:text-[#e2c78c]">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b7b3e]">Novedades de Imperio Lux</p>
        <h2 id="system-update-title" className="mt-2 max-w-sm font-serif text-3xl leading-tight text-[#17243a] sm:text-4xl dark:text-white">
          El sitio se ha actualizado
        </h2>
        <p id="system-update-description" className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {isNativeApp
            ? 'Hay una versión nueva del sistema. Para recibir los cambios, instala la actualización de Imperio Lux cuando esté disponible para tu dispositivo.'
            : 'Ya está disponible la versión más reciente publicada desde GitHub. Actualiza la página para cargar los últimos cambios.'}
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
          <GitCommitHorizontal className="h-5 w-5 shrink-0 text-[#9b7b3e]" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Versión publicada</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{version.displayVersion}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={rememberVersion} disabled={refreshing} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Continuar
          </button>
          {!isNativeApp && (
            <button type="button" onClick={refreshToLatest} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17243a] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#17243a]/20 transition hover:bg-[#243958] disabled:cursor-wait disabled:opacity-70 dark:bg-[#bd9858] dark:text-[#111827] dark:hover:bg-[#d1ae68]">
              {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {refreshing ? 'Actualizando…' : 'Actualizar ahora'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
