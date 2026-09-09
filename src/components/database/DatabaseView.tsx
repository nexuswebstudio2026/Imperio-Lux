import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import {
  Database,
  Cloud,
  Server,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Copy,
  Check,
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
  Clock,
  Layers,
  Activity,
  Bell,
  Sparkles,
  Eye,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface CollectionMeta {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  data: any[];
}

export const DatabaseView: React.FC = () => {
  const {
    firebaseStatus,
    firebaseMessage,
    firebaseProjectId,
    firebaseDatabaseId,
    syncNowWithFirebase,
    seedFirebaseDatabase,
    setShowFirebaseModal,
    productos,
    categorias,
    presentaciones,
    marcas,
    clientes,
    proveedores,
    ventas,
    compras,
    cajas,
    movimientosCaja,
    inventarioAjustes,
    kardex,
    empleados,
    empresa,
    users,
    roles,
    monedas,
    documentos,
    comprobantes,
    activityLogs,
    notificaciones,
    currentMoneda,
  } = useApp();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('productos');
  const [collectionSearch, setCollectionSearch] = useState<string>('');
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [inspectDoc, setInspectDoc] = useState<any | null>(null);
  const [inspectDocCopied, setInspectDocCopied] = useState<boolean>(false);

  // All 21 collections mapped with live state
  const collections: CollectionMeta[] = useMemo(() => [
    {
      id: 'productos',
      name: 'productos',
      label: 'Productos y Artículos',
      description: 'Catálogo general de joyas, relojes y accesorios con stocks, costos y precios.',
      icon: ShoppingBag,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      data: productos,
    },
    {
      id: 'categorias',
      name: 'categorias',
      label: 'Categorías',
      description: 'Clasificación de productos (Anillos, Collares, Relojes de Lujo, etc.).',
      icon: Tag,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      data: categorias,
    },
    {
      id: 'marcas',
      name: 'marcas',
      label: 'Marcas Comerciales',
      description: 'Firmas y diseñadores asociados al catálogo.',
      icon: Megaphone,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      data: marcas,
    },
    {
      id: 'presentaciones',
      name: 'presentaciones',
      label: 'Presentaciones / Unidades',
      description: 'Unidades de empaque y medida (Unidad, Par, Caja de Lujo, Estuche).',
      icon: Package,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      data: presentaciones,
    },
    {
      id: 'ventas',
      name: 'ventas',
      label: 'Ventas y Comprobantes',
      description: 'Transacciones comerciales efectuadas en caja y POS.',
      icon: ShoppingCart,
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
      data: ventas,
    },
    {
      id: 'compras',
      name: 'compras',
      label: 'Compras a Proveedores',
      description: 'Adquisiciones de mercadería y entradas de stock.',
      icon: Store,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      data: compras,
    },
    {
      id: 'cajas',
      name: 'cajas',
      label: 'Sesiones de Caja',
      description: 'Aperturas, turnos y arqueos de caja diaria.',
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      data: cajas,
    },
    {
      id: 'movimientos_caja',
      name: 'movimientos_caja',
      label: 'Movimientos de Caja',
      description: 'Ingresos y egresos detallados de efectivo.',
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      data: movimientosCaja,
    },
    {
      id: 'clientes',
      name: 'clientes',
      label: 'Clientes Registrados',
      description: 'Directorio de compradores con documento, teléfono y dirección.',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      data: clientes,
    },
    {
      id: 'proveedores',
      name: 'proveedores',
      label: 'Proveedores Comerciales',
      description: 'Empresas distribuidoras de insumos y mercadería.',
      icon: Truck,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      data: proveedores,
    },
    {
      id: 'empleados',
      name: 'empleados',
      label: 'Personal y Empleados',
      description: 'Ficha de colaboradores, cargos y salarios.',
      icon: UserCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      data: empleados,
    },
    {
      id: 'inventario_ajustes',
      name: 'inventario_ajustes',
      label: 'Ajustes de Inventario',
      description: 'Correcciones de stock por mermas, auditorías o sobrantes.',
      icon: Layers,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      data: inventarioAjustes,
    },
    {
      id: 'kardex',
      name: 'kardex',
      label: 'Kardex Valorizado',
      description: 'Bitácora cronológica y valorizada de entradas y salidas.',
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      data: kardex,
    },
    {
      id: 'empresas',
      name: 'empresas',
      label: 'Empresa (Imperio Lux)',
      description: 'Parámetros fiscales, RUC, dirección, logo y razón social.',
      icon: Building2,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      data: [empresa],
    },
    {
      id: 'users',
      name: 'users',
      label: 'Usuarios del Sistema',
      description: 'Cuentas de acceso y credenciales de personal.',
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      data: users,
    },
    {
      id: 'roles',
      name: 'roles',
      label: 'Roles y Permisos',
      description: 'Niveles de acceso (Administrador, Cajero, Vendedor, Supervisor).',
      icon: ShieldCheck,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
      data: roles,
    },
    {
      id: 'monedas',
      name: 'monedas',
      label: 'Monedas y Divisas',
      description: 'Configuración monetaria (Soles PEN, Dólares USD, Euros EUR).',
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      data: monedas,
    },
    {
      id: 'documentos',
      name: 'documentos',
      label: 'Tipos de Documento',
      description: 'Documentos de identidad oficiales (DNI, RUC, Pasaporte, Carnet).',
      icon: FileText,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      data: documentos,
    },
    {
      id: 'comprobantes',
      name: 'comprobantes',
      label: 'Tipos de Comprobante',
      description: 'Comprobantes de pago (Boleta de Venta, Factura Electrónica, Ticket).',
      icon: FileText,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      data: comprobantes,
    },
    {
      id: 'activity_logs',
      name: 'activity_logs',
      label: 'Logs de Auditoría',
      description: 'Historial inmutable de operaciones y acciones de usuarios.',
      icon: Clock,
      color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
      data: activityLogs,
    },
    {
      id: 'notificaciones',
      name: 'notificaciones',
      label: 'Alertas y Notificaciones',
      description: 'Avisos del sistema, alertas de bajo stock y cierres.',
      icon: Bell,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      data: notificaciones,
    },
  ], [
    productos,
    categorias,
    marcas,
    presentaciones,
    ventas,
    compras,
    cajas,
    movimientosCaja,
    clientes,
    proveedores,
    empleados,
    inventarioAjustes,
    kardex,
    empresa,
    users,
    roles,
    monedas,
    documentos,
    comprobantes,
    activityLogs,
    notificaciones,
  ]);

  const totalDocuments = useMemo(() => {
    return collections.reduce((acc, curr) => acc + curr.data.length, 0);
  }, [collections]);

  // Selected collection data
  const currentCollection = useMemo(() => {
    return collections.find((c) => c.id === selectedCollectionId) || collections[0];
  }, [collections, selectedCollectionId]);

  // Filter collections in sidebar
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    const q = collectionSearch.toLowerCase();
    return collections.filter(
      (c) => c.name.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
    );
  }, [collections, collectionSearch]);

  // Filter records within the active collection
  const filteredRecords = useMemo(() => {
    const data = currentCollection.data;
    if (!recordSearch.trim()) return data;
    const q = recordSearch.toLowerCase();
    return data.filter((item) => {
      return Object.values(item).some((val) => {
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (typeof val === 'number') return val.toString().includes(q);
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [currentCollection, recordSearch]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncNowWithFirebase();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeed = async () => {
    if (confirm('¿Deseas resincronizar y sembrar los datos base en Firestore?')) {
      setIsSeeding(true);
      try {
        await seedFirebaseDatabase();
      } finally {
        setIsSeeding(false);
      }
    }
  };

  const handleExportFullJSON = () => {
    const fullBackup: Record<string, any> = {
      _metadata: {
        exportedAt: new Date().toISOString(),
        projectId: firebaseProjectId,
        databaseId: firebaseDatabaseId,
        totalCollections: collections.length,
        totalDocuments,
      },
    };
    collections.forEach((c) => {
      fullBackup[c.name] = c.data;
    });

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imperio-lux-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCollectionJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentCollection.data, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleCopyInspectDoc = () => {
    if (!inspectDoc) return;
    navigator.clipboard.writeText(JSON.stringify(inspectDoc, null, 2));
    setInspectDocCopied(true);
    setTimeout(() => setInspectDocCopied(false), 2000);
  };

  // Determine top columns to show for current collection
  const tableColumns = useMemo(() => {
    if (filteredRecords.length === 0) return [];
    const sample = filteredRecords[0];
    const keys = Object.keys(sample);
    // Prioritize id, name, description, amount, date
    const priority = ['id', 'nombre', 'codigo', 'descripcion', 'precio_venta', 'total', 'monto', 'cantidad', 'estado', 'fecha_hora', 'email', 'telefono'];
    const sorted = [...keys].sort((a, b) => {
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
    return sorted.slice(0, 7); // Show up to 7 main columns cleanly
  }, [filteredRecords]);

  return (
    <div className="space-y-5">
      <Breadcrumb
        title="Base de Datos Firestore"
        items={[{ label: 'Base de Datos' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-sync-database"
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Firestore'}</span>
            </button>

            <button
              id="btn-export-database"
              onClick={handleExportFullJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar Backup JSON</span>
            </button>

            <button
              id="btn-open-firebase-config"
              onClick={() => setShowFirebaseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Configuración Cloud</span>
            </button>
          </div>
        }
      />

      {/* Main Database Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Database className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Firebase Firestore Database
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectada y En Línea
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Imperio Lux
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Proyecto Cloud:{' '}
                <code className="text-amber-300 font-mono font-medium">
                  {firebaseProjectId}
                </code>{' '}
                | Base de datos:{' '}
                <code className="text-emerald-300 font-mono font-medium">
                  {firebaseDatabaseId}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Tablas / Colecciones
              </span>
              <span className="text-lg font-black text-amber-400">{collections.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Total Registros
              </span>
              <span className="text-lg font-black text-emerald-400">{totalDocuments}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Reglas de Seguridad
              </span>
              <span className="text-sm font-black text-blue-400">Activas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Split Explorer: Collections List (Left) + Table Data (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Collections Directory (Col 1 to 4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Colecciones ({filteredCollections.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {totalDocuments} docs
            </span>
          </div>

          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Filtrar tablas..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredCollections.map((col) => {
              const Icon = col.icon;
              const isSelected = col.id === selectedCollectionId;
              return (
                <button
                  key={col.id}
                  id={`btn-col-${col.id}`}
                  onClick={() => {
                    setSelectedCollectionId(col.id);
                    setRecordSearch('');
                  }}
                  className={`w-full flex items-center justify-between p-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-l-4 border-amber-500 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-md border ${col.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-700 font-bold' : ''}`}>
                        {col.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        /{col.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {col.data.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Data View (Col 5 to 12) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header of Table View */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  collection('{currentCollection.name}')
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {filteredRecords.length} de {currentCollection.data.length} registros
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentCollection.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCollectionJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
                title="Copiar registros como JSON"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Record Search Filter */}
          <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                placeholder={`Buscar en tabla '${currentCollection.name}' por ID, nombre, valores...`}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
            {recordSearch && (
              <button
                onClick={() => setRecordSearch('')}
                className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto max-h-[500px]">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No se encontraron registros en esta tabla.</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda o añade registros.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 pl-4 w-12 text-center">#</th>
                    {tableColumns.map((colKey) => (
                      <th key={colKey} className="p-2.5 capitalize tracking-wide font-semibold">
                        {colKey.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="p-2.5 pr-4 text-right w-20">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((item, idx) => {
                    const docId = item.id || `doc-${idx + 1}`;
                    return (
                      <tr
                        key={docId}
                        className="hover:bg-amber-500/5 transition-colors group"
                      >
                        <td className="p-2.5 pl-4 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        {tableColumns.map((colKey) => {
                          const val = item[colKey];
                          let displayVal = '-';
                          if (val !== undefined && val !== null) {
                            if (typeof val === 'boolean') {
                              displayVal = val ? 'Sí' : 'No';
                            } else if (typeof val === 'object') {
                              displayVal = Array.isArray(val)
                                ? `[${val.length} items]`
                                : '{...}';
                            } else if (
                              typeof val === 'number' &&
                              (colKey.includes('precio') || colKey.includes('total') || colKey.includes('monto') || colKey.includes('costo'))
                            ) {
                              displayVal = `${currentMoneda.simbolo} ${val.toFixed(2)}`;
                            } else {
                              displayVal = String(val);
                            }
                          }

                          // Highlight badges for states
                          if (colKey === 'estado') {
                            const isOk = val === 'Completada' || val === 'Activo' || val === 'Abierta';
                            return (
                              <td key={colKey} className="p-2.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    isOk
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {displayVal}
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={colKey}
                              className="p-2.5 truncate max-w-[180px] font-normal text-slate-700"
                              title={String(val)}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                        <td className="p-2.5 pr-4 text-right">
                          <button
                            onClick={() => setInspectDoc(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-colors text-[11px] font-medium cursor-pointer"
                            title="Inspeccionar documento JSON completo"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Sincronización en tiempo real activa en Firestore:{' '}
              <strong className="text-slate-700">{currentCollection.data.length}</strong> documentos almacenados
            </span>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline disabled:opacity-50"
            >
              {isSeeding ? 'Restableciendo...' : 'Restablecer colección de muestra'}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Document Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-850 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-slate-100">
                  Documento:{' '}
                  <span className="text-amber-300 font-mono text-xs">
                    {currentCollection.name}/{inspectDoc.id || 'record'}
                  </span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInspectDoc}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors cursor-pointer"
                >
                  {inspectDocCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setInspectDoc(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto font-mono text-xs text-amber-100 bg-slate-950/90 leading-relaxed">
              <pre className="whitespace-pre-wrap select-all">
                {JSON.stringify(inspectDoc, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Campos totales: {Object.keys(inspectDoc).length}</span>
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
