import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { FirebaseModal } from './components/layout/FirebaseModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductoListView } from './components/productos/ProductoListView';
import {
  CategoriaView,
  PresentacionView,
  MarcaView,
} from './components/mantenimiento/MantenimientoViews';
import { ClienteListView, ProveedorListView } from './components/personas/PersonasViews';
import { VentaPOSView } from './components/ventas/VentaPOSView';
import { VentaListView } from './components/ventas/VentaListView';
import { CompraListView } from './components/compras/CompraListView';
import { CompraCreateView } from './components/compras/CompraCreateView';
import { CajaView } from './components/cajas/CajaView';
import { InventarioView, KardexView } from './components/inventario/InventarioKardexViews';
import {
  EmpresaConfigView,
  EmpleadoListView,
  UsuariosRolesView,
  ActivityLogView,
} from './components/configuracion/ConfigViews';
import { DatabaseView } from './components/database/DatabaseView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'panel':
        return <DashboardView />;
      case 'categorias':
        return <CategoriaView />;
      case 'presentaciones':
        return <PresentacionView />;
      case 'marcas':
        return <MarcaView />;
      case 'productos':
        return <ProductoListView />;
      case 'inventario':
        return <InventarioView />;
      case 'kardex':
        return <KardexView />;
      case 'clientes':
        return <ClienteListView />;
      case 'proveedores':
        return <ProveedorListView />;
      case 'cajas':
        return <CajaView />;
      case 'compras':
        return <CompraListView />;
      case 'compras_create':
        return <CompraCreateView />;
      case 'ventas':
        return <VentaListView />;
      case 'ventas_create':
        return <VentaPOSView />;
      case 'empresa':
        return <EmpresaConfigView />;
      case 'empleados':
        return <EmpleadoListView />;
      case 'users':
      case 'roles':
        return <UsuariosRolesView />;
      case 'activity_log':
        return <ActivityLogView />;
      case 'database':
        return <DatabaseView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <FirebaseModal />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
          <div className="max-w-7xl mx-auto">{renderCurrentView()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
