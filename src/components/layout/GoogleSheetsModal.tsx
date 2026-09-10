import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  X,
  Upload,
  Download,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  LogOut,
  Info,
} from 'lucide-react';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { ConfirmDestructiveModal } from '../common/ConfirmDestructiveModal';
import {
  fetchSpreadsheetMetadata,
  getSpreadsheetUrl,
  DEFAULT_SPREADSHEET_ID,
  SpreadsheetMetadata,
} from '../../lib/sheets';

export const GoogleSheetsModal: React.FC = () => {
  const {
    showGoogleSheetsModal,
    setShowGoogleSheetsModal,
    googleUser,
    googleAccessToken,
    googleSheetsId,
    setGoogleSheetsId,
    googleSheetsStatus,
    googleSheetsMessage,
    activeDatabaseEngine,
    setActiveDatabaseEngine,
    signInWithGoogleSheets,
    signOutGoogleSheets,
    uploadAllToGoogleSheets,
    downloadAllFromGoogleSheets,
    syncBidirectionalGoogleSheets,
    productos,
    categorias,
    marcas,
    presentaciones,
    clientes,
    proveedores,
    empleados,
    ventas,
    compras,
    cajas,
    movimientosCaja,
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
  } = useApp();

  const [activeTab, setActiveTab] = useState<'conexion' | 'tablas' | 'sincronizacion'>('conexion');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(googleSheetsId);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    title?: string;
    sheetsCount?: number;
    sheets?: { id: number; title: string; rowCount: number }[];
    error?: string;
  } | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ running: boolean; message: string; percent: number }>({
    running: false,
    message: '',
    percent: 0,
  });

  const [showConfirmUpload, setShowConfirmUpload] = useState(false);

  if (!showGoogleSheetsModal) return null;

  const totalRecords =
    productos.length +
    categorias.length +
    marcas.length +
    presentaciones.length +
    clientes.length +
    proveedores.length +
    empleados.length +
    ventas.length +
    compras.length +
    cajas.length +
    movimientosCaja.length +
    inventarioAjustes.length +
    kardex.length +
    1 + // empresa
    users.length +
    roles.length +
    monedas.length +
    documentos.length +
    comprobantes.length +
    activityLogs.length +
    notificaciones.length;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getSpreadsheetUrl(googleSheetsId));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveSpreadsheetId = () => {
    if (spreadsheetIdInput.trim()) {
      setGoogleSheetsId(spreadsheetIdInput.trim());
      setTestResult(null);
    }
  };

  const handleResetDefaultId = () => {
    setSpreadsheetIdInput(DEFAULT_SPREADSHEET_ID);
    setGoogleSheetsId(DEFAULT_SPREADSHEET_ID);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let token = googleAccessToken;
      if (!token) {
        const res = await signInWithGoogleSheets();
        token = res?.accessToken || null;
      }
      if (!token) {
        setTestResult({
          success: false,
          error: 'Por favor inicia sesión con tu cuenta de Google para verificar el acceso al Spreadsheet.',
        });
        setIsTesting(false);
        return;
      }

      const meta: SpreadsheetMetadata = await fetchSpreadsheetMetadata(token, googleSheetsId);
      setTestResult({
        success: true,
        title: meta.title,
        sheetsCount: meta.sheets.length,
        sheets: meta.sheets.map((s) => ({
          id: s.sheetId,
          title: s.title,
          rowCount: s.rowCount || 0,
        })),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || 'Error al comunicarse con la API de Google Sheets.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerUpload = async () => {
    setShowConfirmUpload(false);
    setSyncProgress({ running: true, message: 'Iniciando subida...', percent: 5 });
    try {
      const res = await uploadAllToGoogleSheets((msg, pct) => {
        setSyncProgress({ running: true, message: msg, percent: pct });
      });
      setTimeout(() => {
        setSyncProgress({ running: false, message: res.message, percent: 100 });
      }, 1000);
    } catch (err: any) {
      setSyncProgress({
        running: false,
        message: `Error al subir: ${err?.message || 'Error desconocido'}`,
        percent: 0,
      });
    }
  };

  const handleTriggerDownload = async () => {
    setSyncProgress({ running: true, message: 'Iniciando descarga...', percent: 5 });
    try {
      const res = await downloadAllFromGoogleSheets((msg, pct) => {
        setSyncProgress({ running: true, message: msg, percent: pct });
      });
      setTimeout(() => {
        setSyncProgress({ running: false, message: res.message, percent: 100 });
      }, 1000);
    } catch (err: any) {
      setSyncProgress({
        running: false,
        message: `Error al descargar: ${err?.message || 'Error desconocido'}`,
        percent: 0,
      });
    }
  };

  const handleTriggerBidirectional = async () => {
    setSyncProgress({ running: true, message: 'Iniciando sincronización...', percent: 5 });
    try {
      const res = await syncBidirectionalGoogleSheets((msg, pct) => {
        setSyncProgress({ running: true, message: msg, percent: pct });
      });
      setTimeout(() => {
        setSyncProgress({ running: false, message: res.message, percent: 100 });
      }, 1000);
    } catch (err: any) {
      setSyncProgress({
        running: false,
        message: `Error en sincronización: ${err?.message || 'Error desconocido'}`,
        percent: 0,
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Base de Datos en Google Sheets
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full">
                    Activa
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ID: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{googleSheetsId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getSpreadsheetUrl(googleSheetsId)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
                title="Abrir hoja de cálculo directamente en Google Sheets"
              >
                <span>Abrir Spreadsheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowGoogleSheetsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Engine Selector Ribbon */}
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">Motor de BD activo:</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize">
                {activeDatabaseEngine === 'sheets' ? 'Google Sheets (Principal)' : activeDatabaseEngine}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveDatabaseEngine('sheets')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeDatabaseEngine === 'sheets'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Google Sheets
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseEngine('firestore')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeDatabaseEngine === 'firestore'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Firebase Firestore
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseEngine('local')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeDatabaseEngine === 'local'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Local Offline
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-sm">
            <button
              onClick={() => setActiveTab('conexion')}
              className={`py-3 font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'conexion'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Conexión y Cuenta Google
            </button>
            <button
              onClick={() => setActiveTab('sincronizacion')}
              className={`py-3 font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'sincronizacion'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sincronizar Datos
            </button>
            <button
              onClick={() => setActiveTab('tablas')}
              className={`py-3 font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'tablas'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Estructura de 21 Pestañas
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tab: Conexión */}
            {activeTab === 'conexion' && (
              <div className="space-y-6">
                {/* Google Account Authentication Status */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {googleUser?.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt={googleUser.displayName || 'Google user'}
                        className="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base border border-blue-200 dark:border-blue-800">
                        {googleUser?.email ? googleUser.email[0].toUpperCase() : 'G'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {googleUser ? (googleUser.displayName || googleUser.email) : 'Sesión de Google no iniciada'}
                        </span>
                        {googleAccessToken && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Token Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {googleUser
                          ? `Email: ${googleUser.email} (Permisos de Google Sheets otorgados)`
                          : 'Inicia sesión con Google para permitir lectura y escritura en la hoja de cálculo.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {googleUser ? (
                      <button
                        type="button"
                        onClick={signOutGoogleSheets}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    ) : (
                      <GoogleSignInButton onClick={signInWithGoogleSheets} />
                    )}
                  </div>
                </div>

                {/* Spreadsheet ID & Direct URL */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Identificador de la Hoja de Cálculo
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID del Google Sheet proporcionado por el usuario para almacenar la base de datos
                      </p>
                    </div>
                    <button
                      onClick={handleResetDefaultId}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Restablecer ID del usuario
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={spreadsheetIdInput}
                      onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      placeholder="ID del Spreadsheet (ej. 12hdlu9ph-YSU9IfwXh44cqJVHjaNxQD3MP3CXyrfwwk)"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSpreadsheetId}
                      className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Guardar ID
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copiado' : 'Copiar Enlace'}</span>
                    </button>
                  </div>

                  {/* Test Connection Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Verificando acceso a Google Sheets...' : 'Diagnosticar y Probar Conexión'}</span>
                    </button>

                    <span className="text-xs text-slate-500">
                      Estado actual: <strong className="text-slate-700 dark:text-slate-300 capitalize">{googleSheetsStatus}</strong>
                    </span>
                  </div>

                  {/* Test Diagnostic Result */}
                  {testResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        testResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <span>
                          {testResult.success
                            ? `¡Conexión Exitosa con "${testResult.title || 'Google Sheet'}"!`
                            : 'Error de Conexión con Google Sheets'}
                        </span>
                      </div>

                      {testResult.success ? (
                        <div>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300">
                            La hoja contiene <strong>{testResult.sheetsCount}</strong> pestañas.
                          </p>
                          {testResult.sheets && testResult.sheets.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {testResult.sheets.map((s) => (
                                <span
                                  key={s.id}
                                  className="px-2 py-0.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-mono"
                                >
                                  {s.title} ({s.rowCount} filas)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-rose-700 dark:text-rose-300 font-mono">
                          {testResult.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Sincronización */}
            {activeTab === 'sincronizacion' && (
              <div className="space-y-6">
                {/* Progress bar if running */}
                {syncProgress.running && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                      <span>{syncProgress.message}</span>
                      <span>{syncProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                        style={{ width: `${syncProgress.percent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {!syncProgress.running && syncProgress.message && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{syncProgress.message}</span>
                  </div>
                )}

                {/* 3 Main Synchronization Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1: Bidireccional */}
                  <div className="p-5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Sincronización Inteligente
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Verifica el contenido de Google Sheets: si ya contiene datos, los descarga en la app; si está vacío, siembra todas las 21 tablas locales.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncProgress.running}
                      onClick={handleTriggerBidirectional}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncProgress.running ? 'animate-spin' : ''}`} />
                      <span>Sincronizar Bidireccional</span>
                    </button>
                  </div>

                  {/* Option 2: Upload to Sheets (Destructive Confirmation Required) */}
                  <div className="p-5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Subir Todo a Sheets
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Exporta las 21 tablas ({totalRecords} registros locales) hacia las pestañas de Google Sheets. Requiere confirmación explícita.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncProgress.running}
                      onClick={() => setShowConfirmUpload(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Todo a Sheets</span>
                    </button>
                  </div>

                  {/* Option 3: Download from Sheets */}
                  <div className="p-5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-500/50 transition-all">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Download className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Descargar desde Sheets
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Lee todas las filas de cada pestaña en la hoja de cálculo de Google y actualiza los catálogos y transacciones del sistema.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncProgress.running}
                      onClick={handleTriggerDownload}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar desde Sheets</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Estructura de Tablas */}
            {activeTab === 'tablas' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Las siguientes 21 colecciones se mapean a pestañas independientes en Google Sheets:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'productos', label: 'Productos', count: productos.length },
                    { name: 'categorias', label: 'Categorías', count: categorias.length },
                    { name: 'marcas', label: 'Marcas', count: marcas.length },
                    { name: 'presentaciones', label: 'Presentaciones', count: presentaciones.length },
                    { name: 'clientes', label: 'Clientes', count: clientes.length },
                    { name: 'proveedores', label: 'Proveedores', count: proveedores.length },
                    { name: 'empleados', label: 'Empleados', count: empleados.length },
                    { name: 'ventas', label: 'Ventas', count: ventas.length },
                    { name: 'compras', label: 'Compras', count: compras.length },
                    { name: 'cajas', label: 'Cajas', count: cajas.length },
                    { name: 'movimientos_caja', label: 'Movimientos Caja', count: movimientosCaja.length },
                    { name: 'inventario_ajustes', label: 'Ajustes Inventario', count: inventarioAjustes.length },
                    { name: 'kardex', label: 'Kardex', count: kardex.length },
                    { name: 'empresas', label: 'Datos Empresa', count: 1 },
                    { name: 'users', label: 'Usuarios', count: users.length },
                    { name: 'roles', label: 'Roles y Permisos', count: roles.length },
                    { name: 'monedas', label: 'Monedas', count: monedas.length },
                    { name: 'documentos', label: 'Tipos Documentos', count: documentos.length },
                    { name: 'comprobantes', label: 'Tipos Comprobantes', count: comprobantes.length },
                    { name: 'activity_logs', label: 'Auditoría / Logs', count: activityLogs.length },
                    { name: 'notificaciones', label: 'Notificaciones', count: notificaciones.length },
                  ].map((table) => (
                    <div
                      key={table.name}
                      className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                          {table.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          hoja: {table.name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full">
                        {table.count} reg.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Google Sheets API v4 • ID: <strong className="font-mono">{googleSheetsId}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowGoogleSheetsModal(false)}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Overwriting Data in Google Sheets */}
      <ConfirmDestructiveModal
        isOpen={showConfirmUpload}
        title="¿Sobrescribir datos en Google Sheets?"
        description="Esta acción escribirá y actualizará todas las 21 pestañas del spreadsheet con los datos actuales del sistema Imperio Lux."
        itemCount={totalRecords}
        itemDescription="registros en 21 pestañas"
        affectedItems={[
          'productos',
          'categorias',
          'marcas',
          'presentaciones',
          'clientes',
          'proveedores',
          'empleados',
          'ventas',
          'compras',
          'cajas',
          'movimientos_caja',
          'inventario_ajustes',
          'kardex',
          'empresas',
          'users',
          'roles',
          'monedas',
          'documentos',
          'comprobantes',
          'activity_logs',
          'notificaciones',
        ]}
        confirmLabel="Confirmar y Subir a Google Sheets"
        cancelLabel="Cancelar"
        onConfirm={handleTriggerUpload}
        onCancel={() => setShowConfirmUpload(false)}
      />
    </>
  );
};
