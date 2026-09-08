import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Venta } from '../../types';
import {
  ShoppingCart,
  Plus,
  Search,
  Receipt,
  RotateCcw,
  AlertTriangle,
  FileText,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const VentaListView: React.FC = () => {
  const {
    ventas,
    clientes,
    users,
    currentMoneda,
    setActiveTab,
    setActiveComprobanteVenta,
    anularVenta,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<'Todos' | 'Completada' | 'Anulada'>('Todos');
  const [anularModalVenta, setAnularModalVenta] = useState<Venta | null>(null);

  const filteredVentas = ventas.filter((v) => {
    const client = clientes.find((c) => c.id === v.cliente_id);
    const matchesSearch =
      v.numero_comprobante.toLowerCase().includes(search.toLowerCase()) ||
      (client && client.razon_social.toLowerCase().includes(search.toLowerCase())) ||
      v.fecha_hora.includes(search);

    const matchesEstado = filterEstado === 'Todos' || v.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  const totalRecaudado = ventas
    .filter((v) => v.estado === 'Completada')
    .reduce((sum, v) => sum + v.total, 0);

  const confirmAnular = () => {
    if (anularModalVenta) {
      anularVenta(anularModalVenta.id);
      setAnularModalVenta(null);
    }
  };

  return (
    <div>
      <Breadcrumb
        title="Historial de Ventas"
        items={[{ label: 'Ventas', tab: 'ventas' }, { label: 'Ver Ventas' }]}
        actions={
          <button
            onClick={() => setActiveTab('ventas_create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Realizar Nueva Venta</span>
          </button>
        }
      />

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Total Ventas Emitidas</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{ventas.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Ingresos Totales (Efectivas)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">
              {currentMoneda.simbolo} {totalRecaudado.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Ventas Anuladas</p>
            <p className="text-2xl font-bold text-red-600 mt-0.5">
              {ventas.filter((v) => v.estado === 'Anulada').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por comprobante, cliente o fecha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 pl-8 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-600">Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Completada">Completada</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Método Pago</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron registros de ventas coincidentes.
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => {
                  const client = clientes.find((c) => c.id === venta.cliente_id);
                  const isAnulada = venta.estado === 'Anulada';
                  return (
                    <tr
                      key={venta.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isAnulada ? 'opacity-60 bg-red-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {venta.numero_comprobante}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{venta.fecha_hora}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {client?.razon_social || 'Cliente Varios'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                          {venta.metodo_pago}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {currentMoneda.simbolo} {venta.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAnulada
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveComprobanteVenta(venta)}
                            className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Ver e Imprimir Comprobante"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Comprobante</span>
                          </button>

                          {!isAnulada && (
                            <button
                              onClick={() => setAnularModalVenta(venta)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                              title="Anular venta y reponer inventario"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal to Anular Venta */}
      {anularModalVenta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirmar Anulación</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas anular el comprobante{' '}
              <strong>{anularModalVenta.numero_comprobante}</strong> por un total de{' '}
              <strong>
                {currentMoneda.simbolo} {anularModalVenta.total.toFixed(2)}
              </strong>
              ? Se repondrán los artículos en el inventario y se registrará la devolución en el Kardex.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAnularModalVenta(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAnular}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
              >
                Sí, Anular Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
