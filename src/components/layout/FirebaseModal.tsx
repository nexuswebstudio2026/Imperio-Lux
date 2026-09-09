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
} from 'lucide-react';
import { testFirestoreConnection, FirebaseConfigObject } from '../../lib/firebase';

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
    seedFirebaseDatabase,
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

  const [activeTab, setActiveTab] = useState<'tablas' | 'proyecto' | 'auditoria'>('tablas');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form for custom project configuration
  const [projectIdInput, setProjectIdInput] = useState(activeFirebaseConfig.projectId);
  const [apiKeyInput, setApiKeyInput] = useState(activeFirebaseConfig.apiKey);
  const [authDomainInput, setAuthDomainInput] = useState(activeFirebaseConfig.authDomain);
  const [databaseIdInput, setDatabaseIdInput] = useState(activeFirebaseConfig.firestoreDatabaseId || '(default)');
  const [appIdInput, setAppIdInput] = useState(activeFirebaseConfig.appId);
  const [storageBucketInput, setStorageBucketInput] = useState(activeFirebaseConfig.storageBucket || '');
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);

  if (!showFirebaseModal) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await testFirestoreConnection();
      if (ok) {
        setTestResult(`¡Conexión exitosa! El nodo de Firestore en "${firebaseProjectId}" respondió en tiempo real.`);
      } else {
        setTestResult('Verificando respuesta de Firebase Firestore...');
      }
    } catch (e: any) {
      setTestResult(`Error al verificar: ${e?.message || 'Fallo de red'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyJsonConfig = () => {
    try {
      const parsed = JSON.parse(rawJsonInput);
      if (parsed.projectId) setProjectIdInput(parsed.projectId);
      if (parsed.apiKey) setApiKeyInput(parsed.apiKey);
      if (parsed.authDomain) setAuthDomainInput(parsed.authDomain);
      if (parsed.firestoreDatabaseId) setDatabaseIdInput(parsed.firestoreDatabaseId);
      if (parsed.appId) setAppIdInput(parsed.appId);
      if (parsed.storageBucket) setStorageBucketInput(parsed.storageBucket);
      setSaveStatus('Datos JSON aplicados a los campos. Haz clic en "Conectar Proyecto" para activar.');
    } catch (err: any) {
      setSaveStatus(`JSON inválido: ${err?.message}`);
    }
  };

  const handleSaveCustomProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectIdInput.trim() || !apiKeyInput.trim()) {
      setSaveStatus('El Project ID y API Key son obligatorios.');
      return;
    }

    setIsSavingProject(true);
    setSaveStatus(null);
    try {
      const newConfig: FirebaseConfigObject = {
        projectId: projectIdInput.trim(),
        apiKey: apiKeyInput.trim(),
        authDomain: authDomainInput.trim() || `${projectIdInput.trim()}.firebaseapp.com`,
        firestoreDatabaseId: databaseIdInput.trim() === '(default)' ? undefined : databaseIdInput.trim(),
        appId: appIdInput.trim() || '1:123456789:web:abcdef',
        storageBucket: storageBucketInput.trim() || `${projectIdInput.trim()}.firebasestorage.app`,
      };

      const ok = await switchFirebaseProject(newConfig);
      if (ok) {
        setSaveStatus(`¡Proyecto "${newConfig.projectId}" conectado exitosamente! Todas las tablas están enlazadas.`);
      } else {
        setSaveStatus('No se pudo conectar. Verifica que las credenciales sean correctas y que Firestore esté habilitado.');
      }
    } catch (err: any) {
      setSaveStatus(`Error al conectar: ${err?.message}`);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleResetToDefault = async () => {
    if (confirm('¿Deseas restaurar la configuración predeterminada de Firebase?')) {
      await resetToDefaultFirebase();
      setProjectIdInput(activeFirebaseConfig.projectId);
      setApiKeyInput(activeFirebaseConfig.apiKey);
      setAuthDomainInput(activeFirebaseConfig.authDomain);
      setDatabaseIdInput(activeFirebaseConfig.firestoreDatabaseId || '(default)');
      setSaveStatus('Se restableció la configuración predeterminada.');
    }
  };

  const allCollections = [
    { name: 'productos', label: 'Productos y Catálogo', count: productos.length, icon: Boxes },
    { name: 'categorias', label: 'Categorías de Lujo', count: categorias.length, icon: Tag },
    { name: 'marcas', label: 'Marcas Exclusivas', count: marcas.length, icon: Layers },
    { name: 'presentaciones', label: 'Presentaciones / Unidades', count: presentaciones.length, icon: Boxes },
    { name: 'ventas', label: 'Ventas y Facturación', count: ventas.length, icon: ShoppingCart },
    { name: 'compras', label: 'Compras y Abastecimiento', count: compras.length, icon: FileText },
    { name: 'cajas', label: 'Sesiones de Caja', count: cajas.length, icon: Database },
    { name: 'movimientos_caja', label: 'Movimientos de Caja', count: movimientosCaja.length, icon: DollarSign },
    { name: 'clientes', label: 'Clientes Registrados', count: clientes.length, icon: Users },
    { name: 'proveedores', label: 'Proveedores Comerciales', count: proveedores.length, icon: Building },
    { name: 'empleados', label: 'Personal y Empleados', count: empleados.length, icon: Users },
    { name: 'inventario_ajustes', label: 'Ajustes de Inventario', count: inventarioAjustes.length, icon: Layers },
    { name: 'kardex', label: 'Kardex Valorizado', count: kardex.length, icon: Clock },
    { name: 'empresas', label: 'Datos Empresa (Imperio Lux)', count: 1, icon: Building },
    { name: 'users', label: 'Usuarios del Sistema', count: users.length, icon: Users },
    { name: 'roles', label: 'Roles y Permisos', count: roles.length, icon: Key },
    { name: 'monedas', label: 'Monedas y Divisas', count: monedas.length, icon: DollarSign },
    { name: 'documentos', label: 'Tipos de Documento', count: documentos.length, icon: FileText },
    { name: 'comprobantes', label: 'Tipos de Comprobante', count: comprobantes.length, icon: FileText },
    { name: 'activity_logs', label: 'Logs de Auditoría', count: activityLogs.length, icon: Activity },
    { name: 'notificaciones', label: 'Alertas y Notificaciones', count: notificaciones.length, icon: Bell },
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
                Firebase Firestore
                <span className="text-[10px] bg-amber-400/30 text-amber-100 font-semibold px-2 py-0.5 rounded-full border border-amber-300/30 uppercase">
                  Imperio Lux
                </span>
              </h3>
              <p className="text-xs text-amber-100/90">
                Gestión de proyecto y sincronización en la nube de todas las tablas
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('tablas')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'tablas'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>21 Tablas Conectadas ({allCollections.reduce((acc, c) => acc + c.count, 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('proyecto')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'proyecto'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Conectar Proyecto Imperio Lux</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'auditoria'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Logs & Estado</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 text-slate-700 text-xs overflow-y-auto flex-1">
          {/* Status Alert */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${
            firebaseStatus === 'connected'
              ? 'bg-emerald-50/50 border-emerald-200'
              : firebaseStatus === 'disconnected'
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
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
                    ? 'En línea y Conectado'
                    : firebaseStatus === 'disconnected'
                    ? 'Desconectado (Base de datos eliminada en Firebase)'
                    : firebaseStatus}
                </p>
                <p className="text-[11px] text-slate-500">{firebaseMessage}</p>
              </div>
            </div>
            {firebaseStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nube Activa
              </span>
            ) : firebaseStatus === 'disconnected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Desconectado
              </span>
            ) : null}
          </div>

          {firebaseStatus === 'disconnected' && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Base de datos eliminada en Firebase Console
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Has eliminado la base de datos de Firebase, por lo cual el sitio web está <strong>completamente desconectado</strong> de la nube. Todas las acciones del sistema funcionan ahora en <strong>modo local en el navegador</strong>.
              </p>
            </div>
          )}

          {/* TAB 1: 21 TABLES */}
          {activeTab === 'tablas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-amber-600" />
                    Catálogo Completo de Tablas Sincronizadas
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Cada tabla está enlazada bidireccionalmente a su colección en Firestore.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Proyecto activo:</span>
                  <span className="font-mono font-bold text-[11px] text-amber-700">{firebaseProjectId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allCollections.map((col) => {
                  const IconComp = col.icon;
                  return (
                    <div
                      key={col.name}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition-colors flex items-center justify-between"
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
                            /{col.name}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
                        {col.count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {testResult && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{testResult}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROJECT SWITCHER / CONFIGURATION */}
          {activeTab === 'proyecto' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Conectar tu nuevo Proyecto Firebase "Imperio Lux"</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Si creaste un proyecto exclusivo en la consola de Firebase llamado <strong>Imperio Lux</strong>,
                  puedes pegar aquí su configuración JSON o rellenar sus campos. Al presionar "Conectar Proyecto",
                  la aplicación transferirá la conexión y sincronizará todas las 21 tablas inmediatamente.
                </p>
              </div>

              {/* Paste JSON Option */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
                <label className="block font-bold text-slate-800 text-xs">
                  Pegar configuración rápida (firebaseConfig JSON):
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={rawJsonInput}
                    onChange={(e) => setRawJsonInput(e.target.value)}
                    placeholder='{"projectId": "imperio-lux-123", "apiKey": "AIzaSy...", "authDomain": "..."}'
                    className="w-full font-mono text-[11px] border border-slate-300 rounded p-2 bg-white focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyJsonConfig}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs self-start shrink-0 cursor-pointer"
                  >
                    Autocompletar
                  </button>
                </div>
              </div>

              {/* Project Fields Form */}
              <form onSubmit={handleSaveCustomProject} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Project ID (*):</label>
                    <input
                      type="text"
                      required
                      value={projectIdInput}
                      onChange={(e) => setProjectIdInput(e.target.value)}
                      placeholder="imperio-lux-xxxxx"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">API Key (*):</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">Auth Domain:</label>
                    <input
                      type="text"
                      value={authDomainInput}
                      onChange={(e) => setAuthDomainInput(e.target.value)}
                      placeholder="imperio-lux.firebaseapp.com"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Firestore Database ID:</label>
                    <input
                      type="text"
                      value={databaseIdInput}
                      onChange={(e) => setDatabaseIdInput(e.target.value)}
                      placeholder="(default)"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {saveStatus && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    saveStatus.includes('exitosamente')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{saveStatus}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                  >
                    Restaurar Proyecto Predeterminado
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingProject}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>{isSavingProject ? 'Conectando...' : 'Conectar Proyecto Imperio Lux'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: AUDITORIA Y LOGS */}
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
          <div className="text-[11px] text-slate-500">
            Reglas de Seguridad: <span className="font-mono text-emerald-700 font-semibold">firestore.rules (Activas)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Verificando...' : 'Probar Conexión'}</span>
            </button>

            <button
              onClick={syncNowWithFirebase}
              className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sincronizar Todas</span>
            </button>

            <button
              onClick={seedFirebaseDatabase}
              className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Poblar 21 Tablas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
