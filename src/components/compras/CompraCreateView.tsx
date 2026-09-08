import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { DetalleCompraItem } from '../../types';
import {
  Store,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Building,
} from 'lucide-react';

export const CompraCreateView: React.FC = () => {
  const {
    proveedores,
    comprobantes,
    productos,
    empresa,
    currentMoneda,
    addCompra,
    setActiveTab,
  } = useApp();

  const [proveedorId, setProveedorId] = useState<number>(proveedores[0]?.id || 1);
  const [comprobanteId, setComprobanteId] = useState<number>(comprobantes[1]?.id || 2);
  const [numeroComprobante, setNumeroComprobante] = useState<string>('FC01-00' + Math.floor(1000 + Math.random() * 9000));

  // Item inputs
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number | ''>(10);
  const [precioCompra, setPrecioCompra] = useState<number | ''>('');
  const [precioVentaSugerido, setPrecioVentaSugerido] = useState<number | ''>('');

  const [items, setItems] = useState<DetalleCompraItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleProductSelect = (id: number | '') => {
    setSelectedProdId(id);
    if (id) {
      const prod = productos.find((p) => p.id === Number(id));
      if (prod) {
        setPrecioCompra(prod.precio_compra);
        setPrecioVentaSugerido(prod.precio_venta);
      }
    } else {
      setPrecioCompra('');
      setPrecioVentaSugerido('');
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) {
      showToast('Seleccione un producto para comprar');
      return;
    }
    const cantNum = Number(cantidad);
    const costoNum = Number(precioCompra);
    const ventaNum = Number(precioVentaSugerido);

    if (!cantNum || cantNum <= 0) {
      showToast('Ingrese una cantidad válida mayor a 0');
      return;
    }
    if (!costoNum || costoNum <= 0) {
      showToast('Ingrese un costo de compra unitario válido');
      return;
    }

    const prod = productos.find((p) => p.id === Number(selectedProdId));
    if (!prod) return;

    const existing = items.find((it) => it.producto_id === prod.id);
    if (existing) {
      showToast('El producto ya está en la lista de compra');
      return;
    }

    const subtotal = Number((cantNum * costoNum).toFixed(2));

    const newItem: DetalleCompraItem = {
      id: Date.now(),
      producto_id: prod.id,
      nombre_producto: prod.nombre,
      cantidad: cantNum,
      precio_compra: costoNum,
      precio_venta_sugerido: ventaNum || prod.precio_venta,
      subtotal,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProdId('');
    setCantidad(10);
    setPrecioCompra('');
    setPrecioVentaSugerido('');
    showToast(`"${prod.nombre}" añadido a la orden`, 'success');
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Calculations
  const impuestoPorcentaje = empresa.porcentaje_impuesto || 18;
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const igv = Number(((subtotal * impuestoPorcentaje) / 100).toFixed(2));
  const total = Number((subtotal + igv).toFixed(2));

  const handleSaveCompra = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Debe agregar al menos un producto a la compra');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    addCompra({
      numero_comprobante: numeroComprobante,
      comprobante_id: Number(comprobanteId),
      proveedor_id: Number(proveedorId),
      user_id: 1,
      fecha_hora: nowStr,
      subtotal,
      impuesto: igv,
      total,
      estado: 'Completada',
      items,
    });

    showToast('Compra registrada e inventario actualizado correctamente', 'success');
    setActiveTab('compras');
  };

  return (
    <div>
      <Breadcrumb
        title="Realizar Compra de Mercadería"
        items={[{ label: 'Compras', tab: 'compras' }, { label: 'Crear Compra' }]}
        actions={
          <button
            onClick={() => setActiveTab('compras')}
            className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer bg-white"
          >
            Ver Historial de Compras
          </button>
        }
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-16 right-5 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            toastMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveCompra} className="space-y-6">
        {/* Datos del Proveedor y Comprobante */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-violet-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 uppercase tracking-wide">
            1. Datos del Proveedor y Factura de Compra
          </div>
          <div className="p-4 sm:p-5 border-2 border-violet-500/40 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proveedor:
                </label>
                <select
                  value={proveedorId}
                  onChange={(e) => setProveedorId(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numero_documento} - {p.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Comprobante:
                </label>
                <select
                  value={comprobanteId}
                  onChange={(e) => setComprobanteId(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {comprobantes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Comprobante Proveedor:
                </label>
                <input
                  type="text"
                  required
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detalles de Productos Comprados */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 uppercase tracking-wide">
            2. Agregar Productos a la Compra
          </div>
          <div className="p-4 sm:p-5 border-2 border-blue-500/40 rounded-b-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 items-end">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar Producto:
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => handleProductSelect(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione producto --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre} (Stock actual: {p.cantidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cantidad:
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Costo Compra ({currentMoneda.simbolo}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  P. Venta Sugerido:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={precioVentaSugerido}
                  onChange={(e) => setPrecioVentaSugerido(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5 text-center">Cantidad</th>
                    <th className="px-4 py-2.5 text-right">Costo Unit. Compra</th>
                    <th className="px-4 py-2.5 text-right">Nuevo P. Venta</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                    <th className="px-4 py-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                        No hay productos en esta orden de compra.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          {item.nombre_producto}
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-800">
                          +{item.cantidad}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">
                          {currentMoneda.simbolo} {item.precio_compra.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700 font-medium">
                          {currentMoneda.simbolo} {item.precio_venta_sugerido?.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          {currentMoneda.simbolo} {item.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold text-xs border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-600">
                      Subtotal:
                    </td>
                    <td colSpan={2} className="px-4 py-2 text-right font-bold text-slate-800">
                      {currentMoneda.simbolo} {subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-600">
                      {empresa.abreviatura_impuesto} ({impuestoPorcentaje}%):
                    </td>
                    <td colSpan={2} className="px-4 py-2 text-right font-bold text-slate-800">
                      {currentMoneda.simbolo} {igv.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-violet-50 text-violet-950 font-bold text-sm">
                    <td colSpan={4} className="px-4 py-2 text-right uppercase">
                      Total Compra:
                    </td>
                    <td colSpan={2} className="px-4 py-2 text-right text-violet-700 font-extrabold text-base">
                      {currentMoneda.simbolo} {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItems([])}
                className="px-4 py-2 text-xs border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Limpiar Lista
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className={`px-6 py-2 rounded text-xs font-bold shadow-md uppercase tracking-wider transition-all cursor-pointer ${
                  items.length > 0
                    ? 'bg-violet-700 hover:bg-violet-800 text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Guardar Compra e Ingresar Stock
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
