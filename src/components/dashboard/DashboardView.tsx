import React from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import {
  Users,
  Store,
  ShoppingBag,
  UserCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  Package,
  Database,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    clientes,
    compras,
    productos,
    users,
    ventas,
    currentMoneda,
    setActiveTab,
    activeCaja,
    setActiveComprobanteVenta,
    firebaseProjectId,
    firebaseDatabaseId,
  } = useApp();

  // 5 lowest stock products
  const lowestStockProductos = [...productos]
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 5);

  const maxStock = Math.max(...lowestStockProductos.map((p) => p.cantidad), 10);

  // Group sales for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const displayStr = `${day}/${month}`;
    return { dateStr, displayStr };
  });

  const dailySales = last7Days.map((day) => {
    const totalDay = ventas
      .filter((v) => v.estado === 'Completada' && v.fecha_hora.startsWith(day.dateStr))
      .reduce((sum, v) => sum + v.total, 0);
    return { ...day, total: totalDay };
  });

  // Calculate highest daily sale for scale
  const maxDaySale = Math.max(...dailySales.map((d) => d.total), 150);

  // Total sales revenue
  const totalRevenue = ventas
    .filter((v) => v.estado === 'Completada')
    .reduce((sum, v) => sum + v.total, 0);

  // Recent 5 sales
  const recentVentas = [...ventas].slice(0, 5);

  return (
    <div>
      <Breadcrumb
        title="Panel Principal"
        items={[{ label: 'Panel' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ventas_create')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Nueva Venta</span>
            </button>
            <button
              onClick={() => setActiveTab('compras_create')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Nueva Compra</span>
            </button>
          </div>
        }
      />

      {/* Caja status alert banner */}
      {activeCaja ? (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>{activeCaja.nombre}</strong> está actualmente abierta. Saldo estimado:{' '}
              <strong className="text-emerald-900 font-bold">
                {currentMoneda.simbolo} {activeCaja.saldo_estimado.toFixed(2)}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setActiveTab('cajas')}
            className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
          >
            Administrar Caja
          </button>
        </div>
      ) : (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>No hay una caja abierta actualmente. Abre una caja para registrar pagos en efectivo.</span>
          </div>
          <button
            onClick={() => setActiveTab('cajas')}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs cursor-pointer shadow-sm"
          >
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* Módulo de Base de Datos Cloud Vinculada */}
      <div className="mb-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Módulo de Base de Datos Firestore
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Conectada en Tiempo Real
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                21 Tablas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Proyecto: <code className="text-amber-300 font-mono font-medium">{firebaseProjectId}</code> | Base de datos: <code className="text-emerald-300 font-mono font-medium">{firebaseDatabaseId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-dashboard-database"
            onClick={() => setActiveTab('database')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ver Tablas y Datos</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4 SB Admin Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Clientes */}
        <div className="bg-blue-600 text-white rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <Users className="w-4 h-4" />
                <span>Clientes</span>
              </div>
              <div className="text-2xl font-bold">{clientes.length}</div>
            </div>
            <p className="text-[11px] text-blue-100 mt-1">Registrados en la base de datos</p>
          </div>
          <button
            onClick={() => setActiveTab('clientes')}
            className="bg-blue-700/80 hover:bg-blue-700 px-4 py-2 text-xs text-white flex items-center justify-between transition-colors cursor-pointer border-t border-blue-500/30"
          >
            <span>Ver más detalles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compras */}
        <div className="bg-slate-700 text-white rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <Store className="w-4 h-4" />
                <span>Compras</span>
              </div>
              <div className="text-2xl font-bold">{compras.length}</div>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Órdenes de mercadería</p>
          </div>
          <button
            onClick={() => setActiveTab('compras')}
            className="bg-slate-800/80 hover:bg-slate-800 px-4 py-2 text-xs text-white flex items-center justify-between transition-colors cursor-pointer border-t border-slate-600/30"
          >
            <span>Ver historial</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Productos */}
        <div className="bg-emerald-600 text-white rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <ShoppingBag className="w-4 h-4" />
                <span>Productos</span>
              </div>
              <div className="text-2xl font-bold">{productos.length}</div>
            </div>
            <p className="text-[11px] text-emerald-100 mt-1">En catálogo activo</p>
          </div>
          <button
            onClick={() => setActiveTab('productos')}
            className="bg-emerald-700/80 hover:bg-emerald-700 px-4 py-2 text-xs text-white flex items-center justify-between transition-colors cursor-pointer border-t border-emerald-500/30"
          >
            <span>Administrar catálogo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Usuarios */}
        <div className="bg-cyan-600 text-white rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <UserCheck className="w-4 h-4" />
                <span>Usuarios</span>
              </div>
              <div className="text-2xl font-bold">{users.length}</div>
            </div>
            <p className="text-[11px] text-cyan-100 mt-1">Accesos al sistema</p>
          </div>
          <button
            onClick={() => setActiveTab('users')}
            className="bg-cyan-700/80 hover:bg-cyan-700 px-4 py-2 text-xs text-white flex items-center justify-between transition-colors cursor-pointer border-t border-cyan-500/30"
          >
            <span>Configurar permisos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Section matching Laravel SB Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: 5 Productos con el stock más bajo */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>5 Productos con el stock más bajo</span>
            </div>
            <button
              onClick={() => setActiveTab('inventario')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Ajustar stock
            </button>
          </div>
          <div className="p-4 space-y-3.5">
            {lowestStockProductos.map((prod) => {
              const pct = Math.min(100, Math.round((prod.cantidad / maxStock) * 100));
              const isCritical = prod.cantidad <= 5;
              return (
                <div key={prod.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[220px]">
                      {prod.nombre}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {prod.cantidad} unid.
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Ventas en los últimos 7 días */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Ventas en los últimos 7 días</span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              Total: {currentMoneda.simbolo} {totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="p-4">
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2">
              {dailySales.map((item, idx) => {
                const heightPct = Math.min(100, Math.round((item.total / maxDaySale) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {currentMoneda.simbolo}
                      {item.total.toFixed(0)}
                    </div>
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-300 relative"
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      title={`${item.displayStr}: ${currentMoneda.simbolo} ${item.total.toFixed(2)}`}
                    />
                    <span className="text-[10px] font-medium text-slate-500">{item.displayStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs sm:text-sm">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>Últimas Ventas Realizadas</span>
          </div>
          <button
            onClick={() => setActiveTab('ventas')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todas las ventas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Comprobante</th>
                <th className="px-4 py-2.5">Fecha y Hora</th>
                <th className="px-4 py-2.5">Cliente</th>
                <th className="px-4 py-2.5">Método de Pago</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentVentas.map((venta) => {
                const client = clientes.find((c) => c.id === venta.cliente_id);
                return (
                  <tr key={venta.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {venta.numero_comprobante}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{venta.fecha_hora}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {client?.razon_social || 'Cliente'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {currentMoneda.simbolo} {venta.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => setActiveComprobanteVenta(venta)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-semibold text-[11px] cursor-pointer transition-colors"
                      >
                        Ver Comprobante
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
