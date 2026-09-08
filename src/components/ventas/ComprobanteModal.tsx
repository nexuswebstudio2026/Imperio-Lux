import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, Download, CheckCircle2 } from 'lucide-react';

export const ComprobanteModal: React.FC = () => {
  const {
    activeComprobanteVenta,
    setActiveComprobanteVenta,
    empresa,
    currentMoneda,
    clientes,
    comprobantes,
    users,
  } = useApp();

  if (!activeComprobanteVenta) return null;

  const venta = activeComprobanteVenta;
  const cliente = clientes.find((c) => c.id === venta.cliente_id);
  const comprobante = comprobantes.find((c) => c.id === venta.comprobante_id);
  const vendedor = users.find((u) => u.id === venta.user_id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-md w-full overflow-hidden my-auto">
        {/* Header toolbar (not printed) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Comprobante Generado
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="btn-print-ticket"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={() => setActiveComprobanteVenta(null)}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 text-slate-800 font-mono text-[11px] leading-relaxed bg-white">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="text-base font-bold tracking-tight text-slate-950 font-sans">
              {empresa.nombre}
            </h2>
            <p className="text-[10px] text-slate-600">{empresa.propietario}</p>
            <p className="text-[10px] font-semibold text-slate-700">RUC: {empresa.ruc}</p>
            <p className="text-[10px] text-slate-500">{empresa.direccion} - {empresa.ubicacion}</p>
            <p className="text-[10px] text-slate-500">Telf: {empresa.telefono} | {empresa.correo}</p>
          </div>

          {/* Document details */}
          <div className="text-center bg-slate-100 py-1.5 rounded border border-slate-200 mb-3">
            <span className="block font-bold text-xs uppercase tracking-wide text-slate-900">
              {comprobante?.nombre || 'BOLETA DE VENTA'} ELECTRÓNICA
            </span>
            <span className="block text-xs font-extrabold text-blue-800 tracking-wider">
              {venta.numero_comprobante}
            </span>
          </div>

          {/* Metadata */}
          <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-2 mb-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">FECHA Y HORA:</span>
              <span className="font-semibold text-slate-900">{venta.fecha_hora}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CAJERO / ATENDIÓ:</span>
              <span className="font-semibold text-slate-900">{vendedor?.name || 'Administrador'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CLIENTE:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                {cliente?.razon_social || 'Cliente Varios'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DOC. IDENTIDAD:</span>
              <span className="font-semibold text-slate-900">
                {cliente?.numero_documento || '00000000'}
              </span>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-left my-2">
            <thead>
              <tr className="border-b border-slate-400 text-[10px] uppercase font-bold text-slate-700">
                <th className="py-1">Cant.</th>
                <th className="py-1">Descripción</th>
                <th className="py-1 text-right">P.U.</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-slate-200 text-[10px]">
              {venta.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 align-top font-bold text-slate-900">
                    {item.cantidad}
                  </td>
                  <td className="py-1 align-top text-slate-800">
                    {item.nombre_producto}
                  </td>
                  <td className="py-1 align-top text-right text-slate-600">
                    {item.precio_venta.toFixed(2)}
                  </td>
                  <td className="py-1 align-top text-right font-bold text-slate-900">
                    {item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-600">
              <span>OP. GRAVADA (Subtotal):</span>
              <span>
                {currentMoneda.simbolo} {venta.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>
                {empresa.abreviatura_impuesto} ({empresa.porcentaje_impuesto}%):
              </span>
              <span>
                {currentMoneda.simbolo} {venta.impuesto.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-xs text-slate-950 pt-1 border-t border-slate-400">
              <span>TOTAL A PAGAR:</span>
              <span>
                {currentMoneda.simbolo} {venta.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment info */}
          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">MÉTODO DE PAGO:</span>
              <span className="font-semibold uppercase">{venta.metodo_pago}</span>
            </div>
            {venta.monto_recibido && (
              <div className="flex justify-between">
                <span className="text-slate-500">IMPORTE RECIBIDO:</span>
                <span>
                  {currentMoneda.simbolo} {venta.monto_recibido.toFixed(2)}
                </span>
              </div>
            )}
            {venta.vuelto_entregado !== undefined && (
              <div className="flex justify-between font-bold text-emerald-800">
                <span>VUELTO:</span>
                <span>
                  {currentMoneda.simbolo} {venta.vuelto_entregado.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center mt-5 pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-500 space-y-0.5">
            <p className="font-bold text-slate-700">¡GRACIAS POR SU PREFERENCIA!</p>
            <p>Conserve este comprobante para cualquier cambio o reclamo.</p>
            <p className="font-mono text-[8px] text-slate-400 mt-1">
              H4S8-99K2-00P1-SKVNT
            </p>
          </div>
        </div>

        {/* Modal actions */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={() => setActiveComprobanteVenta(null)}
            className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
