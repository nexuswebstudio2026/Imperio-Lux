import React, { useState } from 'react';
import { useApp, AppTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Tag,
  Package,
  Megaphone,
  ShoppingBag,
  BookOpen,
  FileText,
  Users,
  Truck,
  Wallet,
  Store,
  ShoppingCart,
  Building2,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
  Database,
  Cloud,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, sidebarOpen, currentUser, firebaseStatus, setShowFirebaseModal } = useApp();

  // Collapsible submenus for Compras and Ventas
  const [comprasOpen, setComprasOpen] = useState(
    activeTab === 'compras' || activeTab === 'compras_create'
  );
  const [ventasOpen, setVentasOpen] = useState(
    activeTab === 'ventas' || activeTab === 'ventas_create'
  );

  const isTabActive = (tab: AppTab) => activeTab === tab;

  return (
    <aside
      className={`bg-slate-950 text-slate-300 w-60 shrink-0 border-r border-slate-800 transition-all duration-200 flex flex-col justify-between select-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden w-0'
      }`}
      style={{ minHeight: 'calc(100vh - 3.5rem)' }}
    >
      <div className="overflow-y-auto py-3 px-2 flex-1 space-y-4 text-xs font-normal">
        {/* INICIO */}
        <div>
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Inicio
          </div>
          <button
            id="nav-panel"
            onClick={() => setActiveTab('panel')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
              isTabActive('panel')
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span>Panel</span>
          </button>
        </div>

        {/* MÓDULOS */}
        <div>
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Módulos
          </div>

          <div className="space-y-0.5">
            {/* Base de Datos Cloud */}
            <button
              id="nav-database"
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('database')
                  ? 'bg-amber-600 text-white font-medium shadow-xs'
                  : 'text-slate-200 hover:bg-slate-900 hover:text-white bg-slate-900/60 border border-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-amber-100">Base de Datos</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                21 tablas
              </span>
            </button>

            {/* Categorías */}
            <button
              id="nav-categorias"
              onClick={() => setActiveTab('categorias')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('categorias')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Categorías</span>
            </button>

            {/* Presentaciones */}
            <button
              id="nav-presentaciones"
              onClick={() => setActiveTab('presentaciones')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('presentaciones')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 text-purple-400" />
              <span>Presentaciones</span>
            </button>

            {/* Marcas */}
            <button
              id="nav-marcas"
              onClick={() => setActiveTab('marcas')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('marcas')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4 text-rose-400" />
              <span>Marcas</span>
            </button>

            {/* Productos */}
            <button
              id="nav-productos"
              onClick={() => setActiveTab('productos')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('productos')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Productos</span>
            </button>

            {/* Inventario */}
            <button
              id="nav-inventario"
              onClick={() => setActiveTab('inventario')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('inventario')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Inventario</span>
            </button>

            {/* Kardex */}
            <button
              id="nav-kardex"
              onClick={() => setActiveTab('kardex')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('kardex')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Kardex</span>
            </button>

            {/* Clientes */}
            <button
              id="nav-clientes"
              onClick={() => setActiveTab('clientes')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('clientes')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Clientes</span>
            </button>

            {/* Proveedores */}
            <button
              id="nav-proveedores"
              onClick={() => setActiveTab('proveedores')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('proveedores')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4 text-orange-400" />
              <span>Proveedores</span>
            </button>

            {/* Cajas */}
            <button
              id="nav-cajas"
              onClick={() => setActiveTab('cajas')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('cajas')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Cajas</span>
            </button>

            {/* Compras Accordion */}
            <div>
              <button
                id="nav-compras-group"
                onClick={() => setComprasOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-violet-400" />
                  <span>Compras</span>
                </div>
                {comprasOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
              {comprasOpen && (
                <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-slate-800 ml-4">
                  <button
                    onClick={() => setActiveTab('compras')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                      isTabActive('compras')
                        ? 'text-blue-400 font-semibold bg-slate-900'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Ver compras</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('compras_create')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                      isTabActive('compras_create')
                        ? 'text-blue-400 font-semibold bg-slate-900'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Realizar compra</span>
                  </button>
                </div>
              )}
            </div>

            {/* Ventas Accordion */}
            <div>
              <button
                id="nav-ventas-group"
                onClick={() => setVentasOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-green-400" />
                  <span>Ventas</span>
                </div>
                {ventasOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
              {ventasOpen && (
                <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-slate-800 ml-4">
                  <button
                    onClick={() => setActiveTab('ventas')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                      isTabActive('ventas')
                        ? 'text-blue-400 font-semibold bg-slate-900'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Ver ventas</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ventas_create')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                      isTabActive('ventas_create')
                        ? 'text-emerald-400 font-semibold bg-slate-900'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Realizar venta (POS)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OTROS */}
        <div>
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Otros
          </div>

          <div className="space-y-0.5">
            <button
              id="nav-empresa"
              onClick={() => setActiveTab('empresa')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('empresa')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Empresa</span>
            </button>

            <button
              id="nav-empleados"
              onClick={() => setActiveTab('empleados')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('empleados')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Empleados</span>
            </button>

            <button
              id="nav-usuarios-roles"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-left ${
                isTabActive('users') || isTabActive('roles')
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <span>Usuarios y Roles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Status Card */}
      <div className="px-3 py-2">
        <div
          onClick={() => setShowFirebaseModal(true)}
          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Database className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px] text-slate-200 group-hover:text-amber-300 transition-colors">
                Firebase Firestore
              </span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                firebaseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Base de datos activa para <strong className="text-slate-300">Imperio Lux</strong>
          </p>
        </div>
      </div>

      {/* Sidenav Footer */}
      <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="block text-slate-500 text-[10px]">Bienvenido:</span>
          <span className="font-semibold text-slate-200">
            {currentUser?.name || 'Administrador'}
          </span>
        </div>
        <span className="px-1.5 py-0.5 bg-blue-900/60 text-blue-300 rounded text-[10px] font-medium uppercase">
          {currentUser?.role || 'Admin'}
        </span>
      </div>
    </aside>
  );
};
