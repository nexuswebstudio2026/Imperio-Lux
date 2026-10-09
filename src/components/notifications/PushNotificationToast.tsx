import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { subscribeToPushNotifications, PushNotificationPayload } from '../../lib/browserNotificationsService';
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  Bell,
  X,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

interface ToastItem extends PushNotificationPayload {
  timeoutId?: any;
}

export const PushNotificationToast: React.FC = () => {
  const { setActiveTab } = useApp();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Escuchar alertas push emitidas por el servicio Notificaciones
    const unsubscribe = subscribeToPushNotifications((payload) => {
      const id = payload.id;
      const timeoutId = setTimeout(() => {
        dismissToast(id);
      }, 7000);

      setToasts((prev) => [{ ...payload, timeoutId }, ...prev.slice(0, 4)]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target?.timeoutId) {
        clearTimeout(target.timeoutId);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleAction = (toast: ToastItem) => {
    if (toast.categoria === 'venta') {
      setActiveTab('ventas');
    } else if (toast.categoria === 'inventario_critico' || toast.categoria === 'ajuste') {
      setActiveTab('inventario');
    }
    dismissToast(toast.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none animate-fadeIn">
      {toasts.map((toast) => {
        const isVenta = toast.categoria === 'venta';
        const isCritico = toast.categoria === 'inventario_critico';
        const isAjuste = toast.categoria === 'ajuste';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-3.5 shadow-2xl border transition-all duration-300 transform translate-y-0 backdrop-blur-md ${
              isCritico
                ? 'bg-red-950/95 text-white border-red-500 shadow-red-900/30'
                : isVenta
                ? 'bg-emerald-950/95 text-white border-emerald-500 shadow-emerald-900/30'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-black/40'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon badge */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
                  isCritico
                    ? 'bg-red-600 text-white animate-pulse'
                    : isVenta
                    ? 'bg-emerald-500 text-white'
                    : isAjuste
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {isCritico ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : isVenta ? (
                  <ShoppingCart className="w-5 h-5" />
                ) : isAjuste ? (
                  <Package className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCritico
                        ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                        : isVenta
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                        : 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                    }`}
                  >
                    {isCritico
                      ? 'Push: Stock Crítico'
                      : isVenta
                      ? 'Push: Nueva Venta'
                      : 'Push: Notificación'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
                </div>

                <h4 className="text-xs font-bold leading-tight line-clamp-1 mt-0.5">
                  {toast.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-1">
                  {toast.body}
                </p>

                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handleAction(toast)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      isCritico
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : isVenta
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span>
                      {isCritico
                        ? 'Ver en Inventario'
                        : isVenta
                        ? 'Ver Ventas'
                        : 'Ver Detalles'}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Descartar
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
