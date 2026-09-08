import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  History,
} from 'lucide-react';

export const CajaView: React.FC = () => {
  const {
    cajas,
    activeCaja,
    openCaja,
    closeCaja,
    movimientosCaja,
    addMovimientoCaja,
    currentMoneda,
    users,
  } = useApp();

  // Modal controls
  const [openCajaModal, setOpenCajaModal] = useState(false);
  const [closeCajaModal, setCloseCajaModal] = useState(false);
  const [movimientoModal, setMovimientoModal] = useState(false);

  // Form states
  const [cajaNombre, setCajaNombre] = useState('Caja Principal ' + (cajas.length + 1));
  const [cajaMontoInicial, setCajaMontoInicial] = useState<number>(200);

  const [montoArqueoCierre, setMontoArqueoCierre] = useState<number | ''>('');

  const [movTipo, setMovTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [movConcepto, setMovConcepto] = useState('');
  const [movMonto, setMovMonto] = useState<number | ''>('');

  const handleOpenCajaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaNombre.trim()) return;
    openCaja(cajaNombre, Number(cajaMontoInicial) || 0);
    setOpenCajaModal(false);
  };

  const handleCloseCajaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaja) return;
    closeCaja(activeCaja.id, Number(montoArqueoCierre) || 0);
    setCloseCajaModal(false);
    setMontoArqueoCierre('');
  };

  const handleMovimientoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movConcepto.trim() || !movMonto || Number(movMonto) <= 0) return;
    addMovimientoCaja(movTipo, movConcepto, Number(movMonto));
    setMovimientoModal(false);
    setMovConcepto('');
    setMovMonto('');
  };

  const activeMovimientos = activeCaja
    ? movimientosCaja.filter((m) => m.caja_id === activeCaja.id)
    : [];

  return (
    <div>
      <Breadcrumb
        title="Gestión y Control de Cajas"
        items={[{ label: 'Módulos' }, { label: 'Cajas' }]}
        actions={
          activeCaja ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMovimientoModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Entrada / Salida</span>
              </button>
              <button
                onClick={() => {
                  setMontoArqueoCierre(activeCaja.saldo_estimado);
                  setCloseCajaModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cerrar Caja (Arqueo)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOpenCajaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Abrir Nueva Caja</span>
            </button>
          )
        }
      />

      {/* Active Caja Overview */}
      {activeCaja ? (
        <div className="bg-white rounded-lg border-2 border-emerald-500 shadow-sm overflow-hidden mb-6">
          <div className="bg-emerald-600 text-white px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Wallet className="w-5 h-5" />
              <span>CAJA ACTIVA EN TURNO: {activeCaja.nombre}</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-700 text-emerald-100 rounded-full text-xs font-bold uppercase tracking-wider">
              {activeCaja.estado}
            </span>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Monto Inicial:</p>
              <p className="text-base font-bold text-slate-900 mt-1">
                {currentMoneda.simbolo} {activeCaja.monto_inicial.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Apertura: {activeCaja.fecha_apertura}</span>
            </div>

            <div className="pt-2 sm:pt-0 sm:pl-4">
              <p className="text-slate-500 font-medium">Ventas en Efectivo:</p>
              <p className="text-base font-bold text-emerald-700 mt-1">
                +{currentMoneda.simbolo} {activeCaja.ingresos_ventas.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Cobros del turno</span>
            </div>

            <div className="pt-2 sm:pt-0 sm:pl-4">
              <p className="text-slate-500 font-medium">Ingresos Extras:</p>
              <p className="text-base font-bold text-blue-700 mt-1">
                +{currentMoneda.simbolo} {activeCaja.ingresos_movimientos.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Aportes manuales</span>
            </div>

            <div className="pt-2 sm:pt-0 sm:pl-4">
              <p className="text-slate-500 font-medium">Egresos / Gastos:</p>
              <p className="text-base font-bold text-red-600 mt-1">
                -{currentMoneda.simbolo} {activeCaja.egresos_movimientos.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Pagos menores</span>
            </div>

            <div className="pt-2 sm:pt-0 sm:pl-4 bg-emerald-50/50 p-2 rounded">
              <p className="text-emerald-900 font-bold uppercase text-[11px]">Saldo Estimado:</p>
              <p className="text-xl font-extrabold text-emerald-800 mt-0.5">
                {currentMoneda.simbolo} {activeCaja.saldo_estimado.toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Debe haber en caja</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center text-amber-800 mb-6">
          <Wallet className="w-10 h-10 mx-auto mb-2 text-amber-600" />
          <h3 className="text-base font-bold">Actualmente no hay ninguna caja abierta</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto mt-1 mb-4">
            Para registrar pagos de ventas en efectivo y controlar las salidas de dinero,
            debes iniciar un nuevo turno de caja con su monto inicial.
          </p>
          <button
            onClick={() => setOpenCajaModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow cursor-pointer transition-colors"
          >
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* Grid: Movimientos de la Caja Activa & Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos del Turno */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Movimientos del Turno Actual
            </span>
            {activeCaja && (
              <button
                onClick={() => setMovimientoModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Registrar
              </button>
            )}
          </div>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] sticky top-0">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2">Fecha/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      Sin movimientos manuales en esta caja.
                    </td>
                  </tr>
                ) : (
                  activeMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.tipo === 'Ingreso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.tipo === 'Ingreso' ? (
                            <ArrowDownRight className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-red-600" />
                          )}
                          <span>{m.tipo}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{m.concepto}</td>
                      <td
                        className={`px-3 py-2 text-right font-bold ${
                          m.tipo === 'Ingreso' ? 'text-blue-700' : 'text-red-600'
                        }`}
                      >
                        {m.tipo === 'Ingreso' ? '+' : '-'}
                        {currentMoneda.simbolo} {m.monto.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[10px]">{m.fecha_hora}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Cajas Anteriores */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Historial de Cajas y Arqueos</span>
            </span>
          </div>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] sticky top-0">
                <tr>
                  <th className="px-3 py-2">Caja</th>
                  <th className="px-3 py-2">Apertura / Cierre</th>
                  <th className="px-3 py-2 text-right">Saldo Final</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cajas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {c.nombre}
                      <span className="block text-[10px] text-slate-400">
                        Inicial: {currentMoneda.simbolo} {c.monto_inicial.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-[11px]">
                      <div>{c.fecha_apertura}</div>
                      <div className="text-[10px] text-slate-400">{c.fecha_cierre || 'En curso'}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-800">
                      {c.monto_final !== undefined ? (
                        <>
                          <div>
                            {currentMoneda.simbolo} {c.monto_final.toFixed(2)}
                          </div>
                          {c.diferencia !== undefined && (
                            <span
                              className={`text-[10px] ${
                                c.diferencia === 0
                                  ? 'text-slate-400'
                                  : c.diferencia > 0
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                              }`}
                            >
                              Dif: {c.diferencia > 0 ? '+' : ''}
                              {c.diferencia.toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.estado === 'Abierta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Open Caja */}
      {openCajaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>Apertura de Caja</span>
              </h3>
              <button onClick={() => setOpenCajaModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleOpenCajaSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Caja:</label>
                <input
                  type="text"
                  required
                  value={cajaNombre}
                  onChange={(e) => setCajaNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monto Inicial en Efectivo ({currentMoneda.simbolo}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={cajaMontoInicial}
                  onChange={(e) => setCajaMontoInicial(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setOpenCajaModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                >
                  Abrir Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Close Caja / Arqueo */}
      {closeCajaModal && activeCaja && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-red-600" />
                <span>Cierre de Caja y Arqueo</span>
              </h3>
              <button onClick={() => setCloseCajaModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCloseCajaSubmit} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo del Sistema:</span>
                  <span className="font-bold text-slate-800">
                    {currentMoneda.simbolo} {activeCaja.saldo_estimado.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monto Físico Contado en Caja ({currentMoneda.simbolo}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={montoArqueoCierre}
                  onChange={(e) => setMontoArqueoCierre(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold text-base text-slate-900 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {montoArqueoCierre !== '' && (
                <div
                  className={`p-2.5 rounded text-xs font-semibold ${
                    Number(montoArqueoCierre) === activeCaja.saldo_estimado
                      ? 'bg-emerald-100 text-emerald-800'
                      : Number(montoArqueoCierre) > activeCaja.saldo_estimado
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Diferencia:{' '}
                  {(Number(montoArqueoCierre) - activeCaja.saldo_estimado >= 0 ? '+' : '') +
                    currentMoneda.simbolo +
                    ' ' +
                    (Number(montoArqueoCierre) - activeCaja.saldo_estimado).toFixed(2)}{' '}
                  {Number(montoArqueoCierre) === activeCaja.saldo_estimado
                    ? '(Cuadre exacto)'
                    : Number(montoArqueoCierre) > activeCaja.saldo_estimado
                    ? '(Sobrante)'
                    : '(Faltante)'}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCloseCajaModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
                >
                  Confirmar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento */}
      {movimientoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Registrar Movimiento en Caja</h3>
              <button onClick={() => setMovimientoModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleMovimientoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimiento:</label>
                <select
                  value={movTipo}
                  onChange={(e) => setMovTipo(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="Ingreso">Ingreso (+ Dinero adicional)</option>
                  <option value="Egreso">Egreso (- Gasto o salida menor)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Concepto / Motivo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de flete, compras menores"
                  value={movConcepto}
                  onChange={(e) => setMovConcepto(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monto ({currentMoneda.simbolo}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={movMonto}
                  onChange={(e) => setMovMonto(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setMovimientoModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
