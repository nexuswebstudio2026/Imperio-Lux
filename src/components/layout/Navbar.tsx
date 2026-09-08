import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  User,
  Settings,
  Activity,
  LogOut,
  RotateCcw,
  Check,
  Search,
  ShoppingCart,
  Store,
  Database,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    empresa,
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    theme,
    toggleTheme,
    notificaciones,
    markNotificationsAsRead,
    resetAllDataToDefaults,
    firebaseStatus,
    setShowFirebaseModal,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('productos');
    }
  };

  return (
    <nav className="bg-slate-900 text-slate-100 h-14 flex items-center justify-between px-4 border-b border-slate-800 sticky top-0 z-30 select-none shadow-md">
      {/* Brand & Toggle */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Alternar barra lateral"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div
          onClick={() => setActiveTab('panel')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-white tracking-wide text-sm group-hover:text-blue-400 transition-colors">
              {empresa.nombre || 'SK SAC'}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Punto de Venta
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action POS Button & Firebase Status */}
      <div className="flex items-center gap-2">
        <button
          id="btn-firebase-status"
          onClick={() => setShowFirebaseModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-amber-500/40 hover:border-amber-400 transition-colors cursor-pointer shadow-xs"
          title="Ver estado de base de datos Firebase Firestore"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                firebaseStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                firebaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-[11px] text-amber-300">Firebase</span>
          <span className="text-[10px] text-slate-400 hidden md:inline">| Firestore</span>
        </button>

        <button
          id="nav-btn-nueva-venta"
          onClick={() => setActiveTab('ventas_create')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'ventas_create'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Vender (POS)</span>
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
          <input
            id="nav-search-input"
            type="text"
            placeholder="Buscar productos, clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 lg:w-64 bg-slate-800 text-slate-200 text-xs px-3 py-1.5 pl-8 rounded border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
        </form>

        {/* Toggle Modo Día / Noche */}
        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-400/60 transition-all cursor-pointer shadow-xs group"
          title={theme === 'dark' ? 'Cambiar a Modo Día (Luz)' : 'Cambiar a Modo Noche (Oscuro)'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
              <span className="hidden sm:inline text-amber-300 text-[11px] font-medium">Modo Día</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-300 transition-transform group-hover:-rotate-12" />
              <span className="hidden sm:inline text-slate-300 text-[11px] font-medium">Modo Noche</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markNotificationsAsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Marcar leídas
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Sin notificaciones</div>
                ) : (
                  notificaciones.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 transition-colors ${
                        n.leida ? 'bg-white' : 'bg-blue-50/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`font-semibold ${
                            n.tipo === 'warning'
                              ? 'text-amber-700'
                              : n.tipo === 'info'
                              ? 'text-blue-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {n.titulo}
                        </span>
                        <span className="text-[10px] text-slate-400">{n.fecha}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-snug">{n.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={userRef}>
          <button
            id="btn-user-profile"
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-white">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium hidden sm:inline-block">
              {currentUser ? currentUser.name : 'Usuario'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs divide-y divide-slate-100">
              <div className="px-3 py-2">
                <p className="font-semibold text-slate-900">{currentUser?.name}</p>
                <p className="text-slate-500 text-[11px]">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded uppercase">
                  {currentUser?.role || 'administrador'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    toggleTheme();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>{theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase">
                    {theme === 'dark' ? 'Oscuro' : 'Claro'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('empresa');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Configuración Empresa</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('activity_log');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registro de actividades</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Deseas restaurar los datos de fábrica del sistema?')) {
                      resetAllDataToDefaults();
                    }
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-700 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Restablecer datos demo</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
