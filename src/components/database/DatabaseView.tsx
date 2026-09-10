import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { ConfirmDestructiveModal } from '../common/ConfirmDestructiveModal';
import { getSpreadsheetUrl } from '../../lib/sheets';
import {
  Database,
  Cloud,
  Server,
  RefreshCw,
  Search,
  Download,
  Upload,
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
  FileSpreadsheet,
  Info,
  LayoutGrid,
  Table,
  ChevronDown,
} from 'lucide-react';

export type TableCategory =
  | 'todos'
  | 'catalogo'
  | 'ventas_clientes'
  | 'compras_proveedores'
  | 'caja_finanzas'
  | 'inventario'
  | 'empresa_personal'
  | 'sistema';

export const CATEGORY_LABELS: Record<TableCategory, string> = {
  todos: 'Todas las Tablas (21)',
  catalogo: 'Catálogo (4)',
  ventas_clientes: 'Ventas & Clientes (4)',
  compras_proveedores: 'Compras & Proveedores (2)',
  caja_finanzas: 'Caja & Finanzas (3)',
  inventario: 'Inventario & Kardex (2)',
  empresa_personal: 'Empresa & Empleados (2)',
  sistema: 'Sistema & Auditoría (4)',
};

interface CollectionMeta {
  id: string;
  name: string;
  label: string;
  description: string;
  category: TableCategory;
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
    uploadCurrentDataToFirebase,
    downloadDataFromFirebase,
    syncBidirectionalAll,
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
    addCliente,
    activeDatabaseEngine,
    setActiveDatabaseEngine,
    googleUser,
    googleAccessToken,
    googleSheetsId,
    googleSheetsStatus,
    googleSheetsMessage,
    signInWithGoogleSheets,
    signOutGoogleSheets,
    uploadAllToGoogleSheets,
    uploadSingleTableToGoogleSheets,
    downloadAllFromGoogleSheets,
    syncBidirectionalGoogleSheets,
    downloadGoogleSheetsExcel,
    exportAllToExcel,
    exportTableToExcel,
    setShowGoogleSheetsModal,
  } = useApp();

  const [activeViewMode, setActiveViewMode] = useState<'all_tables' | 'explorer' | 'sheets_sync'>('all_tables');
  const [selectedCategory, setSelectedCategory] = useState<TableCategory>('todos');
  const [showAllTables, setShowAllTables] = useState<boolean>(true);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<boolean>(false);
  const [uploadProgressPct, setUploadProgressPct] = useState<number>(0);
  const [tableSearch, setTableSearch] = useState<string>('');

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('productos');
  const [collectionSearch, setCollectionSearch] = useState<string>('');
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isSheetsSyncing, setIsSheetsSyncing] = useState<boolean>(false);
  const [isSheetsPushing, setIsSheetsPushing] = useState<boolean>(false);
  const [isSheetsPulling, setIsSheetsPulling] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [sheetsStatusMsg, setSheetsStatusMsg] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [inspectDoc, setInspectDoc] = useState<any | null>(null);
  const [inspectDocCopied, setInspectDocCopied] = useState<boolean>(false);
  const [showConfirmSheetsUpload, setShowConfirmSheetsUpload] = useState<boolean>(false);

  // All known collection schemas in the system with their assigned functional categories
  const allCollectionSchemas: CollectionMeta[] = useMemo(() => [
    {
      id: 'productos',
      name: 'productos',
      label: 'Productos y Artículos',
      description: 'Catálogo general de joyas, relojes y accesorios con stocks, costos y precios.',
      category: 'catalogo',
      icon: ShoppingBag,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      data: productos,
    },
    {
      id: 'categorias',
      name: 'categorias',
      label: 'Categorías',
      description: 'Clasificación de productos (Anillos, Collares, Relojes de Lujo, etc.).',
      category: 'catalogo',
      icon: Tag,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      data: categorias,
    },
    {
      id: 'marcas',
      name: 'marcas',
      label: 'Marcas Comerciales',
      description: 'Firmas y diseñadores asociados al catálogo.',
      category: 'catalogo',
      icon: Megaphone,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      data: marcas,
    },
    {
      id: 'presentaciones',
      name: 'presentaciones',
      label: 'Presentaciones / Unidades',
      description: 'Unidades de empaque y medida (Unidad, Par, Caja de Lujo, Estuche).',
      category: 'catalogo',
      icon: Package,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      data: presentaciones,
    },
    {
      id: 'ventas',
      name: 'ventas',
      label: 'Ventas y Comprobantes',
      description: 'Transacciones comerciales efectuadas en caja y POS.',
      category: 'ventas_clientes',
      icon: ShoppingCart,
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
      data: ventas,
    },
    {
      id: 'compras',
      name: 'compras',
      label: 'Compras a Proveedores',
      description: 'Adquisiciones de mercadería y entradas de stock.',
      category: 'compras_proveedores',
      icon: Store,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      data: compras,
    },
    {
      id: 'cajas',
      name: 'cajas',
      label: 'Sesiones de Caja',
      description: 'Aperturas, turnos y arqueos de caja diaria.',
      category: 'caja_finanzas',
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      data: cajas,
    },
    {
      id: 'movimientos_caja',
      name: 'movimientos_caja',
      label: 'Movimientos de Caja',
      description: 'Ingresos y egresos detallados de efectivo.',
      category: 'caja_finanzas',
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      data: movimientosCaja,
    },
    {
      id: 'clientes',
      name: 'clientes',
      label: 'Clientes Registrados',
      description: 'Directorio de compradores con documento, teléfono y dirección.',
      category: 'ventas_clientes',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      data: clientes,
    },
    {
      id: 'proveedores',
      name: 'proveedores',
      label: 'Proveedores Comerciales',
      description: 'Empresas distribuidoras de insumos y mercadería.',
      category: 'compras_proveedores',
      icon: Truck,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      data: proveedores,
    },
    {
      id: 'empleados',
      name: 'empleados',
      label: 'Personal y Empleados',
      description: 'Ficha de colaboradores, cargos y salarios.',
      category: 'empresa_personal',
      icon: UserCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      data: empleados,
    },
    {
      id: 'inventario_ajustes',
      name: 'inventario_ajustes',
      label: 'Ajustes de Inventario',
      description: 'Correcciones de stock por mermas, auditorías o sobrantes.',
      category: 'inventario',
      icon: Layers,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      data: inventarioAjustes,
    },
    {
      id: 'kardex',
      name: 'kardex',
      label: 'Kardex Valorizado',
      description: 'Bitácora cronológica y valorizada de entradas y salidas.',
      category: 'inventario',
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      data: kardex,
    },
    {
      id: 'empresas',
      name: 'empresas',
      label: 'Empresa (Imperio Lux)',
      description: 'Parámetros fiscales, RUC, dirección, logo y razón social.',
      category: 'empresa_personal',
      icon: Building2,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      data: [empresa],
    },
    {
      id: 'users',
      name: 'users',
      label: 'Usuarios del Sistema',
      description: 'Cuentas de acceso y credenciales de personal.',
      category: 'sistema',
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      data: users,
    },
    {
      id: 'roles',
      name: 'roles',
      label: 'Roles y Permisos',
      description: 'Niveles de acceso (Administrador, Cajero, Vendedor, Supervisor).',
      category: 'sistema',
      icon: ShieldCheck,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
      data: roles,
    },
    {
      id: 'monedas',
      name: 'monedas',
      label: 'Monedas y Divisas',
      description: 'Configuración monetaria (Soles PEN, Dólares USD, Euros EUR).',
      category: 'caja_finanzas',
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      data: monedas,
    },
    {
      id: 'documentos',
      name: 'documentos',
      label: 'Tipos de Documento',
      description: 'Documentos de identidad oficiales (DNI, RUC, Pasaporte, Carnet).',
      category: 'ventas_clientes',
      icon: FileText,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      data: documentos,
    },
    {
      id: 'comprobantes',
      name: 'comprobantes',
      label: 'Tipos de Comprobante',
      description: 'Comprobantes de pago (Boleta de Venta, Factura Electrónica, Ticket).',
      category: 'ventas_clientes',
      icon: FileText,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      data: comprobantes,
    },
    {
      id: 'activity_logs',
      name: 'activity_logs',
      label: 'Logs de Auditoría',
      description: 'Historial inmutable de operaciones y acciones de usuarios.',
      category: 'sistema',
      icon: Clock,
      color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
      data: activityLogs,
    },
    {
      id: 'notificaciones',
      name: 'notificaciones',
      label: 'Alertas y Notificaciones',
      description: 'Avisos del sistema, alertas de bajo stock y cierres.',
      category: 'sistema',
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

  // Tablas de la base de datos de la página web:
  // Permite mostrar las 21 tablas completas o filtrar por registros y categoría
  const collections: CollectionMeta[] = useMemo(() => {
    let list = allCollectionSchemas;
    if (!showAllTables) {
      list = list.filter((col) => col.data && col.data.length > 0);
    }
    if (selectedCategory !== 'todos') {
      list = list.filter((col) => col.category === selectedCategory);
    }
    return list;
  }, [allCollectionSchemas, showAllTables, selectedCategory]);

  const totalDocuments = useMemo(() => {
    return allCollectionSchemas.reduce((acc, curr) => acc + (curr.data?.length || 0), 0);
  }, [allCollectionSchemas]);

  // Selected collection data (safely falls back to schema if collections is empty)
  const currentCollection = useMemo(() => {
    if (!collections || collections.length === 0) {
      return allCollectionSchemas.find((c) => c.id === selectedCollectionId) || allCollectionSchemas[0];
    }
    return collections.find((c) => c.id === selectedCollectionId) || collections[0];
  }, [collections, selectedCollectionId, allCollectionSchemas]);

  // Filter collections in sidebar
  const filteredCollections = useMemo(() => {
    const list = collections.length > 0 ? collections : allCollectionSchemas;
    if (!collectionSearch.trim()) return list;
    const q = collectionSearch.toLowerCase();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
    );
  }, [collections, allCollectionSchemas, collectionSearch]);

  // Filter records within the active collection
  const filteredRecords = useMemo(() => {
    if (!currentCollection || !currentCollection.data) return [];
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

  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const [sheetsToast, setSheetsToast] = useState(false);

  const handleSheetsSyncBidirectional = async () => {
    if (!googleAccessToken && !googleUser) {
      try {
        setSheetsStatusMsg('Solicitando inicio de sesión con Google...');
        const authRes = await signInWithGoogleSheets();
        if (!authRes?.accessToken) {
          setSheetsStatusMsg('Se requiere iniciar sesión con Google para sincronizar con la hoja de cálculo.');
          setSheetsToast(true);
          return;
        }
      } catch (e: any) {
        setSheetsStatusMsg(`No se pudo conectar con Google: ${e?.message || 'Cancelado'}`);
        setSheetsToast(true);
        return;
      }
    }

    setIsSheetsSyncing(true);
    setSheetsStatusMsg('Iniciando sincronización bidireccional con Google Sheets...');
    try {
      const res = await syncBidirectionalGoogleSheets((msg) => setSheetsStatusMsg(msg));
      setSheetsStatusMsg(`Sincronización completa: ${res.message}`);
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 6000);
    } catch (err: any) {
      setSheetsStatusMsg(`Error de sincronización con Google Sheets: ${err?.message || 'Error desconocido'}`);
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 6000);
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  const handleSheetsPushData = async () => {
    setShowConfirmSheetsUpload(false);
    if (!googleAccessToken && !googleUser) {
      try {
        setSheetsStatusMsg('Solicitando inicio de sesión con Google...');
        const authRes = await signInWithGoogleSheets();
        if (!authRes?.accessToken) {
          setSheetsStatusMsg('Se requiere iniciar sesión con Google para escribir en la hoja de cálculo.');
          setSheetsToast(true);
          return;
        }
      } catch (e: any) {
        setSheetsStatusMsg(`Error al autenticar con Google: ${e?.message || 'Cancelado'}`);
        setSheetsToast(true);
        return;
      }
    }

    setIsSheetsPushing(true);
    setUploadProgressPct(5);
    setSheetsStatusMsg(`Generando las 21 tablas en Google Sheets (ID: ${googleSheetsId})...`);
    try {
      const res = await uploadAllToGoogleSheets((msg, pct) => {
        setSheetsStatusMsg(msg);
        if (pct !== undefined) setUploadProgressPct(pct);
      });
      setSheetsStatusMsg(`¡Éxito! ${res.message}. Se crearon/actualizaron las 21 pestañas en Google Sheets.`);
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 8000);
    } catch (err: any) {
      setSheetsStatusMsg(`Error al subir a Google Sheets: ${err?.message || 'Error desconocido'}`);
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 8000);
    } finally {
      setIsSheetsPushing(false);
      setUploadProgressPct(0);
    }
  };

  const handleDownloadSheetsExcel = () => {
    setIsSheetsPulling(true);
    setSheetsStatusMsg('Generando descarga del archivo Excel (.xlsx) desde Google Sheets...');
    try {
      downloadGoogleSheetsExcel();
      setSheetsStatusMsg('¡Descarga iniciada! Archivo Excel (.xlsx) generado desde Google Sheets.');
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 6000);
    } catch (err: any) {
      console.warn('Fallback a exportación de Excel', err);
      exportAllToExcel();
      setSheetsStatusMsg('Descargando archivo Excel (.xlsx) con las 21 tablas de la base de datos.');
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 6000);
    } finally {
      setIsSheetsPulling(false);
    }
  };

  const handleSheetsPullData = async () => {
    setIsSheetsPulling(true);
    setSheetsStatusMsg('Descargando datos desde Google Sheets...');
    try {
      const res = await downloadAllFromGoogleSheets((msg) => setSheetsStatusMsg(msg));
      setSheetsStatusMsg(res.message);
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 6000);
    } catch (err: any) {
      setSheetsStatusMsg(`Error al descargar: ${err?.message || 'Error desconocido'}`);
      setSheetsToast(true);
      setTimeout(() => setSheetsToast(false), 6000);
    } finally {
      setIsSheetsPulling(false);
    }
  };

  const handleUploadSingleTable = async (tableName: string, data: any[]) => {
    if (!googleAccessToken && !googleUser) {
      try {
        const authRes = await signInWithGoogleSheets();
        if (!authRes?.accessToken) {
          setSheetsStatusMsg('Se requiere iniciar sesión con Google.');
          setSheetsToast(true);
          return;
        }
      } catch (e: any) {
        setSheetsStatusMsg('Operación cancelada.');
        setSheetsToast(true);
        return;
      }
    }

    setSheetsStatusMsg(`Subiendo tabla "${tableName}" a Google Sheets...`);
    setSheetsToast(true);
    try {
      const res = await uploadSingleTableToGoogleSheets(tableName, data);
      setSheetsStatusMsg(res.message);
      setTimeout(() => setSheetsToast(false), 5000);
    } catch (err: any) {
      setSheetsStatusMsg(`Error al subir tabla: ${err?.message || 'Error desconocido'}`);
      setTimeout(() => setSheetsToast(false), 5000);
    }
  };

  const handleSyncBidirectional = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Iniciando sincronización bidireccional...');
    try {
      const res = await syncBidirectionalAll((msg) => setSyncStatusMsg(msg));
      setSyncStatusMsg(res.message);
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushData = async () => {
    setIsPushing(true);
    setSyncStatusMsg('Subiendo catálogo local a Firestore...');
    try {
      const res = await uploadCurrentDataToFirebase((msg) => setSyncStatusMsg(msg));
      setSyncStatusMsg(res.message);
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 5000);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullData = async () => {
    setIsPulling(true);
    setSyncStatusMsg('Descargando catálogo desde Firestore...');
    try {
      const res = await downloadDataFromFirebase();
      setSyncStatusMsg(res.message);
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 5000);
    } finally {
      setIsPulling(false);
    }
  };

  const handleSync = async () => {
    handleSyncBidirectional();
  };

  const handleSeed = async () => {
    if (confirm('¿Deseas resincronizar y sembrar los datos base en Firestore?')) {
      handlePushData();
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
      {/* Primary Google Sheets Control Center Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/60 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Base de Datos en Google Sheets
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeDatabaseEngine === 'sheets' ? 'Motor Principal Activo' : 'Disponible'}
                </span>
                {googleAccessToken ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    Cuenta Google Conectada
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Requiere Iniciar Sesión Google
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-2 flex-wrap">
                <span>Spreadsheet ID:</span>
                <code className="text-emerald-300 font-mono font-bold bg-black/40 px-2 py-0.5 rounded text-xs border border-emerald-800">
                  {googleSheetsId}
                </code>
                <a
                  href={getSpreadsheetUrl(googleSheetsId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-200 font-semibold underline decoration-emerald-500/50"
                >
                  <span>Abrir en Google Sheets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {!googleUser ? (
              <GoogleSignInButton onClick={signInWithGoogleSheets} />
            ) : (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                {googleUser.photoURL && (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google user'}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-slate-200 font-medium truncate max-w-[140px]">
                  {googleUser.displayName || googleUser.email}
                </span>
                <button
                  type="button"
                  onClick={signOutGoogleSheets}
                  className="text-[11px] text-rose-400 hover:underline ml-1 cursor-pointer"
                >
                  Salir
                </button>
              </div>
            )}

            <button
              onClick={() => setShowGoogleSheetsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Gestor y Pestañas</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar for Google Sheets */}
        <div className="mt-5 pt-4 border-t border-emerald-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Sincronizar con Google Sheets */}
            <button
              id="btn-sheets-sync"
              onClick={handleSheetsSyncBidirectional}
              disabled={isSheetsSyncing || isSheetsPushing || isSheetsPulling}
              title="Sincroniza bidireccionalmente los cambios locales con la hoja de Google Sheets"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSheetsSyncing ? 'animate-spin' : ''}`} />
              <span>{isSheetsSyncing ? 'Sincronizando con Sheets...' : 'Sincronizar con Google Sheets'}</span>
            </button>

            {/* 2. Subir Todo a Google Sheets */}
            <button
              id="btn-sheets-push"
              onClick={() => setShowConfirmSheetsUpload(true)}
              disabled={isSheetsSyncing || isSheetsPushing || isSheetsPulling}
              title="A partir del ID de Google Sheets, genera o actualiza todas las 21 tablas de la base de datos en cada hoja"
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg font-bold shadow-md shadow-amber-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className={`w-4 h-4 ${isSheetsPushing ? 'animate-bounce' : ''}`} />
              <span>{isSheetsPushing ? 'Subiendo a Sheets...' : 'Subir Todo a Google Sheets'}</span>
            </button>

            {/* 3. Descargar desde Google Sheets en Excel */}
            <div className="relative inline-flex rounded-lg shadow-md shadow-blue-950/30">
              <button
                id="btn-sheets-download-excel"
                onClick={handleDownloadSheetsExcel}
                disabled={isSheetsSyncing || isSheetsPushing || isSheetsPulling}
                title="Descarga la hoja de cálculo completa en formato Excel (.xlsx)"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-l-lg font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className={`w-4 h-4 ${isSheetsPulling ? 'animate-bounce' : ''}`} />
                <span>{isSheetsPulling ? 'Descargando...' : 'Descargar Sheets en Excel'}</span>
                <span className="text-[10px] bg-blue-800/80 px-1.5 py-0.5 rounded font-mono font-bold">.xlsx</span>
              </button>
              <button
                id="btn-sheets-download-menu"
                type="button"
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="px-2 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-r-lg border-l border-blue-500 cursor-pointer transition-colors"
                title="Opciones adicionales de descarga"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {downloadMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-1 text-xs"
                  onClick={() => setDownloadMenuOpen(false)}
                >
                  <button
                    onClick={handleDownloadSheetsExcel}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Descargar Excel (.xlsx) de Sheets</p>
                      <p className="text-[10px] text-slate-400">Descarga directa desde Google Drive</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportAllToExcel();
                      setSheetsStatusMsg('Descargando archivo Excel completo (21 tablas de la base de datos).');
                      setSheetsToast(true);
                      setTimeout(() => setSheetsToast(false), 5000);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Descargar Libro Excel (21 Hojas)</p>
                      <p className="text-[10px] text-slate-400">Genera libro con todas las tablas del sistema</p>
                    </div>
                  </button>

                  <button
                    onClick={handleSheetsPullData}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800"
                  >
                    <RefreshCw className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Descargar e Importar a la Web</p>
                      <p className="text-[10px] text-slate-400">Trae las filas desde Sheets a la base de datos</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Motor seleccionado:</span>
            <div className="flex items-center bg-black/40 p-1 rounded-lg border border-emerald-900">
              <button
                type="button"
                onClick={() => setActiveDatabaseEngine('sheets')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeDatabaseEngine === 'sheets'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Sheets
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseEngine('firestore')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeDatabaseEngine === 'firestore'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Firebase
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheets Toast Notification */}
      {sheetsToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Operación de Google Sheets
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                {sheetsStatusMsg || 'Operación completada con éxito.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSheetsToast(false)}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold px-2 py-1 rounded cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      <Breadcrumb
        title="Explorador de Colecciones y Tablas"
        items={[{ label: 'Base de Datos' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-sync-bidirectional"
              onClick={handleSyncBidirectional}
              disabled={isSyncing || isPushing || isPulling}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronización Bidireccional'}</span>
            </button>

            <button
              id="btn-push-database"
              onClick={handlePushData}
              disabled={isSyncing || isPushing || isPulling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Cloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'Subiendo...' : 'Subir a Firebase'}</span>
            </button>

            <button
              id="btn-pull-database"
              onClick={handlePullData}
              disabled={isSyncing || isPushing || isPulling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
              <span>{isPulling ? 'Descargando...' : 'Descargar de Firebase'}</span>
            </button>

            <button
              id="btn-open-firebase-config"
              onClick={() => setShowFirebaseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>Vincular BD Firebase</span>
            </button>

            <button
              id="btn-export-database"
              onClick={handleExportFullJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Exportar JSON</span>
            </button>

            <a
              id="btn-open-firebase-console-direct"
              href={`https://console.firebase.google.com/project/${firebaseProjectId}/firestore/databases/${firebaseDatabaseId}/data`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-slate-300 border border-slate-800 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Consola Firebase</span>
            </a>
          </div>
        }
      />

      {/* Sync Status Alert Toast */}
      {syncSuccessToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                ¡Operación completada con Firebase!
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                {syncStatusMsg || `Las ${collections.length} tablas están conectadas y sincronizadas.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSyncSuccessToast(false)}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold px-2 py-1 rounded"
          >
            Cerrar
          </button>
        </div>
      )}

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
                {firebaseStatus === 'connected' ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Conectada y En Línea
                  </span>
                ) : firebaseStatus === 'disconnected' ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Desconectada (BD Eliminada)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Verificando Conexión
                  </span>
                )}
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
                Tablas en Firebase
              </span>
              <span className={`text-lg font-black ${firebaseStatus === 'disconnected' ? 'text-rose-400' : 'text-amber-400'}`}>
                {firebaseStatus === 'disconnected' ? 0 : collections.length}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Total Registros
              </span>
              <span className={`text-lg font-black ${firebaseStatus === 'disconnected' ? 'text-slate-400' : 'text-emerald-400'}`}>
                {firebaseStatus === 'disconnected' ? '0 en la nube' : totalDocuments}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Reglas de Seguridad
              </span>
              <span className={`text-sm font-black ${firebaseStatus === 'disconnected' ? 'text-slate-500' : 'text-blue-400'}`}>
                {firebaseStatus === 'disconnected' ? 'Inactivas' : 'Activas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta explícita si la base de datos fue eliminada en Firebase */}
      {firebaseStatus === 'disconnected' && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 text-slate-800 dark:text-slate-200 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <span>Base de datos eliminada en Firebase: El sitio web está desconectado</span>
                </h3>
                <span className="text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                  HTTP 404 NOT_FOUND
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Has eliminado la base de datos de Firebase (<code className="font-mono font-medium text-rose-800 dark:text-rose-300">{firebaseDatabaseId}</code> en el proyecto <code className="font-mono font-medium text-slate-800 dark:text-slate-200">{firebaseProjectId}</code>).
                Tal como esperas, <strong>el sitio web no está conectado a la base de datos de Firebase</strong> y el recuento de tablas en la nube es <strong>0</strong>.
              </p>
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-lg border border-rose-200 dark:border-rose-900/40 text-slate-600 dark:text-slate-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  El sistema está operando en <strong>modo 100% local</strong>. Para vincular un nuevo proyecto o base de datos y que todas tus tablas y datos aparezcan sincronizados tanto en Firebase como aquí, haz clic en:
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowFirebaseModal(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>Vincular BD Firebase</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => syncNowWithFirebase()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guía rápida para encontrar la base de datos en Firebase Console */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-slate-800 dark:text-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>¿Cómo encontrar esta base de datos en la Consola de Firebase?</span>
              </h3>
              <a
                href={`https://console.firebase.google.com/project/${firebaseProjectId}/firestore/databases/${firebaseDatabaseId}/data`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition-colors shadow-xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Ir directo a la Base de Datos</span>
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>
                Entra a <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">console.firebase.google.com</a> y selecciona tu proyecto <strong className="text-slate-900 dark:text-white font-mono bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">{firebaseProjectId}</strong> (Milenia App Restaurantes).
              </li>
              <li>
                En el menú lateral izquierdo, haz clic en <strong className="text-slate-900 dark:text-white">Compilación (Build)</strong> &rarr; <strong className="text-slate-900 dark:text-white">Firestore Database</strong>.
              </li>
              <li>
                <strong className="text-amber-700 dark:text-amber-400 font-bold">Paso clave:</strong> En la parte superior de la página, junto a "Firestore Database", verás un <strong className="text-slate-900 dark:text-white">menú desplegable</strong> con las bases de datos. Por defecto a veces muestra <em>(default)</em>.
              </li>
              <li>
                Haz clic en ese desplegable y selecciona: <strong className="text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">{firebaseDatabaseId}</strong>. ¡Allí verás inmediatamente las 21 tablas con todos sus documentos!
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Navigation Mode Selector & Categories Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              id="btn-view-all-tables"
              onClick={() => setActiveViewMode('all_tables')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'all_tables'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Todas las Tablas de la Web (21)</span>
            </button>

            <button
              id="btn-view-explorer"
              onClick={() => setActiveViewMode('explorer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'explorer'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Explorador de Registros</span>
            </button>

            <button
              id="btn-view-sheets-manager"
              onClick={() => setActiveViewMode('sheets_sync')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'sheets_sync'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Hojas en Google Sheets (21)</span>
            </button>
          </div>

          {/* Quick Info & Toggle */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAllTables}
                onChange={(e) => setShowAllTables(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-600 rounded"
              />
              <span className="font-medium">Mostrar las 21 tablas completas</span>
            </label>

            <button
              onClick={handleDownloadSheetsExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-200"
              title="Descargar libro Excel con todas las tablas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Todo en Excel</span>
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Categoría:
          </span>
          {[
            { id: 'todos' as TableCategory, label: `Todas (21)` },
            { id: 'catalogo' as TableCategory, label: `Catálogo (4)` },
            { id: 'ventas_clientes' as TableCategory, label: `Ventas & Clientes (4)` },
            { id: 'compras_proveedores' as TableCategory, label: `Compras & Proveedores (2)` },
            { id: 'caja_finanzas' as TableCategory, label: `Caja & Finanzas (3)` },
            { id: 'inventario' as TableCategory, label: `Inventario & Kardex (2)` },
            { id: 'empresa_personal' as TableCategory, label: `Empresa & Personal (2)` },
            { id: 'sistema' as TableCategory, label: `Sistema & Auditoría (4)` },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: All 21 Tables Grid View */}
      {activeViewMode === 'all_tables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>Tablas de la Base de Datos en la Página Web</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {collections.length} de 21 tablas
                </span>
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Buscar tabla o pestaña..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Grid of 21 Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {collections
              .filter((col) => {
                if (!tableSearch.trim()) return true;
                const q = tableSearch.toLowerCase();
                return (
                  col.name.toLowerCase().includes(q) ||
                  col.label.toLowerCase().includes(q) ||
                  col.description.toLowerCase().includes(q)
                );
              })
              .map((col) => {
                const Icon = col.icon;
                const recordCount = col.data?.length || 0;

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2.5 rounded-lg border ${col.color} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {col.label}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold">
                                /{col.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                Hoja en Sheets
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                            recordCount > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {recordCount} {recordCount === 1 ? 'registro' : 'registros'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {col.description}
                      </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => {
                          setSelectedCollectionId(col.id);
                          setActiveViewMode('explorer');
                        }}
                        className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-semibold cursor-pointer py-1 px-2 rounded hover:bg-amber-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Datos</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUploadSingleTable(col.name, col.data || [])}
                          title={`Subir hoja '${col.name}' a Google Sheets`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-200"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Subir a Sheets</span>
                        </button>

                        <button
                          onClick={() => {
                            exportTableToExcel(col.id);
                            setSheetsStatusMsg(`Exportando tabla '${col.label}' en formato Excel.`);
                            setSheetsToast(true);
                            setTimeout(() => setSheetsToast(false), 4000);
                          }}
                          title={`Descargar tabla '${col.label}' en formato Excel (.xlsx)`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW 2: Sheets Status Table (21 Sheets) */}
      {activeViewMode === 'sheets_sync' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Estructura de las 21 Hojas en Google Sheets</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Spreadsheet ID: <code className="font-mono text-emerald-700 font-bold">{googleSheetsId}</code>. Cada tabla de la página web se mapea a una hoja de cálculo individual.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSheetsSyncBidirectional}
                disabled={isSheetsSyncing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSheetsSyncing ? 'animate-spin' : ''}`} />
                <span>Sincronizar Todas</span>
              </button>

              <button
                onClick={() => setShowConfirmSheetsUpload(true)}
                disabled={isSheetsPushing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className={`w-3.5 h-3.5 ${isSheetsPushing ? 'animate-bounce' : ''}`} />
                <span>Subir Todo a Sheets</span>
              </button>

              <button
                onClick={handleDownloadSheetsExcel}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar en Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Nombre de la Pestaña en Sheets</th>
                  <th className="py-2.5 px-4">Tabla en la Web</th>
                  <th className="py-2.5 px-4">Categoría</th>
                  <th className="py-2.5 px-4 text-center">Registros Web</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCollectionSchemas.map((col, idx) => {
                  const Icon = col.icon;
                  const count = col.data?.length || 0;
                  return (
                    <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-400 font-medium">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                        {col.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${col.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="font-semibold text-slate-800">{col.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 capitalize">
                        {col.category?.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                        {count}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Hoja Habilitada
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUploadSingleTable(col.name, col.data || [])}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-200"
                          >
                            Subir Hoja
                          </button>
                          <button
                            onClick={() => exportTableToExcel(col.id)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200"
                          >
                            Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Split Explorer (Left List + Right Table Data) */}
      {activeViewMode === 'explorer' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Collections Directory (Col 1 to 4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {`Tablas en la Web (${filteredCollections.length} de ${allCollectionSchemas.length})`}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {`${totalDocuments} docs`}
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
            {!currentCollection ? (
              <div className="p-8 text-center text-slate-400">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No hay tablas con datos en Firestore.</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No se encontraron registros coincidentes en esta tabla.</p>
                <p className="text-xs mt-1">Intenta con otro término de búsqueda.</p>
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
              disabled={isPushing}
              className="text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline disabled:opacity-50"
            >
              {isPushing ? 'Subiendo datos a Firebase...' : 'Sincronizar y sembrar en Firebase'}
            </button>
          </div>
        </div>
      </div>
      )}

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

      {/* Confirm Destructive Upload to Google Sheets Modal */}
      <ConfirmDestructiveModal
        isOpen={showConfirmSheetsUpload}
        title="¿Subir y generar las 21 tablas en Google Sheets?"
        description={`A partir del ID de Google Sheets (${googleSheetsId}), se crearán o actualizarán automáticamente todas las tablas de la base de datos de la página web en cada una de sus 21 hojas de cálculo correspondientes.`}
        itemCount={totalDocuments}
        itemDescription="registros del sistema"
        affectedItems={allCollectionSchemas.map((c) => `Hoja '${c.name}': ${c.label} (${c.data?.length || 0} registros)`)}
        confirmLabel="Subir y Generar las 21 Hojas en Sheets"
        cancelLabel="Cancelar"
        isProcessing={isSheetsPushing}
        onConfirm={handleSheetsPushData}
        onCancel={() => setShowConfirmSheetsUpload(false)}
      />
    </div>
  );
};
