import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  ShoppingCart,
  Package,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const NotificationConfigModal: React.FC = () => {
  const {
    showBrowserNotificationModal,
    setShowBrowserNotificationModal,
    browserNotificationsStatus,
    browserNotificationsPreferences,
    updateBrowserNotificationPreferences,
    requestBrowserNotificationPermission,
    sendPushAlert,
    currentMoneda,
    notificaciones,
    setActiveTab,
  } = useApp();

  const [requesting, setRequesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!showBrowserNotificationModal) return null;


  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const res = await requestBrowserNotificationPermission();
      if (res.granted) {
        setTestResult('¡Permiso concedido con éxito! Las notificaciones nativas están activas.');
      } else {
        setTestResult(`Estado de permiso: ${res.error || 'No concedido'}`);
      }
    } catch (err: any) {
      setTestResult(`Error al solicitar permisos: ${err.message}`);
    } finally {
      setRequesting(false);
    }
  };

  const handleTestVentaAlert = () => {
    sendPushAlert({
      title: '🛒 ¡Nueva Venta Registrada! (#B001-TEST)',
      body: `Venta por ${currentMoneda.simbolo} 350.000 COP a Andrés Mendoza (3 prendas de lujo).`,
      tipo: 'success',
      categoria: 'venta',
      data: { test: true },
    });
    setTestResult('Notificación de prueba enviada: Alerta de Nueva Venta disparada.');
  };

  const handleTestCriticoAlert = () => {
    sendPushAlert({
      title: '🚨 ¡ALERTA DE STOCK CRÍTICO! - Cadena Oro 18K',
      body: 'Quedan solo 2 unidades en existencias (Nivel mínimo definido: 5). ¡Reponer urgentemente!',
      tipo: 'warning',
      categoria: 'inventario_critico',
      data: { test: true },
    });
    setTestResult('Notificación de prueba enviada: Alerta de Stock Crítico disparada.');
  };

  const isGranted = browserNotificationsStatus.permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Notificaciones del navegador</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Push Service
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Alertas en tiempo real de nuevas ventas y stock crítico en inventario
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBrowserNotificationModal(false)}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Status banner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Estado del Servicio
                  </div>
                  <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Notificaciones del navegador activas</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isGranted
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300'
                  }`}
                >
                  {isGranted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Permiso Concedido
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Permiso: {browserNotificationsStatus.permission}
                    </>
                  )}
                </span>

                {!isGranted && (
                  <button
                    onClick={handleRequestPermission}
                    disabled={requesting}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    {requesting ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Bell className="w-3 h-3" />
                    )}
                    <span>Activar en Navegador</span>
                  </button>
                )}
              </div>
            </div>


            {testResult && (
              <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-200 flex items-center justify-between">
                <span>{testResult}</span>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-blue-400 hover:text-blue-600 cursor-pointer font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Preferences Switches */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Canales y Preferencias de Alertas
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <label className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Alertar sobre Nuevas Ventas
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Notificar instantáneamente cuando un cajero o vendedor emita una venta.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={browserNotificationsPreferences.notifyVentas}
                  onChange={(e) => updateBrowserNotificationPreferences({ notifyVentas: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Alertar Stock Crítico y Agotado
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Notificar cuando el stock quede por debajo del nivel mínimo o en 0.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={browserNotificationsPreferences.notifyInventario}
                  onChange={(e) => updateBrowserNotificationPreferences({ notifyInventario: e.target.checked })}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Alertar Ajustes Manuales de Inventario
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Notificar entradas y salidas manuales de stock o reabastecimiento.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={browserNotificationsPreferences.notifyAjustes}
                  onChange={(e) => updateBrowserNotificationPreferences({ notifyAjustes: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                    {browserNotificationsPreferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Sonidos de Notificación (Web Audio)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Emitir tonos armónicos sintetizados al recibir ventas o alertas críticas.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={browserNotificationsPreferences.soundEnabled}
                  onChange={(e) => updateBrowserNotificationPreferences({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-500" />
            <span>Alertas del navegador disponibles en este dispositivo</span>
          </div>
          <button
            onClick={() => setShowBrowserNotificationModal(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
