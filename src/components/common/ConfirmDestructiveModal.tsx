import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDestructiveModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemCount?: number;
  itemDescription?: string;
  affectedItems?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDestructiveModal: React.FC<ConfirmDestructiveModalProps> = ({
  isOpen,
  title,
  description,
  itemCount,
  itemDescription,
  affectedItems,
  confirmLabel = 'Sí, actualizar y sobrescribir',
  cancelLabel = 'Cancelar',
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Confirmación requerida para sincronización con Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          {itemCount !== undefined && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs">
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                Total de registros afectados:
              </span>{' '}
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {itemCount} {itemDescription || 'registros'}
              </span>
            </div>
          )}

          {affectedItems && affectedItems.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pestañas y tablas que se actualizarán:
              </span>
              <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                {affectedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
            ⚠️ <strong>Importante:</strong> Esta operación modificará los contenidos de la hoja de cálculo de Google Sheets con los datos del sistema.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isProcessing && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isProcessing ? 'Sincronizando...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
