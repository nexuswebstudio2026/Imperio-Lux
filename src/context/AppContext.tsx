import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Empresa,
  Moneda,
  Categoria,
  Presentacion,
  Marca,
  Producto,
  DocumentoTipo,
  Cliente,
  Proveedor,
  ComprobanteTipo,
  Venta,
  Compra,
  Caja,
  MovimientoCaja,
  InventarioAjuste,
  KardexItem,
  Empleado,
  Role,
  User,
  ActivityLog,
  Notificacion,
} from '../types';
import {
  initialEmpresa,
  initialMonedas,
  initialDocumentos,
  initialComprobantes,
  initialCategorias,
  initialPresentaciones,
  initialMarcas,
  initialProductos,
  initialClientes,
  initialProveedores,
  initialUsers,
  initialRoles,
  initialEmpleados,
  initialCajas,
  initialMovimientosCaja,
  initialVentas,
  initialCompras,
  initialInventarioAjustes,
  initialKardex,
  initialActivityLogs,
  initialNotificaciones,
} from '../data/initialData';
import {
  googleSignIn as libGoogleSignIn,
  logout as libGoogleLogout,
  initAuth as initGoogleAuth,
  getAccessToken as getGoogleAccessToken,
  getCurrentUser as getGoogleCurrentUser,
  type GoogleUser,
} from '../lib/googleAuth';
import {
  DEFAULT_SPREADSHEET_ID,
  getStoredSpreadsheetId,
  setStoredSpreadsheetId,
  getSpreadsheetUrl,
  fetchSpreadsheetMetadata,
  ensureSheetTabsExist,
  writeTableToSheet,
  readTableFromSheet,
  appendRowToSheet,
} from '../lib/sheets';
import {
  exportAllTablesToExcel,
  exportSingleTableToExcel,
  downloadGoogleSheetsLiveExcel,
} from '../lib/excelExport';

export type AppTab =
  | 'panel'
  | 'ventas'
  | 'ventas_create'
  | 'compras'
  | 'compras_create'
  | 'productos'
  | 'categorias'
  | 'presentaciones'
  | 'marcas'
  | 'inventario'
  | 'kardex'
  | 'cajas'
  | 'clientes'
  | 'proveedores'
  | 'empleados'
  | 'empresa'
  | 'users'
  | 'roles'
  | 'activity_log'
  | 'database';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Theme (Día / Noche)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Engine Selector ('sheets' | 'local')
  activeDatabaseEngine: 'sheets' | 'local';
  setActiveDatabaseEngine: (engine: 'sheets' | 'local') => void;

  // Google Sheets
  googleUser: GoogleUser | null;
  googleAccessToken: string | null;
  googleSheetsId: string;
  setGoogleSheetsId: (id: string) => void;
  googleSheetsStatus: 'idle' | 'connecting' | 'connected' | 'syncing' | 'error';
  googleSheetsMessage: string;
  signInWithGoogleSheets: () => Promise<{ user: GoogleUser; accessToken: string } | null>;
  signOutGoogleSheets: () => Promise<void>;
  uploadAllToGoogleSheets: (onProgress?: (msg: string, percent: number) => void) => Promise<{ success: boolean; count: number; message: string }>;
  uploadSingleTableToGoogleSheets: (tableName: string, data?: any[], onProgress?: (msg: string, percent: number) => void) => Promise<{ success: boolean; count: number; message: string }>;
  downloadAllFromGoogleSheets: (onProgress?: (msg: string, percent: number) => void) => Promise<{ success: boolean; count: number; message: string }>;
  syncBidirectionalGoogleSheets: (onProgress?: (msg: string, percent: number) => void) => Promise<{ success: boolean; count: number; message: string }>;
  exportAllToExcel: () => void;
  exportTableToExcel: (tableName: string) => void;
  downloadGoogleSheetsExcel: () => void;
  showGoogleSheetsModal: boolean;
  setShowGoogleSheetsModal: (show: boolean) => void;

  empresa: Empresa;
  updateEmpresa: (empresa: Partial<Empresa>) => void;
  monedas: Moneda[];
  currentMoneda: Moneda;
  documentos: DocumentoTipo[];
  comprobantes: ComprobanteTipo[];

  categorias: Categoria[];
  addCategoria: (cat: Omit<Categoria, 'id'>) => void;
  updateCategoria: (id: number, cat: Partial<Categoria>) => void;
  deleteCategoria: (id: number) => void;

  presentaciones: Presentacion[];
  addPresentacion: (pres: Omit<Presentacion, 'id'>) => void;
  updatePresentacion: (id: number, pres: Partial<Presentacion>) => void;
  deletePresentacion: (id: number) => void;

  marcas: Marca[];
  addMarca: (m: Omit<Marca, 'id'>) => void;
  updateMarca: (id: number, m: Partial<Marca>) => void;
  deleteMarca: (id: number) => void;

  productos: Producto[];
  addProducto: (prod: Omit<Producto, 'id'>) => void;
  updateProducto: (id: number, prod: Partial<Producto>) => void;
  deleteProducto: (id: number) => void;

  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id'>) => Cliente;
  updateCliente: (id: number, c: Partial<Cliente>) => void;
  deleteCliente: (id: number) => void;

  proveedores: Proveedor[];
  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: number, p: Partial<Proveedor>) => void;
  deleteProveedor: (id: number) => void;

  ventas: Venta[];
  addVenta: (venta: Omit<Venta, 'id' | 'numero_comprobante'>) => Venta;
  anularVenta: (id: number) => void;

  compras: Compra[];
  addCompra: (compra: Omit<Compra, 'id'>) => void;

  cajas: Caja[];
  activeCaja: Caja | null;
  openCaja: (nombre: string, montoInicial: number) => void;
  closeCaja: (id: number, montoFinal: number) => void;

  movimientosCaja: MovimientoCaja[];
  addMovimientoCaja: (tipo: 'Ingreso' | 'Egreso', concepto: string, monto: number) => void;

  inventarioAjustes: InventarioAjuste[];
  addInventarioAjuste: (productoId: number, tipo: 'Entrada' | 'Salida', cantidad: number, motivo: string) => void;

  kardex: KardexItem[];

  empleados: Empleado[];
  addEmpleado: (emp: Omit<Empleado, 'id'>) => void;
  updateEmpleado: (id: number, emp: Partial<Empleado>) => void;
  deleteEmpleado: (id: number) => void;

  users: User[];
  roles: Role[];

  activityLogs: ActivityLog[];
  notificaciones: Notificacion[];
  markNotificationsAsRead: () => void;

  activeComprobanteVenta: Venta | null;
  setActiveComprobanteVenta: (v: Venta | null) => void;
  resetAllDataToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(`pv_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error(`Error loading storage for ${key}`, e);
    return defaultVal;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`pv_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving storage for ${key}`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Google Sheets database state
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => getGoogleCurrentUser());
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleSheetsId, setGoogleSheetsIdState] = useState<string>(() => getStoredSpreadsheetId());
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<'idle' | 'connecting' | 'connected' | 'syncing' | 'error'>('idle');
  const [googleSheetsMessage, setGoogleSheetsMessage] = useState<string>('Base de datos configurada en Google Sheets');
  const [activeDatabaseEngine, setActiveDatabaseEngine] = useState<'sheets' | 'local'>('sheets');
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState<boolean>(false);

  const setGoogleSheetsId = useCallback((id: string) => {
    const trimmed = id.trim();
    setGoogleSheetsIdState(trimmed);
    setStoredSpreadsheetId(trimmed);
  }, []);

  // Listen to Google Auth state
  useEffect(() => {
    const unsub = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        setGoogleSheetsStatus('connected');
        setGoogleSheetsMessage(`Conectado a Google como ${user.email || user.displayName || 'Usuario'}`);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setGoogleSheetsStatus('idle');
        setGoogleSheetsMessage('Inicia sesión con Google para sincronizar con Google Sheets');
      }
    );
    return () => unsub();
  }, []);

  const signInWithGoogleSheets = useCallback(async () => {
    setGoogleSheetsStatus('connecting');
    setGoogleSheetsMessage('Iniciando sesión con Google...');
    try {
      const res = await libGoogleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        setGoogleSheetsStatus('connected');
        setGoogleSheetsMessage(`Conectado como ${res.user.email}`);
        return res;
      }
      return null;
    } catch (err: any) {
      setGoogleSheetsStatus('error');
      setGoogleSheetsMessage(`Error de autenticación: ${err?.message || 'Cancelado'}`);
      throw err;
    }
  }, []);

  const signOutGoogleSheets = useCallback(async () => {
    await libGoogleLogout();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    setGoogleSheetsStatus('idle');
    setGoogleSheetsMessage('Sesión cerrada de Google');
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    loadStorage<User | null>('currentUser', initialUsers[0])
  );
  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    loadStorage<AppTab>('activeTab', 'panel')
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Theme state with localStorage persistence and DOM class synchronization
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('pv_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('pv_theme', newTheme);
    } catch (e) {
      console.warn('Could not save theme:', e);
    }
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Sync theme class on mount and changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [empresa, setEmpresa] = useState<Empresa>(() =>
    loadStorage<Empresa>('empresa', initialEmpresa)
  );
  const [monedas, setMonedas] = useState<Moneda[]>(() =>
    loadStorage<Moneda[]>('monedas', initialMonedas)
  );
  const currentMoneda = monedas.find((m) => m.id === empresa.moneda_id) || monedas[0];
  const [documentos, setDocumentos] = useState<DocumentoTipo[]>(() =>
    loadStorage<DocumentoTipo[]>('documentos', initialDocumentos)
  );
  const [comprobantes, setComprobantes] = useState<ComprobanteTipo[]>(() =>
    loadStorage<ComprobanteTipo[]>('comprobantes', initialComprobantes)
  );

  const [categorias, setCategorias] = useState<Categoria[]>(() =>
    loadStorage<Categoria[]>('categorias', initialCategorias)
  );
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>(() =>
    loadStorage<Presentacion[]>('presentaciones', initialPresentaciones)
  );
  const [marcas, setMarcas] = useState<Marca[]>(() =>
    loadStorage<Marca[]>('marcas', initialMarcas)
  );
  const [productos, setProductos] = useState<Producto[]>(() =>
    loadStorage<Producto[]>('productos', initialProductos)
  );
  const [clientes, setClientes] = useState<Cliente[]>(() =>
    loadStorage<Cliente[]>('clientes', initialClientes)
  );
  const [proveedores, setProveedores] = useState<Proveedor[]>(() =>
    loadStorage<Proveedor[]>('proveedores', initialProveedores)
  );
  const [ventas, setVentas] = useState<Venta[]>(() =>
    loadStorage<Venta[]>('ventas', initialVentas)
  );
  const [compras, setCompras] = useState<Compra[]>(() =>
    loadStorage<Compra[]>('compras', initialCompras)
  );
  const [cajas, setCajas] = useState<Caja[]>(() =>
    loadStorage<Caja[]>('cajas', initialCajas)
  );
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>(() =>
    loadStorage<MovimientoCaja[]>('movimientosCaja', initialMovimientosCaja)
  );
  const [inventarioAjustes, setInventarioAjustes] = useState<InventarioAjuste[]>(() =>
    loadStorage<InventarioAjuste[]>('inventarioAjustes', initialInventarioAjustes)
  );
  const [kardex, setKardex] = useState<KardexItem[]>(() =>
    loadStorage<KardexItem[]>('kardex', initialKardex)
  );
  const [empleados, setEmpleados] = useState<Empleado[]>(() =>
    loadStorage<Empleado[]>('empleados', initialEmpleados)
  );
  const [users, setUsers] = useState<User[]>(() =>
    loadStorage<User[]>('users', initialUsers)
  );
  const [roles, setRoles] = useState<Role[]>(() =>
    loadStorage<Role[]>('roles', initialRoles)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadStorage<ActivityLog[]>('activityLogs', initialActivityLogs)
  );
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() =>
    loadStorage<Notificacion[]>('notificaciones', initialNotificaciones)
  );

  const [activeComprobanteVenta, setActiveComprobanteVenta] = useState<Venta | null>(null);

  // Sync state to local storage
  useEffect(() => saveStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveStorage('activeTab', activeTab), [activeTab]);
  useEffect(() => saveStorage('empresa', empresa), [empresa]);
  useEffect(() => saveStorage('categorias', categorias), [categorias]);
  useEffect(() => saveStorage('presentaciones', presentaciones), [presentaciones]);
  useEffect(() => saveStorage('marcas', marcas), [marcas]);
  useEffect(() => saveStorage('productos', productos), [productos]);
  useEffect(() => saveStorage('clientes', clientes), [clientes]);
  useEffect(() => saveStorage('proveedores', proveedores), [proveedores]);
  useEffect(() => saveStorage('ventas', ventas), [ventas]);
  useEffect(() => saveStorage('compras', compras), [compras]);
  useEffect(() => saveStorage('cajas', cajas), [cajas]);
  useEffect(() => saveStorage('movimientosCaja', movimientosCaja), [movimientosCaja]);
  useEffect(() => saveStorage('inventarioAjustes', inventarioAjustes), [inventarioAjustes]);
  useEffect(() => saveStorage('kardex', kardex), [kardex]);
  useEffect(() => saveStorage('empleados', empleados), [empleados]);
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('roles', roles), [roles]);
  useEffect(() => saveStorage('monedas', monedas), [monedas]);
  useEffect(() => saveStorage('documentos', documentos), [documentos]);
  useEffect(() => saveStorage('comprobantes', comprobantes), [comprobantes]);
  useEffect(() => saveStorage('activityLogs', activityLogs), [activityLogs]);
  useEffect(() => saveStorage('notificaciones', notificaciones), [notificaciones]);

  // --- GOOGLE SHEETS SYNCHRONIZATION METHODS ---
  const uploadAllToGoogleSheets = useCallback(
    async (
      onProgress?: (msg: string, percent: number) => void
    ): Promise<{ success: boolean; count: number; message: string }> => {
      let token = googleAccessToken || (await getGoogleAccessToken());
      if (!token) {
        const res = await signInWithGoogleSheets();
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error('Se requiere iniciar sesión con Google para acceder a Google Sheets');
      }

      setGoogleSheetsStatus('syncing');
      onProgress?.('Verificando acceso a Google Sheets...', 5);

      const meta = await fetchSpreadsheetMetadata(token, googleSheetsId);
      const existingTabNames = meta.sheets.map((s) => s.title);

      const tablesToUpload: { name: string; data: any[] }[] = [
        { name: 'productos', data: productos.length > 0 ? productos : initialProductos },
        { name: 'categorias', data: categorias.length > 0 ? categorias : initialCategorias },
        { name: 'marcas', data: marcas.length > 0 ? marcas : initialMarcas },
        { name: 'presentaciones', data: presentaciones.length > 0 ? presentaciones : initialPresentaciones },
        { name: 'clientes', data: clientes.length > 0 ? clientes : initialClientes },
        { name: 'proveedores', data: proveedores.length > 0 ? proveedores : initialProveedores },
        { name: 'empleados', data: empleados.length > 0 ? empleados : initialEmpleados },
        { name: 'ventas', data: ventas.length > 0 ? ventas : initialVentas },
        { name: 'compras', data: compras.length > 0 ? compras : initialCompras },
        { name: 'cajas', data: cajas.length > 0 ? cajas : initialCajas },
        { name: 'movimientos_caja', data: movimientosCaja.length > 0 ? movimientosCaja : initialMovimientosCaja },
        { name: 'inventario_ajustes', data: inventarioAjustes.length > 0 ? inventarioAjustes : initialInventarioAjustes },
        { name: 'kardex', data: kardex.length > 0 ? kardex : initialKardex },
        { name: 'empresas', data: [empresa || initialEmpresa] },
        { name: 'users', data: users.length > 0 ? users : initialUsers },
        { name: 'roles', data: roles.length > 0 ? roles : initialRoles },
        { name: 'monedas', data: monedas.length > 0 ? monedas : initialMonedas },
        { name: 'documentos', data: documentos.length > 0 ? documentos : initialDocumentos },
        { name: 'comprobantes', data: comprobantes.length > 0 ? comprobantes : initialComprobantes },
        { name: 'activity_logs', data: activityLogs.length > 0 ? activityLogs : initialActivityLogs },
        { name: 'notificaciones', data: notificaciones.length > 0 ? notificaciones : initialNotificaciones },
      ];

      onProgress?.('Creando pestañas en la hoja de cálculo...', 10);
      await ensureSheetTabsExist(
        token,
        googleSheetsId,
        tablesToUpload.map((t) => t.name),
        existingTabNames
      );

      let totalRecordsUploaded = 0;
      for (let i = 0; i < tablesToUpload.length; i++) {
        const table = tablesToUpload[i];
        const percent = Math.round(15 + ((i + 1) / tablesToUpload.length) * 80);
        onProgress?.(`Subiendo tabla "${table.name}" (${table.data.length} registros)...`, percent);
        await writeTableToSheet(token, googleSheetsId, table.name, table.data);
        totalRecordsUploaded += table.data.length;
      }

      setGoogleSheetsStatus('connected');
      const msg = `¡Éxito! Se actualizaron las 21 tablas (${totalRecordsUploaded} registros) en Google Sheets.`;
      setGoogleSheetsMessage(msg);
      onProgress?.(msg, 100);
      return { success: true, count: totalRecordsUploaded, message: msg };
    },
    [
      googleAccessToken,
      googleSheetsId,
      signInWithGoogleSheets,
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
    ]
  );

  const downloadAllFromGoogleSheets = useCallback(
    async (
      onProgress?: (msg: string, percent: number) => void
    ): Promise<{ success: boolean; count: number; message: string }> => {
      let token = googleAccessToken || (await getGoogleAccessToken());
      if (!token) {
        const res = await signInWithGoogleSheets();
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error('Se requiere iniciar sesión con Google para descargar datos de Google Sheets');
      }

      setGoogleSheetsStatus('syncing');
      onProgress?.('Consultando estructura de Google Sheets...', 10);
      const meta = await fetchSpreadsheetMetadata(token, googleSheetsId);
      const existingTabs = new Set(meta.sheets.map((s) => s.title));

      let totalRecords = 0;

      if (existingTabs.has('productos')) {
        onProgress?.('Descargando productos...', 15);
        const list = await readTableFromSheet<Producto>(token, googleSheetsId, 'productos');
        if (list.length > 0) {
          setProductos(list);
          saveStorage('productos', list);
          totalRecords += list.length;
        }
      }
      if (existingTabs.has('categorias')) {
        onProgress?.('Descargando categorías...', 25);
        const list = await readTableFromSheet<Categoria>(token, googleSheetsId, 'categorias');
        if (list.length > 0) {
          setCategorias(list);
          saveStorage('categorias', list);
          totalRecords += list.length;
        }
      }
      if (existingTabs.has('marcas')) {
        const list = await readTableFromSheet<Marca>(token, googleSheetsId, 'marcas');
        if (list.length > 0) { setMarcas(list); saveStorage('marcas', list); totalRecords += list.length; }
      }
      if (existingTabs.has('presentaciones')) {
        const list = await readTableFromSheet<Presentacion>(token, googleSheetsId, 'presentaciones');
        if (list.length > 0) { setPresentaciones(list); saveStorage('presentaciones', list); totalRecords += list.length; }
      }
      if (existingTabs.has('clientes')) {
        onProgress?.('Descargando clientes...', 40);
        const list = await readTableFromSheet<Cliente>(token, googleSheetsId, 'clientes');
        if (list.length > 0) { setClientes(list); saveStorage('clientes', list); totalRecords += list.length; }
      }
      if (existingTabs.has('proveedores')) {
        const list = await readTableFromSheet<Proveedor>(token, googleSheetsId, 'proveedores');
        if (list.length > 0) { setProveedores(list); saveStorage('proveedores', list); totalRecords += list.length; }
      }
      if (existingTabs.has('empleados')) {
        const list = await readTableFromSheet<Empleado>(token, googleSheetsId, 'empleados');
        if (list.length > 0) { setEmpleados(list); saveStorage('empleados', list); totalRecords += list.length; }
      }
      if (existingTabs.has('ventas')) {
        onProgress?.('Descargando ventas...', 60);
        const list = await readTableFromSheet<Venta>(token, googleSheetsId, 'ventas');
        if (list.length > 0) { setVentas(list); saveStorage('ventas', list); totalRecords += list.length; }
      }
      if (existingTabs.has('compras')) {
        const list = await readTableFromSheet<Compra>(token, googleSheetsId, 'compras');
        if (list.length > 0) { setCompras(list); saveStorage('compras', list); totalRecords += list.length; }
      }
      if (existingTabs.has('cajas')) {
        const list = await readTableFromSheet<Caja>(token, googleSheetsId, 'cajas');
        if (list.length > 0) { setCajas(list); saveStorage('cajas', list); totalRecords += list.length; }
      }
      if (existingTabs.has('movimientos_caja')) {
        const list = await readTableFromSheet<MovimientoCaja>(token, googleSheetsId, 'movimientos_caja');
        if (list.length > 0) { setMovimientosCaja(list); saveStorage('movimientosCaja', list); totalRecords += list.length; }
      }
      if (existingTabs.has('inventario_ajustes')) {
        const list = await readTableFromSheet<InventarioAjuste>(token, googleSheetsId, 'inventario_ajustes');
        if (list.length > 0) { setInventarioAjustes(list); saveStorage('inventarioAjustes', list); totalRecords += list.length; }
      }
      if (existingTabs.has('kardex')) {
        const list = await readTableFromSheet<KardexItem>(token, googleSheetsId, 'kardex');
        if (list.length > 0) { setKardex(list); saveStorage('kardex', list); totalRecords += list.length; }
      }
      if (existingTabs.has('empresas')) {
        const list = await readTableFromSheet<Empresa>(token, googleSheetsId, 'empresas');
        if (list.length > 0 && list[0]) { setEmpresa(list[0]); saveStorage('empresa', list[0]); totalRecords += 1; }
      }
      if (existingTabs.has('users')) {
        const list = await readTableFromSheet<User>(token, googleSheetsId, 'users');
        if (list.length > 0) { setUsers(list); saveStorage('users', list); totalRecords += list.length; }
      }
      if (existingTabs.has('roles')) {
        const list = await readTableFromSheet<Role>(token, googleSheetsId, 'roles');
        if (list.length > 0) { setRoles(list); saveStorage('roles', list); totalRecords += list.length; }
      }
      if (existingTabs.has('monedas')) {
        const list = await readTableFromSheet<Moneda>(token, googleSheetsId, 'monedas');
        if (list.length > 0) { setMonedas(list); saveStorage('monedas', list); totalRecords += list.length; }
      }
      if (existingTabs.has('documentos')) {
        const list = await readTableFromSheet<DocumentoTipo>(token, googleSheetsId, 'documentos');
        if (list.length > 0) { setDocumentos(list); saveStorage('documentos', list); totalRecords += list.length; }
      }
      if (existingTabs.has('comprobantes')) {
        const list = await readTableFromSheet<ComprobanteTipo>(token, googleSheetsId, 'comprobantes');
        if (list.length > 0) { setComprobantes(list); saveStorage('comprobantes', list); totalRecords += list.length; }
      }
      if (existingTabs.has('activity_logs')) {
        const list = await readTableFromSheet<ActivityLog>(token, googleSheetsId, 'activity_logs');
        if (list.length > 0) { setActivityLogs(list); saveStorage('activityLogs', list); totalRecords += list.length; }
      }
      if (existingTabs.has('notificaciones')) {
        const list = await readTableFromSheet<Notificacion>(token, googleSheetsId, 'notificaciones');
        if (list.length > 0) { setNotificaciones(list); saveStorage('notificaciones', list); totalRecords += list.length; }
      }

      setGoogleSheetsStatus('connected');
      const msg = `Se descargaron ${totalRecords} registros desde Google Sheets exitosamente.`;
      setGoogleSheetsMessage(msg);
      onProgress?.(msg, 100);
      return { success: true, count: totalRecords, message: msg };
    },
    [googleAccessToken, googleSheetsId, signInWithGoogleSheets]
  );

  const syncBidirectionalGoogleSheets = useCallback(
    async (
      onProgress?: (msg: string, percent: number) => void
    ): Promise<{ success: boolean; count: number; message: string }> => {
      let token = googleAccessToken || (await getGoogleAccessToken());
      if (!token) {
        const res = await signInWithGoogleSheets();
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error('Se requiere iniciar sesión con Google para sincronizar');
      }

      onProgress?.('Analizando contenido de la hoja de cálculo...', 15);
      const meta = await fetchSpreadsheetMetadata(token, googleSheetsId);
      const hasProductTab = meta.sheets.some((s) => s.title === 'productos');

      let remoteRowsCount = 0;
      if (hasProductTab) {
        const prodRows = await readTableFromSheet(token, googleSheetsId, 'productos');
        remoteRowsCount = prodRows.length;
      }

      if (remoteRowsCount > 0) {
        onProgress?.(`Se encontraron ${remoteRowsCount} productos en Google Sheets. Descargando catálogo...`, 30);
        return downloadAllFromGoogleSheets(onProgress);
      } else {
        onProgress?.('La hoja de cálculo está lista. Sembrando todas las 21 tablas iniciales...', 30);
        return uploadAllToGoogleSheets(onProgress);
      }
    },
    [googleAccessToken, googleSheetsId, signInWithGoogleSheets, downloadAllFromGoogleSheets, uploadAllToGoogleSheets]
  );

  const getTableDataByName = useCallback(
    (tableName: string): any[] => {
      switch (tableName) {
        case 'productos':
          return productos.length > 0 ? productos : initialProductos;
        case 'categorias':
          return categorias.length > 0 ? categorias : initialCategorias;
        case 'marcas':
          return marcas.length > 0 ? marcas : initialMarcas;
        case 'presentaciones':
          return presentaciones.length > 0 ? presentaciones : initialPresentaciones;
        case 'clientes':
          return clientes.length > 0 ? clientes : initialClientes;
        case 'proveedores':
          return proveedores.length > 0 ? proveedores : initialProveedores;
        case 'empleados':
          return empleados.length > 0 ? empleados : initialEmpleados;
        case 'ventas':
          return ventas.length > 0 ? ventas : initialVentas;
        case 'compras':
          return compras.length > 0 ? compras : initialCompras;
        case 'cajas':
          return cajas.length > 0 ? cajas : initialCajas;
        case 'movimientos_caja':
          return movimientosCaja.length > 0 ? movimientosCaja : initialMovimientosCaja;
        case 'inventario_ajustes':
          return inventarioAjustes.length > 0 ? inventarioAjustes : initialInventarioAjustes;
        case 'kardex':
          return kardex.length > 0 ? kardex : initialKardex;
        case 'empresas':
          return [empresa || initialEmpresa];
        case 'users':
          return users.length > 0 ? users : initialUsers;
        case 'roles':
          return roles.length > 0 ? roles : initialRoles;
        case 'monedas':
          return monedas.length > 0 ? monedas : initialMonedas;
        case 'documentos':
          return documentos.length > 0 ? documentos : initialDocumentos;
        case 'comprobantes':
          return comprobantes.length > 0 ? comprobantes : initialComprobantes;
        case 'activity_logs':
          return activityLogs.length > 0 ? activityLogs : initialActivityLogs;
        case 'notificaciones':
          return notificaciones.length > 0 ? notificaciones : initialNotificaciones;
        default:
          return [];
      }
    },
    [
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
    ]
  );

  const uploadSingleTableToGoogleSheets = useCallback(
    async (
      tableName: string,
      data?: any[],
      onProgress?: (msg: string, percent: number) => void
    ): Promise<{ success: boolean; count: number; message: string }> => {
      let token = googleAccessToken || (await getGoogleAccessToken());
      if (!token) {
        const res = await signInWithGoogleSheets();
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error('Se requiere iniciar sesión con Google para acceder a Google Sheets');
      }

      onProgress?.(`Verificando pestaña "${tableName}" en Google Sheets...`, 20);
      const meta = await fetchSpreadsheetMetadata(token, googleSheetsId);
      const existingTabNames = meta.sheets.map((s) => s.title);
      await ensureSheetTabsExist(token, googleSheetsId, [tableName], existingTabNames);

      const tableData = data ?? getTableDataByName(tableName);
      onProgress?.(`Escribiendo ${tableData.length} registros en "${tableName}"...`, 60);
      await writeTableToSheet(token, googleSheetsId, tableName, tableData);

      const msg = `Pestaña "${tableName}" generada y actualizada con éxito (${tableData.length} registros).`;
      onProgress?.(msg, 100);
      return { success: true, count: tableData.length, message: msg };
    },
    [googleAccessToken, googleSheetsId, signInWithGoogleSheets, getTableDataByName]
  );

  const exportAllToExcel = useCallback(() => {
    const allTables = [
      { name: 'productos', label: 'Productos y Artículos', data: productos.length > 0 ? productos : initialProductos },
      { name: 'categorias', label: 'Categorías', data: categorias.length > 0 ? categorias : initialCategorias },
      { name: 'marcas', label: 'Marcas Comerciales', data: marcas.length > 0 ? marcas : initialMarcas },
      { name: 'presentaciones', label: 'Presentaciones / Unidades', data: presentaciones.length > 0 ? presentaciones : initialPresentaciones },
      { name: 'clientes', label: 'Clientes Registrados', data: clientes.length > 0 ? clientes : initialClientes },
      { name: 'proveedores', label: 'Proveedores Comerciales', data: proveedores.length > 0 ? proveedores : initialProveedores },
      { name: 'empleados', label: 'Personal y Empleados', data: empleados.length > 0 ? empleados : initialEmpleados },
      { name: 'ventas', label: 'Ventas y Facturación', data: ventas.length > 0 ? ventas : initialVentas },
      { name: 'compras', label: 'Compras a Proveedores', data: compras.length > 0 ? compras : initialCompras },
      { name: 'cajas', label: 'Sesiones de Caja', data: cajas.length > 0 ? cajas : initialCajas },
      { name: 'movimientos_caja', label: 'Movimientos de Caja', data: movimientosCaja.length > 0 ? movimientosCaja : initialMovimientosCaja },
      { name: 'inventario_ajustes', label: 'Ajustes de Inventario', data: inventarioAjustes.length > 0 ? inventarioAjustes : initialInventarioAjustes },
      { name: 'kardex', label: 'Kardex Valorizado', data: kardex.length > 0 ? kardex : initialKardex },
      { name: 'empresas', label: 'Datos de la Empresa', data: [empresa || initialEmpresa] },
      { name: 'users', label: 'Usuarios del Sistema', data: users.length > 0 ? users : initialUsers },
      { name: 'roles', label: 'Roles y Permisos', data: roles.length > 0 ? roles : initialRoles },
      { name: 'monedas', label: 'Monedas y Divisas', data: monedas.length > 0 ? monedas : initialMonedas },
      { name: 'documentos', label: 'Tipos de Documentos', data: documentos.length > 0 ? documentos : initialDocumentos },
      { name: 'comprobantes', label: 'Series de Comprobantes', data: comprobantes.length > 0 ? comprobantes : initialComprobantes },
      { name: 'activity_logs', label: 'Logs de Auditoría', data: activityLogs.length > 0 ? activityLogs : initialActivityLogs },
      { name: 'notificaciones', label: 'Notificaciones del Sistema', data: notificaciones.length > 0 ? notificaciones : initialNotificaciones },
    ];
    exportAllTablesToExcel(allTables, `Imperio_Lux_BaseDatos_Completa_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [
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
  ]);

  const exportTableToExcel = useCallback(
    (tableName: string) => {
      const data = getTableDataByName(tableName);
      exportSingleTableToExcel(tableName, data);
    },
    [getTableDataByName]
  );

  const downloadGoogleSheetsExcel = useCallback(() => {
    downloadGoogleSheetsLiveExcel(googleSheetsId);
  }, [googleSheetsId]);

  const activeCaja = cajas.find((c) => c.estado === 'Abierta') || null;

  const logActivity = (accion: string, modulo: string, descripcion: string) => {
    const newLog: ActivityLog = {
      id: Date.now(),
      accion,
      modulo,
      descripcion,
      user_name: currentUser ? currentUser.name : 'Sistema',
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const updateEmpresa = (partial: Partial<Empresa>) => {
    const updated = { ...empresa, ...partial };
    setEmpresa(updated);
    logActivity('Actualización', 'Empresa', 'Datos generales de Imperio Lux actualizados');
  };

  // Categorías
  const addCategoria = (cat: Omit<Categoria, 'id'>) => {
    const newId = categorias.length > 0 ? Math.max(...categorias.map((c) => c.id)) + 1 : 1;
    const item: Categoria = { ...cat, id: newId };
    setCategorias((prev) => [...prev, item]);
    logActivity('Creación', 'Categorías', `Categoría "${cat.nombre}" creada`);
  };

  const updateCategoria = (id: number, cat: Partial<Categoria>) => {
    setCategorias((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...cat };
          return updated;
        }
        return c;
      })
    );
    logActivity('Edición', 'Categorías', `Categoría #${id} actualizada`);
  };

  const deleteCategoria = (id: number) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    logActivity('Eliminación', 'Categorías', `Categoría #${id} eliminada`);
  };

  // Presentaciones
  const addPresentacion = (pres: Omit<Presentacion, 'id'>) => {
    const newId = presentaciones.length > 0 ? Math.max(...presentaciones.map((p) => p.id)) + 1 : 1;
    const item: Presentacion = { ...pres, id: newId };
    setPresentaciones((prev) => [...prev, item]);
    logActivity('Creación', 'Presentaciones', `Presentación "${pres.nombre}" creada`);
  };

  const updatePresentacion = (id: number, pres: Partial<Presentacion>) => {
    setPresentaciones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...pres };
          return updated;
        }
        return p;
      })
    );
    logActivity('Edición', 'Presentaciones', `Presentación #${id} actualizada`);
  };

  const deletePresentacion = (id: number) => {
    setPresentaciones((prev) => prev.filter((p) => p.id !== id));
    logActivity('Eliminación', 'Presentaciones', `Presentación #${id} eliminada`);
  };

  // Marcas
  const addMarca = (m: Omit<Marca, 'id'>) => {
    const newId = marcas.length > 0 ? Math.max(...marcas.map((item) => item.id)) + 1 : 1;
    const item: Marca = { ...m, id: newId };
    setMarcas((prev) => [...prev, item]);
    logActivity('Creación', 'Marcas', `Marca "${m.nombre}" creada`);
  };

  const updateMarca = (id: number, m: Partial<Marca>) => {
    setMarcas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...m };
          return updated;
        }
        return item;
      })
    );
    logActivity('Edición', 'Marcas', `Marca #${id} actualizada`);
  };

  const deleteMarca = (id: number) => {
    setMarcas((prev) => prev.filter((item) => item.id !== id));
    logActivity('Eliminación', 'Marcas', `Marca #${id} eliminada`);
  };

  // Productos
  const addProducto = (prod: Omit<Producto, 'id'>) => {
    const newId = productos.length > 0 ? Math.max(...productos.map((p) => p.id)) + 1 : 1;
    const item: Producto = { ...prod, id: newId };
    setProductos((prev) => [...prev, item]);

    // Kardex initial stock
    if (prod.cantidad > 0) {
      const kardexEntry: KardexItem = {
        id: Date.now(),
        producto_id: newId,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        tipo_movimiento: 'Ajuste Entrada',
        documento_ref: 'STOCK-INICIAL',
        entrada_cantidad: prod.cantidad,
        entrada_costo: prod.precio_compra,
        entrada_total: prod.cantidad * prod.precio_compra,
        salida_cantidad: 0,
        salida_costo: 0,
        salida_total: 0,
        saldo_cantidad: prod.cantidad,
        saldo_costo: prod.precio_compra,
        saldo_total: prod.cantidad * prod.precio_compra,
      };
      setKardex((prev) => [kardexEntry, ...prev]);
    }
    logActivity('Creación', 'Productos', `Producto "${prod.nombre}" registrado`);
  };

  const updateProducto = (id: number, prod: Partial<Producto>) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...prod };
          return updated;
        }
        return p;
      })
    );
    logActivity('Edición', 'Productos', `Producto #${id} actualizado`);
  };

  const deleteProducto = (id: number) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    logActivity('Eliminación', 'Productos', `Producto #${id} eliminado`);
  };

  // Clientes
  const addCliente = (c: Omit<Cliente, 'id'>): Cliente => {
    const newId = clientes.length > 0 ? Math.max(...clientes.map((item) => item.id)) + 1 : 1;
    const item: Cliente = { ...c, id: newId };
    setClientes((prev) => [...prev, item]);
    logActivity('Creación', 'Clientes', `Cliente "${c.razon_social}" registrado`);
    return item;
  };

  const updateCliente = (id: number, c: Partial<Cliente>) => {
    setClientes((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...c };
          return updated;
        }
        return item;
      })
    );
    logActivity('Edición', 'Clientes', `Cliente #${id} actualizado`);
  };

  const deleteCliente = (id: number) => {
    setClientes((prev) => prev.filter((item) => item.id !== id));
    logActivity('Eliminación', 'Clientes', `Cliente #${id} eliminado`);
  };

  // Proveedores
  const addProveedor = (p: Omit<Proveedor, 'id'>) => {
    const newId = proveedores.length > 0 ? Math.max(...proveedores.map((item) => item.id)) + 1 : 1;
    const item: Proveedor = { ...p, id: newId };
    setProveedores((prev) => [...prev, item]);
    logActivity('Creación', 'Proveedores', `Proveedor "${p.razon_social}" registrado`);
  };

  const updateProveedor = (id: number, p: Partial<Proveedor>) => {
    setProveedores((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...p };
          return updated;
        }
        return item;
      })
    );
    logActivity('Edición', 'Proveedores', `Proveedor #${id} actualizado`);
  };

  const deleteProveedor = (id: number) => {
    setProveedores((prev) => prev.filter((item) => item.id !== id));
    logActivity('Eliminación', 'Proveedores', `Proveedor #${id} eliminado`);
  };

  // Ventas (POS)
  const addVenta = (ventaData: Omit<Venta, 'id' | 'numero_comprobante'>): Venta => {
    const newId = ventas.length > 0 ? Math.max(...ventas.map((v) => v.id)) + 1 : 1;
    const comprobante = comprobantes.find((c) => c.id === ventaData.comprobante_id);
    const serie = comprobante ? comprobante.serie_default : 'B001';
    const correlativo = String(newId).padStart(6, '0');
    const numero_comprobante = `${serie}-${correlativo}`;

    const newVenta: Venta = {
      ...ventaData,
      id: newId,
      numero_comprobante,
      caja_id: activeCaja ? activeCaja.id : undefined,
    };

    // Descontar inventario y registrar en Kardex
    setProductos((prev) =>
      prev.map((prod) => {
        const itemInVenta = ventaData.items.find((it) => it.producto_id === prod.id);
        if (itemInVenta) {
          const nuevaCantidad = Math.max(0, prod.cantidad - itemInVenta.cantidad);
          const updated = { ...prod, cantidad: nuevaCantidad };
          return updated;
        }
        return prod;
      })
    );

    // Kardex entries
    const kardexEntries: KardexItem[] = ventaData.items.map((it) => {
      const prod = productos.find((p) => p.id === it.producto_id);
      const stockAnterior = prod ? prod.cantidad : 0;
      const costoUnit = prod ? prod.precio_compra : 0;
      const nuevoStock = Math.max(0, stockAnterior - it.cantidad);
      return {
        id: Date.now() + Math.random(),
        producto_id: it.producto_id,
        fecha: ventaData.fecha_hora,
        tipo_movimiento: 'Venta',
        documento_ref: numero_comprobante,
        entrada_cantidad: 0,
        entrada_costo: 0,
        entrada_total: 0,
        salida_cantidad: it.cantidad,
        salida_costo: costoUnit,
        salida_total: it.cantidad * costoUnit,
        saldo_cantidad: nuevoStock,
        saldo_costo: costoUnit,
        saldo_total: nuevoStock * costoUnit,
      };
    });

    setKardex((prev) => [...kardexEntries, ...prev]);

    // Update active caja if cash or recorded
    if (activeCaja) {
      setCajas((prev) =>
        prev.map((c) => {
          if (c.id === activeCaja.id) {
            const updated = {
              ...c,
              ingresos_ventas: c.ingresos_ventas + newVenta.total,
              saldo_estimado: c.saldo_estimado + newVenta.total,
            };
            return updated;
          }
          return c;
        })
      );
    }

    setVentas((prev) => [newVenta, ...prev]);

    logActivity('Venta', 'Ventas', `Comprobante ${numero_comprobante} emitido por ${currentMoneda.simbolo} ${newVenta.total.toFixed(2)}`);
    return newVenta;
  };

  const anularVenta = (id: number) => {
    const venta = ventas.find((v) => v.id === id);
    if (!venta || venta.estado === 'Anulada') return;

    // Reponer stock
    setProductos((prev) =>
      prev.map((prod) => {
        const itemInVenta = venta.items.find((it) => it.producto_id === prod.id);
        if (itemInVenta) {
          const nuevaCantidad = prod.cantidad + itemInVenta.cantidad;
          const updated = { ...prod, cantidad: nuevaCantidad };
          return updated;
        }
        return prod;
      })
    );

    // Add reversal entries in Kardex
    const kardexReversals: KardexItem[] = venta.items.map((it) => {
      const prod = productos.find((p) => p.id === it.producto_id);
      const stockAnterior = prod ? prod.cantidad : 0;
      const costoUnit = prod ? prod.precio_compra : 0;
      const nuevoStock = stockAnterior + it.cantidad;
      return {
        id: Date.now() + Math.random(),
        producto_id: it.producto_id,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        tipo_movimiento: 'Ajuste Entrada',
        documento_ref: `ANULACIÓN-${venta.numero_comprobante}`,
        entrada_cantidad: it.cantidad,
        entrada_costo: costoUnit,
        entrada_total: it.cantidad * costoUnit,
        salida_cantidad: 0,
        salida_costo: 0,
        salida_total: 0,
        saldo_cantidad: nuevoStock,
        saldo_costo: costoUnit,
        saldo_total: nuevoStock * costoUnit,
      };
    });

    setKardex((prev) => [...kardexReversals, ...prev]);

    // Update active caja
    if (venta.caja_id) {
      setCajas((prev) =>
        prev.map((c) => {
          if (c.id === venta.caja_id) {
            const updated = {
              ...c,
              ingresos_ventas: Math.max(0, c.ingresos_ventas - venta.total),
              saldo_estimado: Math.max(0, c.saldo_estimado - venta.total),
            };
            return updated;
          }
          return c;
        })
      );
    }

    setVentas((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, estado: 'Anulada' as const };
          return updated;
        }
        return v;
      })
    );

    logActivity('Anulación', 'Ventas', `Comprobante ${venta.numero_comprobante} anulado`);
  };

  // Compras
  const addCompra = (compraData: Omit<Compra, 'id'>) => {
    const newId = compras.length > 0 ? Math.max(...compras.map((c) => c.id)) + 1 : 1;
    const newCompra: Compra = { ...compraData, id: newId };

    // Increase product stock & update suggested price if specified
    setProductos((prev) =>
      prev.map((prod) => {
        const itemInCompra = compraData.items.find((it) => it.producto_id === prod.id);
        if (itemInCompra) {
          const nuevaCantidad = prod.cantidad + itemInCompra.cantidad;
          const updated = {
            ...prod,
            cantidad: nuevaCantidad,
            precio_compra: itemInCompra.precio_compra > 0 ? itemInCompra.precio_compra : prod.precio_compra,
            precio_venta: itemInCompra.precio_venta_sugerido > 0 ? itemInCompra.precio_venta_sugerido : prod.precio_venta,
          };
          return updated;
        }
        return prod;
      })
    );

    // Kardex entries
    const kardexEntries: KardexItem[] = compraData.items.map((it) => {
      const prod = productos.find((p) => p.id === it.producto_id);
      const stockAnterior = prod ? prod.cantidad : 0;
      const nuevoStock = stockAnterior + it.cantidad;
      return {
        id: Date.now() + Math.random(),
        producto_id: it.producto_id,
        fecha: compraData.fecha_hora,
        tipo_movimiento: 'Compra',
        documento_ref: compraData.numero_comprobante,
        entrada_cantidad: it.cantidad,
        entrada_costo: it.precio_compra,
        entrada_total: it.cantidad * it.precio_compra,
        salida_cantidad: 0,
        salida_costo: 0,
        salida_total: 0,
        saldo_cantidad: nuevoStock,
        saldo_costo: it.precio_compra,
        saldo_total: nuevoStock * it.precio_compra,
      };
    });

    setKardex((prev) => [...kardexEntries, ...prev]);

    setCompras((prev) => [newCompra, ...prev]);

    logActivity('Compra', 'Compras', `Compra ${compraData.numero_comprobante} registrada por ${currentMoneda.simbolo} ${newCompra.total.toFixed(2)}`);
  };

  // Cajas
  const openCaja = (nombre: string, montoInicial: number) => {
    const newId = cajas.length > 0 ? Math.max(...cajas.map((c) => c.id)) + 1 : 1;
    const nuevaCaja: Caja = {
      id: newId,
      nombre,
      user_id: currentUser ? currentUser.id : 1,
      fecha_apertura: new Date().toISOString().replace('T', ' ').substring(0, 19),
      monto_inicial: montoInicial,
      ingresos_ventas: 0,
      ingresos_movimientos: 0,
      egresos_movimientos: 0,
      saldo_estimado: montoInicial,
      estado: 'Abierta',
    };

    setCajas((prev) => [nuevaCaja, ...prev]);
    logActivity('Apertura', 'Cajas', `Caja "${nombre}" abierta con ${currentMoneda.simbolo} ${montoInicial.toFixed(2)}`);
  };

  const closeCaja = (id: number, montoFinal: number) => {
    setCajas((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const diff = montoFinal - c.saldo_estimado;
          const updated: Caja = {
            ...c,
            estado: 'Cerrada',
            fecha_cierre: new Date().toISOString().replace('T', ' ').substring(0, 19),
            monto_final: montoFinal,
            diferencia: diff,
          };
          return updated;
        }
        return c;
      })
    );
    logActivity('Cierre', 'Cajas', `Caja #${id} cerrada con monto de arqueo ${currentMoneda.simbolo} ${montoFinal.toFixed(2)}`);
  };

  const addMovimientoCaja = (tipo: 'Ingreso' | 'Egreso', concepto: string, monto: number) => {
    if (!activeCaja) return;
    const newId = movimientosCaja.length > 0 ? Math.max(...movimientosCaja.map((m) => m.id)) + 1 : 1;
    const nuevoMovimiento: MovimientoCaja = {
      id: newId,
      caja_id: activeCaja.id,
      tipo,
      concepto,
      monto,
      fecha_hora: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_id: currentUser ? currentUser.id : 1,
    };

    setMovimientosCaja((prev) => [nuevoMovimiento, ...prev]);

    setCajas((prev) =>
      prev.map((c) => {
        if (c.id === activeCaja.id) {
          const nuevoIngreso = tipo === 'Ingreso' ? c.ingresos_movimientos + monto : c.ingresos_movimientos;
          const nuevoEgreso = tipo === 'Egreso' ? c.egresos_movimientos + monto : c.egresos_movimientos;
          const delta = tipo === 'Ingreso' ? monto : -monto;
          const updated = {
            ...c,
            ingresos_movimientos: nuevoIngreso,
            egresos_movimientos: nuevoEgreso,
            saldo_estimado: c.saldo_estimado + delta,
          };
          return updated;
        }
        return c;
      })
    );

    logActivity('Movimiento', 'Cajas', `${tipo} de ${currentMoneda.simbolo} ${monto.toFixed(2)}: ${concepto}`);
  };

  // Inventario Ajustes
  const addInventarioAjuste = (productoId: number, tipo: 'Entrada' | 'Salida', cantidad: number, motivo: string) => {
    const newId = inventarioAjustes.length > 0 ? Math.max(...inventarioAjustes.map((a) => a.id)) + 1 : 1;
    const ajuste: InventarioAjuste = {
      id: newId,
      producto_id: productoId,
      tipo,
      cantidad,
      motivo,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_id: currentUser ? currentUser.id : 1,
    };

    setInventarioAjustes((prev) => [ajuste, ...prev]);

    // Update product stock
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === productoId) {
          const nuevaCant = tipo === 'Entrada' ? p.cantidad + cantidad : Math.max(0, p.cantidad - cantidad);
          const updated = { ...p, cantidad: nuevaCant };
          return updated;
        }
        return p;
      })
    );

    // Kardex
    const prod = productos.find((p) => p.id === productoId);
    if (prod) {
      const stockAnterior = prod.cantidad;
      const nuevoStock = tipo === 'Entrada' ? stockAnterior + cantidad : Math.max(0, stockAnterior - cantidad);
      const costo = prod.precio_compra;
      const kardexEntry: KardexItem = {
        id: Date.now(),
        producto_id: productoId,
        fecha: ajuste.fecha,
        tipo_movimiento: tipo === 'Entrada' ? 'Ajuste Entrada' : 'Ajuste Salida',
        documento_ref: `AJUSTE-#${newId}`,
        entrada_cantidad: tipo === 'Entrada' ? cantidad : 0,
        entrada_costo: tipo === 'Entrada' ? costo : 0,
        entrada_total: tipo === 'Entrada' ? cantidad * costo : 0,
        salida_cantidad: tipo === 'Salida' ? cantidad : 0,
        salida_costo: tipo === 'Salida' ? costo : 0,
        salida_total: tipo === 'Salida' ? cantidad * costo : 0,
        saldo_cantidad: nuevoStock,
        saldo_costo: costo,
        saldo_total: nuevoStock * costo,
      };
      setKardex((prev) => [kardexEntry, ...prev]);
    }

    logActivity('Ajuste', 'Inventario', `Ajuste ${tipo} de ${cantidad} unid. (${motivo})`);
  };

  // Empleados
  const addEmpleado = (emp: Omit<Empleado, 'id'>) => {
    const newId = empleados.length > 0 ? Math.max(...empleados.map((e) => e.id)) + 1 : 1;
    const nuevo = { ...emp, id: newId };
    setEmpleados((prev) => [...prev, nuevo]);
    logActivity('Creación', 'Empleados', `Empleado "${emp.nombre} ${emp.apellido}" registrado`);
  };

  const updateEmpleado = (id: number, emp: Partial<Empleado>) => {
    setEmpleados((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...emp };
          return updated;
        }
        return e;
      })
    );
    logActivity('Edición', 'Empleados', `Empleado #${id} actualizado`);
  };

  const deleteEmpleado = (id: number) => {
    setEmpleados((prev) => prev.filter((e) => e.id !== id));
    logActivity('Eliminación', 'Empleados', `Empleado #${id} eliminado`);
  };

  const markNotificationsAsRead = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const resetAllDataToDefaults = async () => {
    localStorage.clear();
    setEmpresa(initialEmpresa);
    setCategorias(initialCategorias);
    setPresentaciones(initialPresentaciones);
    setMarcas(initialMarcas);
    setProductos(initialProductos);
    setClientes(initialClientes);
    setProveedores(initialProveedores);
    setVentas(initialVentas);
    setCompras(initialCompras);
    setCajas(initialCajas);
    setMovimientosCaja(initialMovimientosCaja);
    setInventarioAjustes(initialInventarioAjustes);
    setKardex(initialKardex);
    setEmpleados(initialEmpleados);
    setActivityLogs(initialActivityLogs);
    setNotificaciones(initialNotificaciones);
    setActiveTab('panel');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        sidebarOpen,
        setSidebarOpen,

        theme,
        setTheme,
        toggleTheme,

        activeDatabaseEngine,
        setActiveDatabaseEngine,

        // Google Sheets
        googleUser,
        googleAccessToken,
        googleSheetsId,
        setGoogleSheetsId,
        googleSheetsStatus,
        googleSheetsMessage,
        signInWithGoogleSheets,
        signOutGoogleSheets,
        uploadAllToGoogleSheets,
        uploadSingleTableToGoogleSheets,
        downloadAllFromGoogleSheets,
        syncBidirectionalGoogleSheets,
        exportAllToExcel,
        exportTableToExcel,
        downloadGoogleSheetsExcel,
        showGoogleSheetsModal,
        setShowGoogleSheetsModal,

        empresa,
        updateEmpresa,
        monedas,
        currentMoneda,
        documentos,
        comprobantes,
        categorias,
        addCategoria,
        updateCategoria,
        deleteCategoria,
        presentaciones,
        addPresentacion,
        updatePresentacion,
        deletePresentacion,
        marcas,
        addMarca,
        updateMarca,
        deleteMarca,
        productos,
        addProducto,
        updateProducto,
        deleteProducto,
        clientes,
        addCliente,
        updateCliente,
        deleteCliente,
        proveedores,
        addProveedor,
        updateProveedor,
        deleteProveedor,
        ventas,
        addVenta,
        anularVenta,
        compras,
        addCompra,
        cajas,
        activeCaja,
        openCaja,
        closeCaja,
        movimientosCaja,
        addMovimientoCaja,
        inventarioAjustes,
        addInventarioAjuste,
        kardex,
        empleados,
        addEmpleado,
        updateEmpleado,
        deleteEmpleado,
        users,
        roles,
        activityLogs,
        notificaciones,
        markNotificationsAsRead,
        activeComprobanteVenta,
        setActiveComprobanteVenta,
        resetAllDataToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
