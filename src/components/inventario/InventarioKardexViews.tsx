import React, { useState, useMemo } from 'react';
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
  ShieldAlert,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  Bell,
  Radio,
} from 'lucide-react';

/* ================= INVENTARIO ================= */
export const InventarioView: React.FC = () => {
  const {
    productos,
    inventarioAjustes,
    addInventarioAjuste,
    currentMoneda,
    setActiveTab,
    marcas,
    presentaciones,
    setShowBrowserNotificationModal,
    browserNotificationsStatus,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<number>(productos[0]?.id || 1);
  const [tipoAjuste, setTipoAjuste] = useState<'Entrada' | 'Salida'>('Entrada');
  const [cantidadAjuste, setCantidadAjuste] = useState<number>(1);
  const [motivoAjuste, setMotivoAjuste] = useState('Conteo físico periódico');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'bajo_minimo' | 'optimo'>('todos');

  // Calculations
  const totalArticulos = useMemo(
    () => productos.reduce((sum, p) => sum + (Number(p.cantidad) || 0), 0),
    [productos]
  );
  const valorCostoTotal = useMemo(
    () => productos.reduce((sum, p) => sum + (Number(p.cantidad) || 0) * (Number(p.precio_compra) || 0), 0),
    [productos]
  );
  const valorVentaTotal = useMemo(
    () => productos.reduce((sum, p) => sum + (Number(p.cantidad) || 0) * (Number(p.precio_venta) || 0), 0),
    [productos]
  );
  const margenEstimado = valorVentaTotal - valorCostoTotal;

  // Productos con stock por debajo del nivel mínimo definido
  const productosEnAlerta = useMemo(() => {
    return productos.filter((p) => {
      const min = p.stock_minimo !== undefined ? p.stock_minimo : 5;
      return p.cantidad < min;
    });
  }, [productos]);

  const totalEnAlerta = productosEnAlerta.length;
  const totalAgotados = useMemo(
    () => productos.filter((p) => p.cantidad === 0).length,
    [productos]
  );
  const deficitTotalUnidades = useMemo(() => {
    return productosEnAlerta.reduce((acc, p) => {
      const min = p.stock_minimo !== undefined ? p.stock_minimo : 5;
      return acc + Math.max(0, min - p.cantidad);
    }, 0);
  }, [productosEnAlerta]);

  // Handle open restock modal for specific product
  const handleOpenRestock = (prodId?: number, suggestedQty?: number) => {
    const targetId = prodId || productosEnAlerta[0]?.id || productos[0]?.id || 1;
    const targetProd = productos.find((p) => p.id === targetId);
    const min = targetProd?.stock_minimo !== undefined ? targetProd.stock_minimo : 5;
    const deficit = targetProd ? Math.max(1, min - targetProd.cantidad) : 5;

    setSelectedProdId(targetId);
    setTipoAjuste('Entrada');
    setCantidadAjuste(suggestedQty !== undefined ? suggestedQty : deficit);
    setMotivoAjuste(
      targetProd && targetProd.cantidad < min
        ? `Reposición de stock por nivel mínimo (${targetProd.nombre})`
        : 'Ajuste manual de inventario'
    );
    setModalOpen(true);
  };

  const handleSaveAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidadAjuste || cantidadAjuste <= 0) return;
    addInventarioAjuste(Number(selectedProdId), tipoAjuste, Number(cantidadAjuste), motivoAjuste);
    setModalOpen(false);
  };

  // Filtered products list
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const min = p.stock_minimo !== undefined ? p.stock_minimo : 5;
      const isLow = p.cantidad < min;

      if (filterMode === 'bajo_minimo' && !isLow) return false;
      if (filterMode === 'optimo' && isLow) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const marca = marcas.find((m) => m.id === p.marca_id);
      return (
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (marca && marca.nombre.toLowerCase().includes(term))
      );
    });
  }, [productos, filterMode, searchTerm, marcas]);

  const targetModalProduct = useMemo(
    () => productos.find((p) => p.id === selectedProdId),
    [productos, selectedProdId]
  );

  return (
    <div>
      <Breadcrumb
        title="Control de Inventario y Stock"
        items={[{ label: 'Módulos' }, { label: 'Inventario' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBrowserNotificationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Configurar y probar alertas push Notificaciones en tiempo real"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-blue-200" />
              <span>Alertas Push Notificaciones</span>
            </button>
            <button
              onClick={() => setActiveTab('kardex')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Kardex Valorizado</span>
            </button>
            <button
              onClick={() => handleOpenRestock()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajustar Stock Manual</span>
            </button>
          </div>
        }
      />

      {/* Hero Warning Banner for Low Stock Alert */}
      {totalEnAlerta > 0 && (
        <div className="mb-6 rounded-xl border-2 border-red-400/90 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-amber-500/10 p-4.5 shadow-sm transition-all animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-red-950 tracking-tight">
                    Alerta de Stock Crítico: {totalEnAlerta} {totalEnAlerta === 1 ? 'producto se encuentra' : 'productos se encuentran'} por debajo del nivel mínimo
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                    Nivel de Seguridad
                  </span>
                </div>
                <p className="text-xs text-red-900 mt-1">
                  Se requiere reponer un total acumulado de{' '}
                  <strong className="font-black text-red-950 underline decoration-red-400">
                    {deficitTotalUnidades} unidades
                  </strong>{' '}
                  para restaurar los niveles mínimos requeridos en el catálogo.{' '}
                  {totalAgotados > 0 && (
                    <span className="font-extrabold text-rose-700 ml-1">
                      (⚠️ {totalAgotados} {totalAgotados === 1 ? 'producto totalmente agotado con stock 0' : 'productos totalmente agotados con stock 0'})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === 'bajo_minimo' ? 'todos' : 'bajo_minimo')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  filterMode === 'bajo_minimo'
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>
                  {filterMode === 'bajo_minimo'
                    ? 'Mostrar todos los productos'
                    : `Filtrar solo los ${totalEnAlerta} en alerta`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenRestock()}
                className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Abrir ajuste manual para ingresar stock"
              >
                <Plus className="w-4 h-4" />
                <span>Reponer con Ajuste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards (Incluye Tarjeta de Alerta de Stock en Rojo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Artículos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Artículos Físicos
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalArticulos} unid.</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>En {productos.length} productos</span>
            <span className="font-semibold text-emerald-600">Catálogo activo</span>
          </div>
        </div>

        {/* Card 2: Alertas de Stock Crítico (Resaltada en Rojo) */}
        <div
          onClick={() => setFilterMode(filterMode === 'bajo_minimo' ? 'todos' : 'bajo_minimo')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden ${
            totalEnAlerta > 0
              ? 'bg-red-50/70 border-red-300 hover:border-red-400 hover:bg-red-50'
              : 'bg-white border-slate-200'
          }`}
          title="Clic para filtrar productos por nivel de stock"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${totalEnAlerta > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
              <span>Stock Bajo Nivel Mínimo</span>
            </p>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                totalEnAlerta > 0 ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {totalEnAlerta > 0 ? `${totalEnAlerta} ALERTA` : 'ÓPTIMO'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-black font-mono ${totalEnAlerta > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {totalEnAlerta}
            </p>
            <span className="text-xs font-semibold text-slate-600">
              {totalEnAlerta === 1 ? 'producto en riesgo' : 'productos en riesgo'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-200/60 text-[11px]">
            <span className="text-red-800 font-medium">
              {totalEnAlerta > 0 ? `Déficit: -${deficitTotalUnidades} unid.` : 'Sin déficit de existencias'}
            </span>
            <span className="text-red-700 font-bold group-hover:underline">
              {filterMode === 'bajo_minimo' ? 'Ver todos ✕' : 'Ver lista →'}
            </span>
          </div>
        </div>

        {/* Card 3: Valorizado al Costo */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Valorizado al Costo
          </p>
          <p className="text-2xl font-black text-slate-800 mt-1 font-mono">
            {currentMoneda.simbolo}{' '}
            {valorCostoTotal.toLocaleString('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Capital invertido</span>
            <span className="font-mono text-slate-600">{currentMoneda.estandar_iso}</span>
          </div>
        </div>

        {/* Card 4: Margen y Valor Proyectado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Margen Bruto Proyectado
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {currentMoneda.simbolo}{' '}
            {margenEstimado.toLocaleString('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Rentabilidad sobre costo:</span>
            <span className="font-bold text-emerald-700 font-mono">
              {valorCostoTotal > 0 ? ((margenEstimado / valorCostoTotal) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Stock Table & Adjustments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Stock Table with Red Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header & Filter Controls */}
          <div className="bg-slate-50/80 p-4 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Existencias y Niveles de Stock</span>
                  {totalEnAlerta > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                      {totalEnAlerta} en alerta
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Los productos con stock por debajo de su nivel mínimo están resaltados en rojo.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('productos')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Editar catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar producto o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterMode('todos')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    filterMode === 'todos'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  Todos ({productos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('bajo_minimo')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    filterMode === 'bajo_minimo'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Bajo Mínimo ({totalEnAlerta})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('optimo')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    filterMode === 'optimo'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  Óptimo ({productos.length - totalEnAlerta})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Producto</th>
                  <th className="px-3 py-3 text-center">Stock Actual</th>
                  <th className="px-3 py-3 text-center">Stock Mínimo</th>
                  <th className="px-3 py-3 text-center">Déficit / Nivel</th>
                  <th className="px-3 py-3 text-center">Estado Alerta</th>
                  <th className="px-3 py-3 text-right">P. Venta</th>
                  <th className="px-3.5 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-semibold text-slate-700">No hay productos en esta condición</p>
                        <p className="text-[11px] text-slate-400">
                          {filterMode === 'bajo_minimo'
                            ? '¡Excelente! Todos los productos cumplen con su nivel mínimo de seguridad.'
                            : 'Prueba a cambiar los términos de búsqueda.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((prod) => {
                    const minNivel = prod.stock_minimo !== undefined ? prod.stock_minimo : 5;
                    const isBelowMin = prod.cantidad < minNivel;
                    const isZero = prod.cantidad === 0;
                    const deficit = Math.max(0, minNivel - prod.cantidad);
                    const percent = Math.min(100, Math.round((prod.cantidad / Math.max(1, minNivel)) * 100));
                    const marca = marcas.find((m) => m.id === prod.marca_id);

                    return (
                      <tr
                        key={prod.id}
                        className={`transition-colors ${
                          isBelowMin
                            ? 'bg-red-50/90 hover:bg-red-100/90 border-l-4 border-l-red-600 text-red-950 font-medium'
                            : 'hover:bg-slate-50/90'
                        }`}
                      >
                        {/* Producto */}
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            {isBelowMin ? (
                              <div
                                className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs"
                                title="Stock por debajo del mínimo definido"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div>
                              <div
                                className={`font-bold line-clamp-1 ${
                                  isBelowMin ? 'text-red-950' : 'text-slate-900'
                                }`}
                              >
                                {prod.nombre}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-500">
                                  {prod.codigo}
                                </span>
                                {marca && (
                                  <span className="text-[10px] text-slate-400">
                                    • {marca.nombre}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Stock Actual (Resaltado en Rojo si está bajo el mínimo) */}
                        <td className="px-3 py-3 text-center">
                          {isBelowMin ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-black text-xs bg-red-600 text-white shadow-xs">
                                <AlertTriangle className="w-3 h-3 text-red-100 shrink-0" />
                                <span>{prod.cantidad} unid.</span>
                              </span>
                              {isZero && (
                                <span className="text-[9px] font-black uppercase text-red-700 tracking-wider mt-0.5">
                                  Agotado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-md font-bold text-xs bg-emerald-100 text-emerald-800">
                              {prod.cantidad} unid.
                            </span>
                          )}
                        </td>

                        {/* Stock Mínimo Definido */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isBelowMin
                                ? 'bg-red-200/60 text-red-900 border border-red-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                            title={`Nivel mínimo configurado: ${minNivel} unidades`}
                          >
                            {minNivel} unid.
                          </span>
                        </td>

                        {/* Déficit / Barra de Nivel */}
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={`text-[11px] font-black font-mono ${
                                isBelowMin ? 'text-red-700' : 'text-emerald-700'
                              }`}
                            >
                              {isBelowMin ? `-${deficit} unid.` : `+${prod.cantidad - minNivel} margen`}
                            </span>
                            <div className="w-20 bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isBelowMin ? 'bg-red-600' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-500 font-medium">
                              {percent}% del mín.
                            </span>
                          </div>
                        </td>

                        {/* Estado Alerta */}
                        <td className="px-3 py-3 text-center">
                          {isBelowMin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>{isZero ? 'AGOTADO' : 'BAJO MÍNIMO'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>ÓPTIMO</span>
                            </span>
                          )}
                        </td>

                        {/* P. Venta */}
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-800">
                          {currentMoneda.simbolo}{' '}
                          {prod.precio_venta.toLocaleString('es-CO', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Acción Rápida Reponer */}
                        <td className="px-3.5 py-3 text-center">
                          {isBelowMin ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRestock(prod.id, deficit)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                              title={`Reponer ${deficit} unidades faltantes para alcanzar el nivel mínimo`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Reponer (+{deficit})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRestock(prod.id, 1)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded cursor-pointer transition-colors"
                            >
                              Ajustar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de resumen de tabla */}
          <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Mostrando <strong>{filteredProductos.length}</strong> de <strong>{productos.length}</strong> productos
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>Rojo: Stock por debajo del mínimo definido</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Verde: Nivel de stock suficiente</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Panel de Alertas Críticas & Historial Reciente */}
        <div className="space-y-6">
          {/* Tarjeta de Lista Rápida de Productos en Alerta */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-red-50/70 px-4 py-3 border-b border-red-200 flex items-center justify-between">
              <span className="font-bold text-xs text-red-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Productos con Déficit ({totalEnAlerta})</span>
              </span>
              {totalEnAlerta > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('bajo_minimo')}
                  className="text-xs text-red-700 hover:text-red-900 font-bold cursor-pointer"
                >
                  Filtrar
                </button>
              )}
            </div>
            <div className="p-3 divide-y divide-red-100/60 max-h-64 overflow-y-auto">
              {totalEnAlerta === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Inventario 100% Abastecido</p>
                  <p className="text-[11px] text-slate-400">
                    Ningún producto tiene stock inferior a su nivel mínimo.
                  </p>
                </div>
              ) : (
                productosEnAlerta.map((prod) => {
                  const min = prod.stock_minimo !== undefined ? prod.stock_minimo : 5;
                  const deficit = Math.max(0, min - prod.cantidad);
                  return (
                    <div
                      key={prod.id}
                      className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{prod.nombre}</p>
                        <p className="text-[10px] text-red-600 font-medium">
                          Stock: <strong className="font-black text-red-700">{prod.cantidad}</strong> / Mínimo: {min} (Faltan {deficit})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenRestock(prod.id, deficit)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+{deficit}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Adjustments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Ajustes de Inventario Recientes
              </span>
              <button
                onClick={() => handleOpenRestock()}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
              >
                + Ajustar
              </button>
            </div>
            <div className="p-3 space-y-2.5 overflow-y-auto max-h-72">
              {inventarioAjustes.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-4">No hay ajustes registrados.</p>
              ) : (
                inventarioAjustes.map((ajuste) => {
                  const prod = productos.find((p) => p.id === ajuste.producto_id);
                  return (
                    <div
                      key={ajuste.id}
                      className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/50 text-xs space-y-1 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                          {prod?.nombre || 'Producto'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            ajuste.tipo === 'Entrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ajuste.tipo === 'Entrada' ? '+' : '-'}
                          {ajuste.cantidad} unid.
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-1">{ajuste.motivo}</p>
                      <span className="text-[10px] text-slate-400 block">{ajuste.fecha}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajuste Stock con Soporte de Alerta de Nivel Mínimo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Ajuste Manual de Inventario / Reabastecimiento</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Helper box showing current stock vs minimum */}
            {targetModalProduct && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  targetModalProduct.cantidad < (targetModalProduct.stock_minimo ?? 5)
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Stock actual: {targetModalProduct.cantidad} unid.</span>
                  <span>Mínimo definido: {targetModalProduct.stock_minimo ?? 5} unid.</span>
                </div>
                {targetModalProduct.cantidad < (targetModalProduct.stock_minimo ?? 5) ? (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-red-700 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Déficit de {(targetModalProduct.stock_minimo ?? 5) - targetModalProduct.cantidad} unid. para nivel mínimo.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoAjuste('Entrada');
                        setCantidadAjuste(
                          Math.max(1, (targetModalProduct.stock_minimo ?? 5) - targetModalProduct.cantidad)
                        );
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white cursor-pointer hover:bg-red-700"
                    >
                      Autollenar déficit
                    </button>
                  </div>
                ) : (
                  <p className="text-emerald-700 font-medium flex items-center gap-1 text-[11px] pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Este producto se encuentra en o por encima de su nivel óptimo.</span>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSaveAjuste} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Producto:</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedProdId(id);
                    const p = productos.find((prod) => prod.id === id);
                    if (p && p.cantidad < (p.stock_minimo ?? 5)) {
                      setTipoAjuste('Entrada');
                      setCantidadAjuste(Math.max(1, (p.stock_minimo ?? 5) - p.cantidad));
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
                >
                  {productos.map((p) => {
                    const min = p.stock_minimo ?? 5;
                    const isLow = p.cantidad < min;
                    return (
                      <option key={p.id} value={p.id}>
                        {isLow ? '🚨 ' : ''}{p.nombre} (Stock: {p.cantidad} / Mín: {min})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Ajuste:</label>
                  <select
                    value={tipoAjuste}
                    onChange={(e) => setTipoAjuste(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
                  >
                    <option value="Entrada">Entrada (+) Ingreso / Compra</option>
                    <option value="Salida">Salida (-) Merma / Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad a Ajustar:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantidadAjuste}
                    onChange={(e) => setCantidadAjuste(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 font-black font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo del Ajuste:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Reposición por alerta de nivel mínimo, Conteo físico"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Aplicar Ajuste de Stock
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
