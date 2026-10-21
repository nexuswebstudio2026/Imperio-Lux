import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Navbar } from '../layout/Navbar';
import { BarChart2, MapPin, DollarSign, Shield, ShoppingCart, UsersRound } from 'lucide-react';

/* ================= DASHBOARD ADMIN ================= */
export const DashboardAdminView: React.FC = () => {
  const { users, ventas, compras, formatCurrency } = useApp();

  const [ventasTotales, setVentasTotales] = useState(0);
  const [comprasTotales, setComprasTotales] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);

  useEffect(() => {
    if (users) {
      setTotalUsuarios(users.length);
    }
    if (ventas) {
      const total = ventas.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
      setVentasTotales(total);
    }
    if (compras) {
      const total = compras.reduce((sum: number, c: any) => sum + (c.total || 0), 0);
      setComprasTotales(total);
    }
  }, [users, ventas, compras]);

  return (
    <div className="admin-shell h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <Breadcrumb
        title="Panel de Control Administrativo"
        items={[{ label: 'Inicio' }, { label: 'Panel Admin' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        {/* Users Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <UsersRound className="w-4 h-4 text-slate-600" /> 
              <span>Usuarios Registrados</span>
            </span>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-slate-900">{totalUsuarios}</div>
            <div className="text-sm text-slate-500">Total de usuarios del sistema</div>
          </div>
        </div>

        {/* Sales Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-600" /> 
              <span>Ventas Totales</span>
            </span>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(ventasTotales)}</div>
            <div className="text-sm text-slate-500">Ventas del período</div>
          </div>
        </div>

        {/* Purchases Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-slate-600" /> 
              <span>Compras Totales</span>
            </span>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(comprasTotales)}</div>
            <div className="text-sm text-slate-500">Compras del período</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 mt-4">
        {/* Revenue Chart placeholder */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-64">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-slate-600" /> 
              <span>Estadísticas de Ventas</span>
            </span>
          </div>
          <div className="p-4">
            <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
            <div className="text-xs text-slate-500 mt-2">Gráfico de ventas por período</div>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-64">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-600" /> 
              <span>Ubicación Empresa</span>
            </span>
          </div>
          <div className="p-4">
            <div className="text-center text-slate-400">Información de ubicación</div>
            <p className="text-sm text-slate-500 mt-2">Ver en mapa</p>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-64">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-600" /> 
              <span>Estado del Sistema</span>
            </span>
          </div>
          <div className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 mx-auto animate-bounce" />
              <p className="text-slate-600 mt-2">En línea</p>
            </div>
            <p className="text-xs text-slate-500">Todos los servicios operativos</p>
          </div>
        </div>
      </div>
    </div>
  );
};