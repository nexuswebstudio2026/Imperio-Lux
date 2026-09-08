import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { DetalleVentaItem, Cliente } from '../../types';
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  UserPlus,
  Receipt,
  RotateCcw,
  Barcode,
  Search,
} from 'lucide-react';

export const VentaPOSView: React.FC = () => {
  const {
    clientes,
    addCliente,
    documentos,
    comprobantes,
    productos,
    presentaciones,
    empresa,
    currentMoneda,
    addVenta,
    setActiveComprobanteVenta,
    setActiveTab,
    activeCaja,
  } = useApp();

  // Form states
  const [clienteId, setClienteId] = useState<number>(clientes[0]?.id || 1);
  const [comprobanteId, setComprobanteId] = useState<number>(comprobantes[0]?.id || 1);
  const [metodoPago, setMetodoPago] = useState<
    'Efectivo' | 'Tarjeta de Débito' | 'Tarjeta de Crédito' | 'Transferencia' | 'Yape / Plin'
  >('Efectivo');

  // Product selection & inputs
  const [selectedProductoId, setSelectedProductoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number | ''>(1);
  const [dineroRecibido, setDineroRecibido] = useState<number | ''>('');

  // Items in current cart
  const [items, setItems] = useState<DetalleVentaItem[]>([]);

  // Modals & alerts
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // New client quick-add form
  const [newClientName, setNewClientName] = useState('');
  const [newClientDocTipo, setNewClientDocTipo] = useState(1);
  const [newClientDocNum, setNewClientDocNum] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedProduct = productos.find((p) => p.id === Number(selectedProductoId));
  const selectedProductStock = selectedProduct ? selectedProduct.cantidad : 0;
  const selectedProductPrice = selectedProduct ? selectedProduct.precio_venta : 0;

  // Real-time calculations
  const impuestoPorcentaje = empresa.porcentaje_impuesto || 18;
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const igv = Number(((subtotal * impuestoPorcentaje) / 100).toFixed(2));
  const total = Number((subtotal + igv).toFixed(2));

  // Change calculation
  const dineroNum = typeof dineroRecibido === 'number' ? dineroRecibido : parseFloat(String(dineroRecibido) || '0');
  const vuelto = dineroNum >= total && total > 0 ? (dineroNum - total).toFixed(2) : '';

  const handleAddProducto = () => {
    if (!selectedProductoId) {
      showToast('Por favor seleccione un producto');
      return;
    }

    const cantNum = Number(cantidad);
    if (!cantNum || cantNum <= 0) {
      showToast('Ingrese una cantidad válida mayor a 0');
      return;
    }

    if (!selectedProduct) return;

    if (cantNum > selectedProduct.cantidad) {
      showToast(`Stock insuficiente. Solo quedan ${selectedProduct.cantidad} unidades disponibles.`);
      return;
    }

    const existingItem = items.find((it) => it.producto_id === selectedProduct.id);
    if (existingItem) {
      showToast('El producto ya se encuentra en el detalle. Puedes modificar su cantidad.');
      return;
    }

    const presentacion = presentaciones.find((p) => p.id === selectedProduct.presentacione_id);
    const itemSubtotal = Number((cantNum * selectedProduct.precio_venta).toFixed(2));

    const newItem: DetalleVentaItem = {
      id: Date.now(),
      producto_id: selectedProduct.id,
      nombre_producto: selectedProduct.nombre,
      presentacion_sigla: presentacion ? presentacion.sigla : 'UND',
      cantidad: cantNum,
      precio_venta: selectedProduct.precio_venta,
      subtotal: itemSubtotal,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProductoId('');
    setCantidad(1);
    showToast(`"${selectedProduct.nombre}" agregado`, 'success');
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItemQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const prod = productos.find((p) => p.id === it.producto_id);
          const maxStock = prod ? prod.cantidad : 999;
          const newQty = it.cantidad + delta;
          if (newQty < 1) return it;
          if (newQty > maxStock) {
            showToast(`No puedes superar el stock disponible (${maxStock})`);
            return it;
          }
          return {
            ...it,
            cantidad: newQty,
            subtotal: Number((newQty * it.precio_venta).toFixed(2)),
          };
        }
        return it;
      })
    );
  };

  const handleCancelSale = () => {
    setItems([]);
    setSelectedProductoId('');
    setCantidad(1);
    setDineroRecibido('');
    setShowCancelModal(false);
    showToast('Venta cancelada', 'info' as any);
  };

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Debe agregar al menos un producto a la venta');
      return;
    }

    if (metodoPago === 'Efectivo' && dineroNum > 0 && dineroNum < total) {
      showToast('El dinero recibido no cubre el importe total de la venta');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const createdSale = addVenta({
      comprobante_id: Number(comprobanteId),
      cliente_id: Number(clienteId),
      user_id: 1,
      fecha_hora: nowStr,
      subtotal,
      impuesto: igv,
      total,
      metodo_pago: metodoPago,
      monto_recibido: dineroNum || total,
      vuelto_entregado: vuelto ? parseFloat(vuelto) : 0,
      estado: 'Completada',
      items,
    });

    // Clear form
    setItems([]);
    setSelectedProductoId('');
    setCantidad(1);
    setDineroRecibido('');

    // Open receipt modal!
    setActiveComprobanteVenta(createdSale);
  };

  const handleCreateClientQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const created = addCliente({
      tipo_persona: 'Natural',
      razon_social: newClientName.trim(),
      documento_id: Number(newClientDocTipo),
      numero_documento: newClientDocNum || '00000000',
      email: 'cliente@correo.com',
      telefono: newClientPhone || '000000000',
      direccion: newClientAddress || 'Ciudad',
      estado: true,
    });

    setClienteId(created.id);
    setShowNewClientModal(false);
    setNewClientName('');
    setNewClientDocNum('');
    setNewClientPhone('');
    setNewClientAddress('');
    showToast(`Cliente "${created.razon_social}" añadido y seleccionado`, 'success');
  };

  return (
    <div>
      <Breadcrumb
        title="Realizar Venta"
        items={[{ label: 'Ventas', tab: 'ventas' }, { label: 'Realizar Venta' }]}
        actions={
          <button
            onClick={() => setActiveTab('ventas')}
            className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer bg-white"
          >
            Ver Historial de Ventas
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

      <form onSubmit={handleCompleteSale} className="space-y-6">
        {/* 1. DATOS GENERALES (Green frame like in Laravel template) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-emerald-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 text-center uppercase tracking-wide">
            Datos Generales
          </div>
          <div className="p-4 sm:p-5 border-2 border-emerald-500/50 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Cliente */}
              <div className="md:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="cliente-select" className="text-xs font-bold text-slate-700">
                    Cliente:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewClientModal(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Nuevo Cliente</span>
                  </button>
                </div>
                <select
                  id="cliente-select"
                  value={clienteId}
                  onChange={(e) => setClienteId(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero_documento} - {c.razon_social} ({c.tipo_persona})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Comprobante */}
              <div className="md:col-span-3">
                <label htmlFor="comprobante-select" className="block text-xs font-bold text-slate-700 mb-1">
                  Comprobante:
                </label>
                <select
                  id="comprobante-select"
                  value={comprobanteId}
                  onChange={(e) => setComprobanteId(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {comprobantes.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.nombre} ({comp.serie_default})
                    </option>
                  ))}
                </select>
              </div>

              {/* Método de Pago */}
              <div className="md:col-span-3">
                <label htmlFor="metodo-pago-select" className="block text-xs font-bold text-slate-700 mb-1">
                  Método de Pago:
                </label>
                <select
                  id="metodo-pago-select"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Yape / Plin">Yape / Plin</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. DETALLES DE LA VENTA (Blue frame like in Laravel template) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 text-center uppercase tracking-wide">
            Detalles de la Venta
          </div>
          <div className="p-4 sm:p-5 border-2 border-blue-500/50 rounded-b-lg space-y-4">
            {/* Selector de Producto */}
            <div>
              <label htmlFor="producto-select" className="block text-xs font-bold text-slate-700 mb-1">
                Busque o Seleccione un Producto:
              </label>
              <div className="flex gap-2">
                <select
                  id="producto-select"
                  value={selectedProductoId}
                  onChange={(e) => setSelectedProductoId(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar producto para agregar --</option>
                  {productos
                    .filter((p) => p.estado)
                    .map((p) => {
                      const pres = presentaciones.find((pr) => pr.id === p.presentacione_id);
                      return (
                        <option key={p.id} value={p.id}>
                          Cód: {p.codigo} - {p.nombre} - ({pres?.sigla || 'UND'}) - {currentMoneda.simbolo}{' '}
                          {p.precio_venta.toFixed(2)} [Stock: {p.cantidad}]
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {/* Dynamic Stock & Unit Price Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  En Stock Disponible:
                </label>
                <div
                  className={`px-3 py-1.5 rounded font-bold text-xs ${
                    selectedProduct
                      ? selectedProductStock > 5
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {selectedProduct ? `${selectedProductStock} unidades` : 'Seleccione producto'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Precio Unitario:
                </label>
                <div className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded font-bold text-xs">
                  {selectedProduct
                    ? `${currentMoneda.simbolo} ${selectedProductPrice.toFixed(2)}`
                    : '--'}
                </div>
              </div>

              <div>
                <label htmlFor="cantidad-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cantidad a Vender:
                </label>
                <div className="flex gap-2">
                  <input
                    id="cantidad-input"
                    type="number"
                    min="1"
                    max={selectedProductStock || 9999}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                  <button
                    id="btn-agregar-producto"
                    type="button"
                    onClick={handleAddProducto}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-600 text-white font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5">Presentación</th>
                    <th className="px-4 py-2.5 text-center">Cantidad</th>
                    <th className="px-4 py-2.5 text-right">Precio Unit.</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                    <th className="px-4 py-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                        <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No hay productos agregados en el detalle.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          {item.nombre_producto}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                            {item.presentacion_sigla}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.id, -1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded-l cursor-pointer font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold text-slate-800">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.id, 1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded-r cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">
                          {currentMoneda.simbolo} {item.precio_venta.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          {currentMoneda.simbolo} {item.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold text-xs border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-600">
                      Sumas (Base Imponible):
                    </td>
                    <td colSpan={2} className="px-4 py-2 text-right font-bold text-slate-800">
                      {currentMoneda.simbolo} {subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-600">
                      {empresa.abreviatura_impuesto || 'IGV'} ({impuestoPorcentaje}%):
                    </td>
                    <td colSpan={2} className="px-4 py-2 text-right font-bold text-slate-800">
                      {currentMoneda.simbolo} {igv.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50 text-blue-900 text-sm font-bold border-t border-blue-200">
                    <td colSpan={4} className="px-4 py-2.5 text-right uppercase">
                      Total a Pagar:
                    </td>
                    <td colSpan={2} className="px-4 py-2.5 text-right text-base text-blue-700">
                      {currentMoneda.simbolo} {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Botón cancelar venta */}
            {items.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancelar Venta</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. FINALIZAR VENTA (Blue frame with money received & change) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 text-center uppercase tracking-wide">
            Finalizar Venta y Cobro
          </div>
          <div className="p-4 sm:p-5 border-2 border-slate-700/40 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-5">
              <div>
                <label htmlFor="dinero-recibido" className="block text-xs font-bold text-slate-700 mb-1">
                  Ingrese Dinero Recibido ({currentMoneda.simbolo}):
                </label>
                <input
                  id="dinero-recibido"
                  type="number"
                  step="any"
                  placeholder={total > 0 ? total.toFixed(2) : '0.00'}
                  value={dineroRecibido}
                  onChange={(e) => setDineroRecibido(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-base font-bold bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="vuelto-calculado" className="block text-xs font-bold text-slate-700 mb-1">
                  Vuelto a Entregar ({currentMoneda.simbolo}):
                </label>
                <input
                  id="vuelto-calculado"
                  readOnly
                  type="text"
                  value={vuelto ? `${currentMoneda.simbolo} ${vuelto}` : '0.00'}
                  className="w-full text-base font-bold bg-slate-100 border border-slate-300 rounded px-3 py-2 text-emerald-700 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="text-center">
              <button
                id="btn-guardar-venta"
                type="submit"
                disabled={items.length === 0}
                className={`px-8 py-3 rounded-lg text-sm font-bold shadow-md uppercase tracking-wider transition-all cursor-pointer ${
                  items.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-lg'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Realizar Venta e Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Cancel Sale Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Advertencia</span>
            </h3>
            <p className="text-xs text-slate-600">
              ¿Seguro que quieres cancelar la venta actual? Se vaciarán todos los productos agregados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded font-medium cursor-pointer"
              >
                Continuar Venta
              </button>
              <button
                type="button"
                onClick={handleCancelSale}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Add Client */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Registrar Nuevo Cliente Rápido</span>
              </h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClientQuick} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre o Razón Social:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Rosa Quispe Santos"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Documento:</label>
                  <select
                    value={newClientDocTipo}
                    onChange={(e) => setNewClientDocTipo(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    {documentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° Documento:</label>
                  <input
                    type="text"
                    placeholder="8 u 11 dígitos"
                    value={newClientDocNum}
                    onChange={(e) => setNewClientDocNum(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    placeholder="999..."
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dirección:</label>
                  <input
                    type="text"
                    placeholder="Av. ..."
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
