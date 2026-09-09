import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
  Boxes,
  ShoppingCart,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Settings,
  Key,
  Layers,
  FileText,
  DollarSign,
  Tag,
  Building,
  Activity,
  Bell,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Link2,
} from 'lucide-react';
import {
  testFirestoreConnection,
  testFirestoreConfig,
  parseFirebaseConfigSnippet,
  FirebaseConfigObject,
  ConnectionDiagnostic,
} from '../../lib/firebase';

export const FirebaseModal: React.FC = () => {
  const {
    showFirebaseModal,
    setShowFirebaseModal,
    firebaseStatus,
    firebaseMessage,
    firebaseProjectId,
    firebaseDatabaseId,
    activeFirebaseConfig,
    switchFirebaseProject,
    resetToDefaultFirebase,
    syncNowWithFirebase,
    uploadCurrentDataToFirebase,
    downloadDataFromFirebase,
    syncBidirectionalAll,
    productos,
    ventas,
    compras,
    clientes,
    proveedores,
    empleados,
    cajas,
    movimientosCaja,
    inventarioAjustes,
    categorias,
    marcas,
    presentaciones,
    kardex,
    users,
    roles,
    monedas,
    documentos,
    comprobantes,
    activityLogs,
    notificaciones,
    empresa,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tablas' | 'proyecto' | 'sincronizacion' | 'auditoria'>('proyecto');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionDiagnostic | null>(null);

  // Form for custom project configuration
  const [projectIdInput, setProjectIdInput] = useState(activeFirebaseConfig.projectId);
  const [apiKeyInput, setApiKeyInput] = useState(activeFirebaseConfig.apiKey);
  const [authDomainInput, setAuthDomainInput] = useState(activeFirebaseConfig.authDomain);
  const [databaseIdInput, setDatabaseIdInput] = useState(activeFirebaseConfig.firestoreDatabaseId || '(default)');
  const [appIdInput, setAppIdInput] = useState(activeFirebaseConfig.appId);
  const [storageBucketInput, setStorageBucketInput] = useState(activeFirebaseConfig.storageBucket || '');
  const [rawSnippetInput, setRawSnippetInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Progress state for sync operations
  const [syncProgress, setSyncProgress] = useState<{ running: boolean; message: string; percent: number }>({
    running: false,
    message: '',
    percent: 0,
  });

  if (!showFirebaseModal) return null;

  // Test custom configuration entered in form
  const handleTestCustomConfig = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveStatus(null);
    try {
      const draftConfig: FirebaseConfigObject = {
        projectId: projectIdInput.trim(),
        apiKey: apiKeyInput.trim(),
        authDomain: authDomainInput.trim() || `${projectIdInput.trim()}.firebaseapp.com`,
        firestoreDatabaseId: databaseIdInput.trim() === '(default)' ? '' : databaseIdInput.trim(),
        appId: appIdInput.trim() || '1:123456789:web:abcdef',
        storageBucket: storageBucketInput.trim() || `${projectIdInput.trim()}.firebasestorage.app`,
      };
      const res = await testFirestoreConfig(draftConfig);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        statusCode: 0,
        statusText: 'ERROR',
        message: `Error al probar: ${e?.message || 'Error de conexión'}`,
        databaseId: databaseIdInput,
        projectId: projectIdInput,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Autocomplete by parsing JSON or JS snippet
  const handleApplySnippet = () => {
    const { config, error } = parseFirebaseConfigSnippet(rawSnippetInput);
    if (error) {
      setSaveStatus({ type: 'error', message: error });
      return;
    }

    if (config.projectId) setProjectIdInput(config.projectId);
    if (config.apiKey) setApiKeyInput(config.apiKey);
    if (config.authDomain) setAuthDomainInput(config.authDomain);
    if (config.firestoreDatabaseId) {
      setDatabaseIdInput(config.firestoreDatabaseId || '(default)');
    } else {
      setDatabaseIdInput('(default)');
    }
    if (config.appId) setAppIdInput(config.appId);
    if (config.storageBucket) setStorageBucketInput(config.storageBucket);

    setSaveStatus({
      type: 'info',
      message: '✓ Campos autocompletados desde el fragmento de configuración. Ahora haz clic en "Conectar y Sincronizar".',
    });
  };

  // Connect project and execute auto-sync
  const handleSaveAndSyncProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectIdInput.trim() || !apiKeyInput.trim()) {
      setSaveStatus({ type: 'error', message: 'Project ID y API Key son campos obligatorios.' });
      return;
    }

    setIsSavingProject(true);
    setSaveStatus(null);
    try {
      const newConfig: FirebaseConfigObject = {
        projectId: projectIdInput.trim(),
        apiKey: apiKeyInput.trim(),
        authDomain: authDomainInput.trim() || `${projectIdInput.trim()}.firebaseapp.com`,
        firestoreDatabaseId: databaseIdInput.trim() === '(default)' ? '' : databaseIdInput.trim(),
        appId: appIdInput.trim() || '1:123456789:web:abcdef',
        storageBucket: storageBucketInput.trim() || `${projectIdInput.trim()}.firebasestorage.app`,
      };

      const ok = await switchFirebaseProject(newConfig);
      if (ok) {
        setSyncProgress({ running: true, message: 'Conexión establecida. Iniciando sincronización de datos...', percent: 20 });
        const syncResult = await syncBidirectionalAll((msg, pct) => {
          setSyncProgress({ running: true, message: msg, percent: pct });
        });
        setSyncProgress({ running: false, message: '', percent: 100 });

        setSaveStatus({
          type: 'success',
          message: `¡Proyecto "${newConfig.projectId}" conectado exitosamente! ${syncResult.message}`,
        });
      } else {
        setSaveStatus({
          type: 'error',
          message:
            'No se pudo conectar a la base de datos de Firebase. Verifica si creaste la base de datos Firestore en Firebase Console y si el Database ID es "(default)" o el nombre exacto.',
        });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: `Error inesperado: ${err?.message || err}` });
    } finally {
      setIsSavingProject(false);
      setSyncProgress({ running: false, message: '', percent: 0 });
    }
  };

  // Push local database to Firebase
  const handlePushToFirebase = async () => {
    setSyncProgress({ running: true, message: 'Iniciando subida a Firebase...', percent: 5 });
    const res = await uploadCurrentDataToFirebase((msg, pct) => {
      setSyncProgress({ running: true, message: msg, percent: pct });
    });
    setSyncProgress({ running: false, message: '', percent: 0 });
    if (res.success) {
      setSaveStatus({ type: 'success', message: res.message });
    } else {
      setSaveStatus({ type: 'error', message: res.message });
    }
  };

  // Pull data from Firebase into web
  const handlePullFromFirebase = async () => {
    setSyncProgress({ running: true, message: 'Descargando desde Firebase...', percent: 20 });
    const res = await downloadDataFromFirebase();
    setSyncProgress({ running: false, message: '', percent: 0 });
    if (res.success) {
      setSaveStatus({ type: 'success', message: res.message });
    } else {
      setSaveStatus({ type: 'error', message: res.message });
    }
  };

  const handleResetToDefault = async () => {
    if (confirm('¿Deseas restaurar la configuración original de Firebase?')) {
      await resetToDefaultFirebase();
      setProjectIdInput(activeFirebaseConfig.projectId);
      setApiKeyInput(activeFirebaseConfig.apiKey);
      setAuthDomainInput(activeFirebaseConfig.authDomain);
      setDatabaseIdInput(activeFirebaseConfig.firestoreDatabaseId || '(default)');
      setSaveStatus({ type: 'info', message: 'Se restableció la configuración predeterminada.' });
    }
  };

  const allCollections = [
    { name: 'productos', label: 'Productos y Catálogo', count: productos.length, icon: Boxes, relation: 'Categorías, Marcas, Presentaciones' },
    { name: 'categorias', label: 'Categorías', count: categorias.length, icon: Tag, relation: 'Productos' },
    { name: 'marcas', label: 'Marcas', count: marcas.length, icon: Layers, relation: 'Productos' },
    { name: 'presentaciones', label: 'Presentaciones / Unidades', count: presentaciones.length, icon: Boxes, relation: 'Productos' },
    { name: 'clientes', label: 'Clientes Registrados', count: clientes.length, icon: Users, relation: 'Ventas, Comprobantes' },
    { name: 'proveedores', label: 'Proveedores Comerciales', count: proveedores.length, icon: Building, relation: 'Compras' },
    { name: 'empleados', label: 'Personal y Empleados', count: empleados.length, icon: Users, relation: 'Ventas, Cajas, Usuarios' },
    { name: 'cajas', label: 'Sesiones de Caja', count: cajas.length, icon: Database, relation: 'Movimientos Caja, Ventas' },
    { name: 'movimientos_caja', label: 'Movimientos de Caja', count: movimientosCaja.length, icon: DollarSign, relation: 'Cajas' },
    { name: 'ventas', label: 'Ventas y Facturación', count: ventas.length, icon: ShoppingCart, relation: 'Clientes, Empleados, Cajas' },
    { name: 'compras', label: 'Compras a Proveedores', count: compras.length, icon: FileText, relation: 'Proveedores, Productos' },
    { name: 'inventario_ajustes', label: 'Ajustes de Inventario', count: inventarioAjustes.length, icon: Layers, relation: 'Productos, Kardex' },
    { name: 'kardex', label: 'Kardex Valorizado', count: kardex.length, icon: Clock, relation: 'Productos, Ventas, Compras' },
    { name: 'empresas', label: 'Datos Empresa (Imperio Lux)', count: 1, icon: Building, relation: 'Configuración General' },
    { name: 'users', label: 'Usuarios del Sistema', count: users.length, icon: Users, relation: 'Roles, Empleados' },
    { name: 'roles', label: 'Roles y Permisos', count: roles.length, icon: Key, relation: 'Usuarios' },
    { name: 'monedas', label: 'Monedas y Divisas', count: monedas.length, icon: DollarSign, relation: 'Precios, Pagos' },
    { name: 'documentos', label: 'Tipos de Documento', count: documentos.length, icon: FileText, relation: 'Clientes, Empleados' },
    { name: 'comprobantes', label: 'Tipos de Comprobante', count: comprobantes.length, icon: FileText, relation: 'Ventas, Facturación' },
    { name: 'activity_logs', label: 'Logs de Auditoría', count: activityLogs.length, icon: Activity, relation: 'Eventos del Sistema' },
    { name: 'notificaciones', label: 'Alertas y Notificaciones', count: notificaciones.length, icon: Bell, relation: 'Stock Bajo, Caja' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                Vincular Base de Datos Firebase
                <span className="text-[10px] bg-amber-400/30 text-amber-100 font-semibold px-2 py-0.5 rounded-full border border-amber-300/30 uppercase">
                  Imperio Lux
                </span>
              </h3>
              <p className="text-xs text-amber-100/90">
                Conecta cualquier proyecto Firestore y sincroniza automáticamente todas las tablas
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFirebaseModal(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('proyecto')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'proyecto'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Vincular Proyecto Firebase</span>
          </button>

          <button
            onClick={() => setActiveTab('sincronizacion')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sincronizacion'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronización Bidireccional</span>
          </button>

          <button
            onClick={() => setActiveTab('tablas')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tablas'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>21 Tablas y Relaciones ({allCollections.reduce((acc, c) => acc + c.count, 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'auditoria'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Logs</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 text-slate-700 text-xs overflow-y-auto flex-1">
          {/* Status Alert Banner */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              firebaseStatus === 'connected'
                ? 'bg-emerald-50/70 border-emerald-200'
                : firebaseStatus === 'disconnected'
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {firebaseStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    firebaseStatus === 'connected'
                      ? 'bg-emerald-500'
                      : firebaseStatus === 'disconnected'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-xs">
                  Estado:{' '}
                  {firebaseStatus === 'connected'
                    ? 'Conectado y En Línea'
                    : firebaseStatus === 'disconnected'
                    ? 'Desconectado (Base de datos no encontrada / eliminada)'
                    : firebaseStatus === 'syncing'
                    ? 'Sincronizando con Firebase...'
                    : 'Modo Local'}
                </p>
                <p className="text-[11px] text-slate-500">{firebaseMessage}</p>
              </div>
            </div>
            {firebaseStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nube Activa
              </span>
            ) : firebaseStatus === 'disconnected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded border border-rose-300/60">
                <AlertCircle className="w-3.5 h-3.5" />
                Desconectado
              </span>
            ) : null}
          </div>

          {/* Sync Progress Bar if running */}
          {syncProgress.running && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  {syncProgress.message}
                </span>
                <span>{syncProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-200 rounded-full"
                  style={{ width: `${syncProgress.percent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* TAB 1: VINCULAR PROYECTO */}
          {activeTab === 'proyecto' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200/80 text-amber-950 space-y-2">
                <div className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                  <Link2 className="w-4 h-4 text-amber-600" />
                  <span>¿Cómo vincular cualquier Base de Datos de Firebase?</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] space-y-1 text-slate-700 leading-relaxed pl-1">
                  <li>
                    Ingresa a tu consola de <strong>Firebase</strong> (<span className="text-amber-800 font-mono">console.firebase.google.com</span>).
                  </li>
                  <li>
                    Abre tu proyecto, haz clic en el engranaje ⚙️ <strong>Configuración del proyecto</strong> &gt; sección <strong>Tus apps</strong> &gt; selecciona tu aplicación web.
                  </li>
                  <li>
                    Copia el bloque <span className="font-mono text-amber-900 bg-amber-100 px-1 py-0.5 rounded">firebaseConfig</span> (objeto JavaScript o JSON) y pégalo abajo.
                  </li>
                  <li>
                    Haz clic en <strong>"Conectar y Sincronizar"</strong>. El sistema creará todas las 21 tablas en Firebase con sus relaciones y mostrará los datos en el sitio web de inmediato.
                  </li>
                </ol>
              </div>

              {/* Paste Snippet Option */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Pegar fragmento de Firebase (JavaScript o JSON):
                  </label>
                  <span className="text-[10px] text-slate-500">Detecta automáticamente las variables</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={rawSnippetInput}
                    onChange={(e) => setRawSnippetInput(e.target.value)}
                    placeholder='const firebaseConfig = { apiKey: "AIzaSy...", projectId: "mi-proyecto-123", ... };'
                    className="w-full font-mono text-[11px] border border-slate-300 rounded p-2 bg-white focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplySnippet}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs self-start shrink-0 cursor-pointer"
                  >
                    Autocompletar
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSaveAndSyncProject} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Project ID <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={projectIdInput}
                      onChange={(e) => setProjectIdInput(e.target.value)}
                      placeholder="mi-proyecto-firebase"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      API Key <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Firestore Database ID:</label>
                    <input
                      type="text"
                      value={databaseIdInput}
                      onChange={(e) => setDatabaseIdInput(e.target.value)}
                      placeholder="(default)"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Por defecto en Firestore es <strong className="text-slate-600">(default)</strong>.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Auth Domain:</label>
                    <input
                      type="text"
                      value={authDomainInput}
                      onChange={(e) => setAuthDomainInput(e.target.value)}
                      placeholder="mi-proyecto.firebaseapp.com"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Diagnostics result if tested */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : testResult.statusCode === 404
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        {testResult.success ? 'Conexión Verificada Exitosamente' : `Diagnóstico: HTTP ${testResult.statusCode}`}
                      </p>
                      <p className="text-[11px] leading-relaxed mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}

                {/* Status message */}
                {saveStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      saveStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : saveStatus.type === 'info'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {saveStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{saveStatus.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                    >
                      Restaurar Inicial
                    </button>
                    <button
                      type="button"
                      onClick={handleTestCustomConfig}
                      disabled={isTesting}
                      className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Verificando...' : 'Probar esta BD'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProject}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>{isSavingProject ? 'Conectando...' : 'Conectar y Sincronizar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SINCRONIZACIÓN DIRECTA */}
          {activeTab === 'sincronizacion' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Control de Sincronización Bidireccional
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Puedes ejecutar una sincronización bidireccional automática, o elegir subir tus datos locales a Firebase o descargarlos de la nube a tu navegador.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Auto Sync */}
                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block mb-1">
                      Sincronización Inteligente
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Si Firebase está vacío, sube todo el catálogo. Si tiene datos, los descarga en el sitio web.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setSyncProgress({ running: true, message: 'Sincronizando bidireccionalmente...', percent: 20 });
                      const res = await syncBidirectionalAll((msg, pct) => {
                        setSyncProgress({ running: true, message: msg, percent: pct });
                      });
                      setSyncProgress({ running: false, message: '', percent: 0 });
                      setSaveStatus({ type: res.success ? 'success' : 'error', message: res.message });
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sincronizar Todo</span>
                  </button>
                </div>

                {/* Push to Firebase */}
                <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/40 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block mb-1">
                      Subir a Firebase (Push)
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Envía las 21 tablas locales completas con sus datos relacionados hacia Firestore.
                    </p>
                  </div>
                  <button
                    onClick={handlePushToFirebase}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Subir Catálogo a Firebase</span>
                  </button>
                </div>

                {/* Pull from Firebase */}
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block mb-1">
                      Descargar de Firebase (Pull)
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Descarga todas las colecciones desde Firebase Firestore hacia la memoria del sitio web.
                    </p>
                  </div>
                  <button
                    onClick={handlePullFromFirebase}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Descargar desde Firebase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 21 TABLAS Y RELACIONES */}
          {activeTab === 'tablas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-amber-600" />
                    Catálogo de las 21 Tablas y Relaciones
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Todas las tablas están normalizadas y vinculadas por claves relacionales (ID).
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Proyecto activo:</span>
                  <span className="font-mono font-bold text-[11px] text-amber-700">{firebaseProjectId}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allCollections.map((col) => {
                  const IconComp = col.icon;
                  return (
                    <div
                      key={col.name}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 text-[11px] block truncate">
                            {col.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 truncate block">
                            /{col.name} &bull; <span className="text-amber-700">Relación: {col.relation}</span>
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
                        {col.count} docs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AUDITORIA Y LOGS */}
          {activeTab === 'auditoria' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Últimos Eventos de Sincronización en la Nube
                </h4>
                <span className="text-[10px] text-slate-400">
                  Total eventos: {activityLogs.length}
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50">
                {activityLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="pt-2 first:pt-0 pb-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{log.modulo} - {log.accion}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{log.fecha}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.descripcion}</p>
                    <span className="text-[10px] text-slate-400">Por: {log.user_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Base de datos:</span>
            <span className="font-mono text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {firebaseDatabaseId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFirebaseModal(false)}
              className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer text-xs"
            >
              Cerrar
            </button>

            <button
              onClick={async () => {
                setSyncProgress({ running: true, message: 'Sincronizando todas las tablas...', percent: 15 });
                await syncBidirectionalAll((msg, pct) => {
                  setSyncProgress({ running: true, message: msg, percent: pct });
                });
                setSyncProgress({ running: false, message: '', percent: 0 });
              }}
              className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Todas las Tablas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
