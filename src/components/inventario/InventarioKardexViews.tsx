import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import {
  BookOpen,
  FileText,
  Plus,
  AlertTriangle,
  TrendingUp,
  Package,
  Layers,
  Search,
  X,
} from 'lucide-react';

/* ================= INVENTARIO ================= */
export const InventarioView: React.FC = () => {
  const {
    productos,
    inventarioAjustes,
    addInventarioAjuste,
    currentMoneda,
    setActiveTab,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<number>(productos[0]?.id || 1);
  const [tipoAjuste, setTipoAjuste] = useState<'Entrada' | 'Salida'>('Entrada');
  const [cantidadAjuste, setCantidadAjuste] = useState<number>(1);
  const [motivoAjuste, setMotivoAjuste] = useState('Conteo físico periódico');

  // Valuation
  const totalArticulos = productos.reduce((sum, p) => sum + p.cantidad, 0);
  const valorCostoTotal = productos.reduce((sum, p) => sum + p.cantidad * p.precio_compra, 0);
  const valorVentaTotal = productos.reduce((sum, p) => sum + p.cantidad * p.precio_venta, 0);
  const margenEstimado = valorVentaTotal - valorCostoTotal;

  const handleSaveAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidadAjuste || cantidadAjuste <= 0) return;
    addInventarioAjuste(Number(selectedProdId), tipoAjuste, Number(cantidadAjuste), motivoAjuste);
    setModalOpen(false);
  };

  return (
    <div>
      <Breadcrumb
        title="Control de Inventario y Stock"
        items={[{ label: 'Módulos' }, { label: 'Inventario' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('kardex')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Kardex Valorizado</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajustar Stock Manual</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase">Total Artículos Físicos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalArticulos} unid.</p>
          <span className="text-[10px] text-slate-400">En {productos.length} productos</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase">Valorizado al Costo</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {currentMoneda.simbolo} {valorCostoTotal.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Capital invertido</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase">Valor Proyectado de Venta</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {currentMoneda.simbolo} {valorVentaTotal.toFixed(2)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Recuperación estimada</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase">Ganancia Bruta Proyectada</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {currentMoneda.simbolo} {margenEstimado.toFixed(2)}
          </p>
          <span className="text-[10px] text-blue-600 font-medium">
            {valorCostoTotal > 0 ? ((margenEstimado / valorCostoTotal) * 100).toFixed(1) : 0}% de margen
          </span>
        </div>
      </div>

      {/* Stock Table & Adjustments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Stock Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Existencias por Producto
            </span>
            <button
              onClick={() => setActiveTab('productos')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Editar catálogo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Producto</th>
                  <th className="px-3 py-2.5 text-center">Stock</th>
                  <th className="px-3 py-2.5 text-right">Costo Unit.</th>
                  <th className="px-3 py-2.5 text-right">P. Venta</th>
                  <th className="px-3 py-2.5 text-right">Total Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((prod) => {
                  const isLow = prod.cantidad <= 5;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {prod.nombre}
                        <span className="block font-mono text-[10px] text-slate-400">
                          {prod.codigo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                            isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {prod.cantidad}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {currentMoneda.simbolo} {prod.precio_compra.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                        {currentMoneda.simbolo} {prod.precio_venta.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        {currentMoneda.simbolo} {(prod.cantidad * prod.precio_compra).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Adjustments Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Ajustes de Inventario Recientes
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
            >
              + Ajustar
            </button>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto max-h-96">
            {inventarioAjustes.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-4">No hay ajustes registrados.</p>
            ) : (
              inventarioAjustes.map((ajuste) => {
                const prod = productos.find((p) => p.id === ajuste.producto_id);
                return (
                  <div
                    key={ajuste.id}
                    className="p-2.5 rounded border border-slate-200 bg-slate-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {prod?.nombre || 'Producto'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ajuste.tipo === 'Entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ajuste.tipo === 'Entrada' ? '+' : '-'}
                        {ajuste.cantidad} unid.
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{ajuste.motivo}</p>
                    <span className="text-[10px] text-slate-400 block">{ajuste.fecha}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajuste Stock */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Ajuste Manual de Inventario</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAjuste} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Producto:</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.cantidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Ajuste:</label>
                  <select
                    value={tipoAjuste}
                    onChange={(e) => setTipoAjuste(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Entrada">Entrada (+) Ingreso</option>
                    <option value="Salida">Salida (-) Merma / Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantidadAjuste}
                    onChange={(e) => setCantidadAjuste(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo del Ajuste:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Merma por daño, Conteo físico"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold cursor-pointer"
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= KARDEX VALORIZADO ================= */
export const KardexView: React.FC = () => {
  const { kardex, productos, currentMoneda } = useApp();
  const [selectedProductoId, setSelectedProductoId] = useState<number | 'Todos'>('Todos');

  const filteredKardex = kardex.filter((k) =>
    selectedProductoId === 'Todos' ? true : k.producto_id === selectedProductoId
  );

  return (
    <div>
      <Breadcrumb
        title="Kardex Físico y Valorizado (PEPS / Promedio Ponderado)"
        items={[{ label: 'Módulos' }, { label: 'Kardex' }]}
      />

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700">Filtrar por Producto:</span>
          <select
            value={selectedProductoId}
            onChange={(e) =>
              setSelectedProductoId(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))
            }
            className="text-xs bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Todos">-- Ver Movimientos de Todos los Productos --</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {filteredKardex.length} movimientos registrados en Kardex
        </span>
      </div>

      {/* Accounting Kardex Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-700">
                  Fecha
                </th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-700">
                  Producto
                </th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-700">
                  Movimiento / Doc.
                </th>
                <th colSpan={3} className="px-3 py-1 text-center bg-emerald-800 border-r border-slate-700">
                  ENTRADAS
                </th>
                <th colSpan={3} className="px-3 py-1 text-center bg-rose-800 border-r border-slate-700">
                  SALIDAS
                </th>
                <th colSpan={3} className="px-3 py-1 text-center bg-blue-800">
                  SALDO FINAL
                </th>
              </tr>
              <tr className="bg-slate-700 text-[9px]">
                {/* Entradas */}
                <th className="px-2 py-1 text-center bg-emerald-900">Cant</th>
                <th className="px-2 py-1 text-right bg-emerald-900">Costo</th>
                <th className="px-2 py-1 text-right bg-emerald-900 border-r border-slate-600">Total</th>
                {/* Salidas */}
                <th className="px-2 py-1 text-center bg-rose-900">Cant</th>
                <th className="px-2 py-1 text-right bg-rose-900">Costo</th>
                <th className="px-2 py-1 text-right bg-rose-900 border-r border-slate-600">Total</th>
                {/* Saldo */}
                <th className="px-2 py-1 text-center bg-blue-900">Cant</th>
                <th className="px-2 py-1 text-right bg-blue-900">Costo</th>
                <th className="px-2 py-1 text-right bg-blue-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKardex.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron registros de Kardex.
                  </td>
                </tr>
              ) : (
                filteredKardex.map((item) => {
                  const prod = productos.find((p) => p.id === item.producto_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap border-r border-slate-100">
                        {item.fecha}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900 border-r border-slate-100 max-w-[160px] truncate">
                        {prod?.nombre || 'Producto'}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-100">
                        <span className="font-semibold text-slate-800">{item.tipo_movimiento}</span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          {item.documento_ref}
                        </span>
                      </td>

                      {/* Entradas */}
                      <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50/20">
                        {item.entrada_cantidad > 0 ? `+${item.entrada_cantidad}` : '-'}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-600 bg-emerald-50/20">
                        {item.entrada_cantidad > 0 ? item.entrada_costo.toFixed(2) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-emerald-800 bg-emerald-50/20 border-r border-slate-100">
                        {item.entrada_total > 0 ? item.entrada_total.toFixed(2) : '-'}
                      </td>

                      {/* Salidas */}
                      <td className="px-2 py-2 text-center font-bold text-rose-700 bg-rose-50/20">
                        {item.salida_cantidad > 0 ? `-${item.salida_cantidad}` : '-'}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-600 bg-rose-50/20">
                        {item.salida_cantidad > 0 ? item.salida_costo.toFixed(2) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-rose-800 bg-rose-50/20 border-r border-slate-100">
                        {item.salida_total > 0 ? item.salida_total.toFixed(2) : '-'}
                      </td>

                      {/* Saldo Final */}
                      <td className="px-2 py-2 text-center font-bold text-blue-900 bg-blue-50/30">
                        {item.saldo_cantidad}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-700 bg-blue-50/30">
                        {item.saldo_costo.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-blue-900 bg-blue-50/30">
                        {currentMoneda.simbolo} {item.saldo_total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
