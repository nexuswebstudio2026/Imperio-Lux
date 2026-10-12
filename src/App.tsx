import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GoogleSheetsModal } from './components/layout/GoogleSheetsModal';
import { PushNotificationToast } from './components/notifications/PushNotificationToast';
import { NotificationConfigModal } from './components/notifications/NotificationConfigModal';

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
  RegisteredUsersView,
  UsuariosRolesView,
  ActivityLogView,
} from './components/configuracion/ConfigViews';
import { DatabaseView } from './components/database/DatabaseView';
import { GoogleSheetsConfigPanel } from './components/sheets/GoogleSheetsConfigPanel';
import { PublicStorefront } from './components/storefront/PublicStorefront';
import { LoginPage } from './components/auth/LoginPage';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, setCurrentUser, productos, formatCurrency, theme, toggleTheme, downloadAllFromGoogleSheets } = useApp();
  const [route, setRoute] = useState(() => window.location.pathname);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const handleRouteChange = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    fetch('/api/auth/session').then((response) => response.json()).then(({ user }) => {
      if (user) setCurrentUser({ id: Number(user.id) || 0, name: user.name, email: user.email, role: user.role, user_type: user.type });
    }).catch(() => {}).finally(() => setAuthReady(true));
  }, [setCurrentUser]);

  useEffect(() => {
    if (route.startsWith('/admin') && currentUser?.role) setActiveTab('panel');
  }, [route, currentUser, setActiveTab]);

  useEffect(() => {
    if (currentUser && route.startsWith('/admin')) void downloadAllFromGoogleSheets().catch((error) => console.error('No se pudieron sincronizar los datos tras iniciar sesión:', error));
  }, [currentUser, route, downloadAllFromGoogleSheets]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  const role = currentUser?.role?.toLocaleLowerCase('es') || '';
  const isAdmin = currentUser?.user_type ? currentUser.user_type === 'admin' : /admin|administrador/.test(role);
  const isEmployee = currentUser?.user_type ? currentUser.user_type === 'employee' : /empleado|employee|cajero|vendedor/.test(role);
  const targetRoute = isAdmin ? '/admin' : isEmployee ? '/empleado' : '/cliente';
  const isProtectedRoute = route.startsWith('/admin') || route.startsWith('/empleado') || route.startsWith('/cliente');

  if (!authReady && isProtectedRoute) return <div className="grid min-h-screen place-items-center bg-[#f7f5f0] text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-300">Verificando sesión…</div>;
  if (isProtectedRoute && !currentUser) return <LoginPage onLogin={(user) => {
    const normalizedUser = { id: Number(user.id) || 0, name: user.name, email: user.email, role: user.role, user_type: user.type };
    setCurrentUser(normalizedUser);
    navigate(user.type === 'admin' ? '/admin' : user.type === 'employee' ? '/empleado' : '/cliente');
  }} onBack={() => navigate('/')} />;
  if (isProtectedRoute && currentUser && route !== targetRoute) { navigate(targetRoute); return null; }
  if (route === '/login' && currentUser) { navigate(targetRoute); return null; }
  if (route === '/login') return <LoginPage onLogin={(user) => {
    const normalizedUser = { id: Number(user.id) || 0, name: user.name, email: user.email, role: user.role, user_type: user.type };
    setCurrentUser(normalizedUser);
    navigate(user.type === 'admin' ? '/admin' : user.type === 'employee' ? '/empleado' : '/cliente');
  }} onBack={() => navigate('/')} />;
  if (!isProtectedRoute) return <PublicStorefront onAdminLogin={() => navigate('/login')} />;
  if (isEmployee || !isAdmin) return <main className="min-h-screen bg-[#f7f5f0] px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-white" data-theme={theme}>
    <div className="mx-auto max-w-6xl"><header className="flex items-center justify-between border-b border-slate-300 pb-5 dark:border-slate-800"><div><p className="text-xs uppercase tracking-[0.2em] text-[#9b7b3e]">Imperio Lux</p><h1 className="mt-1 font-serif text-3xl">Hola, {currentUser?.name}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Panel de {isEmployee ? 'empleado' : 'cliente'} · {currentUser?.email}</p></div><div className="flex gap-2"><button onClick={toggleTheme} className="border border-slate-300 p-3 dark:border-slate-700" aria-label="Cambiar tema">{theme === 'dark' ? '☀' : '☾'}</button><button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); setCurrentUser(null); navigate('/'); }} className="border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest dark:border-slate-700">Cerrar sesión</button></div></header>
      <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#9b7b3e]">Catálogo</p><h2 className="mt-2 font-serif text-3xl">Productos destacados</h2></div><a href="/#catalogo" className="text-xs text-[#8b6d35]">Ver sitio público →</a></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{productos.filter((product) => product.estado).slice(0, 12).map((product) => <article key={product.id} className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">{product.imagen && <img src={product.imagen} alt={product.nombre} className="mb-3 aspect-square w-full object-cover" />}<h3 className="font-serif text-lg">{product.nombre}</h3><p className="mt-2 text-sm text-[#9b7b3e]">{formatCurrency(product.precio_venta)}</p></article>)}</div></section>
    </div>
  </main>;

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
      case 'usuarios_registrados':
        return <RegisteredUsersView />;
      case 'users':
      case 'roles':
        return <UsuariosRolesView />;
      case 'activity_log':
        return <ActivityLogView />;
      case 'database':
        return <DatabaseView />;
      case 'sheets_config':
        return <GoogleSheetsConfigPanel />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <GoogleSheetsModal />
      <NotificationConfigModal />
      <PushNotificationToast />
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
