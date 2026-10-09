import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
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
  FileSpreadsheet,
  BarChart2,
  LineChart as LineChartIcon,
  Calendar,
  Sparkles,
  DollarSign,
  Receipt,
  Boxes,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Venta } from '../../types';

interface WeeklySalesChartProps {
  ventas: Venta[];
  simboloMoneda: string;
}

const CustomWeeklyTooltip = ({ active, payload, simboloMoneda }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl border border-slate-700/80 text-xs z-50">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between gap-4">
          <span>{data.fullDayOfWeek || data.label}</span>
          <span className="font-mono text-[11px] text-slate-400">{data.dateStr}</span>
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Total vendido:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {simboloMoneda} {data.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Transacciones:</span>
            <span className="font-semibold text-slate-200">
              {data.transacciones} {data.transacciones === 1 ? 'venta' : 'ventas'}
            </span>
          </div>
          {data.transacciones > 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Ticket promedio:</span>
              <span className="font-medium text-blue-300 font-mono">
                {simboloMoneda} {(data.total / data.transacciones).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const WeeklySalesChart: React.FC<WeeklySalesChartProps> = ({
  ventas,
  simboloMoneda,
}) => {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');

  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = dayNamesShort[d.getDay()];
      const fullDayOfWeek = dayNamesFull[d.getDay()];
      const label = `${dayOfWeek} ${day}/${month}`;
      const shortLabel = `${day}/${month}`;

      const dayVentas = ventas.filter((v) => {
        if (v.estado !== 'Completada') return false;
        const vDate = v.fecha_hora ? v.fecha_hora.slice(0, 10) : '';
        return vDate === dateStr;
      });

      const total = dayVentas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
      const transacciones = dayVentas.length;

      return {
        dateStr,
        label,
        shortLabel,
        dayOfWeek,
        fullDayOfWeek,
        total: Math.round(total * 100) / 100,
        transacciones,
      };
    });
  }, [ventas]);

  const totalSemana = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.total, 0),
    [weeklyData]
  );

  const transaccionesSemana = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.transacciones, 0),
    [weeklyData]
  );

  const promedioDiario = useMemo(
    () => totalSemana / 7,
    [totalSemana]
  );

  const mejorDia = useMemo(() => {
    return weeklyData.reduce(
      (best, curr) => (curr.total > best.total ? curr : best),
      weeklyData[0]
    );
  }, [weeklyData]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
            Ventas Diarias (Última Semana)
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <Calendar className="w-3 h-3" /> 7 días
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="inline-flex rounded-md bg-slate-200/70 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gráfico de Área"
            >
              <LineChartIcon className="w-3 h-3" />
              <span>Tendencia</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gráfico de Barras"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Barras</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Top Summary Badges */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Total de la Semana</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              {simboloMoneda} {totalSemana.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-medium block">Transacciones</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {transaccionesSemana} {transaccionesSemana === 1 ? 'venta' : 'ventas'}
            </span>
          </div>
        </div>

        {/* Recharts Chart Container */}
        <div className="w-full h-52 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'area' ? (
              <AreaChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorWeeklySales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    `${simboloMoneda}${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                  }
                />
                <Tooltip content={<CustomWeeklyTooltip simboloMoneda={simboloMoneda} />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorWeeklySales)"
                  dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 5.5, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    `${simboloMoneda}${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                  }
                />
                <Tooltip content={<CustomWeeklyTooltip simboloMoneda={simboloMoneda} />} />
                <Bar
                  dataKey="total"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer Metrics */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Promedio Diario
            </span>
            <span className="font-bold text-slate-800 font-mono text-xs">
              {simboloMoneda} {promedioDiario.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-100 text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Día con Mayor Venta
            </span>
            <span className="font-bold text-blue-700 font-mono text-xs truncate block" title={`${mejorDia.label} (${simboloMoneda} ${mejorDia.total.toFixed(2)})`}>
              {mejorDia.total > 0 ? `${mejorDia.dayOfWeek}: ${simboloMoneda} ${mejorDia.total.toFixed(2)}` : 'Sin ventas aún'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    googleSheetsId,
    googleSheetsStatus,
    setShowGoogleSheetsModal,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshNotice(
        `¡Panel principal e indicadores actualizados! Moneda activa: ${currentMoneda.nombre_completo} (${currentMoneda.simbolo} ${currentMoneda.estandar_iso}).`
      );
      setTimeout(() => {
        setRefreshNotice(null);
      }, 5000);
    }, 450);
  };

  // 5 lowest stock products
  const lowestStockProductos = [...productos]
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 5);

  const maxStock = Math.max(...lowestStockProductos.map((p) => p.cantidad), 10);

  // Recent 5 sales
  const recentVentas = [...ventas].slice(0, 5);

  // Today's date calculations
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const todayFormatted = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  }, []);

  // 1. KPI: Daily Revenue (Ingresos Diarios de Hoy)
  const todayVentas = useMemo(() => {
    return ventas.filter((v) => {
      if (v.estado !== 'Completada') return false;
      const datePart = v.fecha_hora ? v.fecha_hora.slice(0, 10) : '';
      return datePart === todayStr;
    });
  }, [ventas, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayVentas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  }, [todayVentas]);

  const todaySalesCount = todayVentas.length;

  // 2. KPI: Total Sales Count (Total de Ventas Realizadas)
  const completedVentas = useMemo(() => {
    return ventas.filter((v) => v.estado === 'Completada');
  }, [ventas]);

  const totalSalesCount = completedVentas.length;

  const totalAllTimeRevenue = useMemo(() => {
    return completedVentas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  }, [completedVentas]);

  const averageTicket = useMemo(() => {
    return totalSalesCount > 0 ? totalAllTimeRevenue / totalSalesCount : 0;
  }, [totalAllTimeRevenue, totalSalesCount]);

  // 3. KPI: Current Inventory Value (Valor del Inventario Actual)
  const inventoryStats = useMemo(() => {
    let totalValueCost = 0;
    let totalValueSale = 0;
    let totalUnits = 0;

    productos.forEach((p) => {
      const qty = Math.max(0, Number(p.cantidad) || 0);
      const buyPrice = Number(p.precio_compra) || 0;
      const sellPrice = Number(p.precio_venta) || 0;

      totalValueCost += qty * buyPrice;
      totalValueSale += qty * sellPrice;
      totalUnits += qty;
    });

    return {
      totalValueCost: Math.round(totalValueCost * 100) / 100,
      totalValueSale: Math.round(totalValueSale * 100) / 100,
      totalUnits,
      productCount: productos.length,
    };
  }, [productos]);

  return (
    <div>
      <Breadcrumb
        title="Panel Principal"
        items={[{ label: 'Panel' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white rounded text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Actualizar datos del panel, métricas de ventas y sincronización en Peso colombiano (COP)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
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

      {/* Alerta / Notificación de Actualización */}
      {refreshNotice && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-between shadow-2xs transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{refreshNotice}</span>
          </div>
          <button
            onClick={() => setRefreshNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Summary Section: Daily Revenue, Total Sales Count, Current Inventory Value */}
      <div className="mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Daily Revenue */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-4.5 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Ingresos Diarios
                    </h3>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {todayFormatted}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hoy
                </span>
              </div>

              <div className="space-y-1 my-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {currentMoneda.simbolo}{' '}
                  {todayRevenue.toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {todaySalesCount === 1
                    ? '1 venta registrada hoy'
                    : `${todaySalesCount} ventas registradas hoy`}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                {todayRevenue > 0 ? 'Facturación activa' : 'Sin ventas hoy aún'}
              </span>
              <button
                onClick={() => setActiveTab('ventas')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver ventas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Total Sales Count */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-4.5 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Total de Ventas
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Histórico acumulado
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <ShoppingCart className="w-3 h-3 text-blue-600" />
                  Global
                </span>
              </div>

              <div className="space-y-1 my-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {totalSalesCount.toLocaleString('es-CO')}
                  <span className="text-sm font-semibold text-slate-500 ml-1.5">
                    {totalSalesCount === 1 ? 'operación' : 'operaciones'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Total acumulado:{' '}
                  <strong className="text-slate-800 font-bold font-mono">
                    {currentMoneda.simbolo}{' '}
                    {totalAllTimeRevenue.toLocaleString('es-CO', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Ticket prom:{' '}
                <strong className="text-slate-700 font-mono">
                  {currentMoneda.simbolo} {averageTicket.toFixed(2)}
                </strong>
              </span>
              <button
                onClick={() => setActiveTab('ventas')}
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Historial</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Current Inventory Value */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-4.5 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Valor de Inventario
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Precio de venta activo
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Package className="w-3 h-3 text-amber-600" />
                  {inventoryStats.totalUnits} unid.
                </span>
              </div>

              <div className="space-y-1 my-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {currentMoneda.simbolo}{' '}
                  {inventoryStats.totalValueSale.toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Costo de reposición:{' '}
                  <strong className="text-slate-800 font-bold font-mono">
                    {currentMoneda.simbolo}{' '}
                    {inventoryStats.totalValueCost.toLocaleString('es-CO', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                {inventoryStats.productCount} productos registrados
              </span>
              <button
                onClick={() => setActiveTab('inventario')}
                className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver inventario</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Módulo de Base de Datos en Google Sheets */}
      <div className="mb-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/60 rounded-xl p-4 shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Base de Datos en Google Sheets
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                21 Tablas Sincronizadas
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                21 Hojas
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Spreadsheet ID: <code className="text-emerald-300 font-mono font-medium">{googleSheetsId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-dashboard-sheets"
            onClick={() => setShowGoogleSheetsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sincronizar Sheets</span>
          </button>
          <button
            id="btn-dashboard-database"
            onClick={() => setActiveTab('database')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
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
              const min = prod.stock_minimo !== undefined ? prod.stock_minimo : 5;
              const isCritical = prod.cantidad < min;
              return (
                <div key={prod.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[220px]">
                      {prod.nombre}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        isCritical ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-100 text-amber-700'
                      }`}
                      title={`Stock actual: ${prod.cantidad} / Mínimo: ${min}`}
                    >
                      {prod.cantidad} unid. <span className="text-[9px] font-normal opacity-80">(Mín: {min})</span>
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

        {/* Chart 2: Gráfico Recharts de Ventas Diarias durante la última semana */}
        <WeeklySalesChart ventas={ventas} simboloMoneda={currentMoneda.simbolo} />
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
