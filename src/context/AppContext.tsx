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
  testFirestoreConnection,
  saveDocument,
  deleteDocument,
  fetchCollection,
  batchSaveCollection,
  subscribeFirebaseStatus,
  subscribeToCollection,
  FirebaseSyncStatus,
  firebaseConfig,
  getActiveFirebaseConfig,
  switchFirebaseProject,
  resetToDefaultFirebase,
  FirebaseConfigObject,
} from '../lib/firebase';

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

  // Firebase
  firebaseStatus: FirebaseSyncStatus;
  firebaseMessage: string;
  firebaseProjectId: string;
  firebaseDatabaseId: string;
  activeFirebaseConfig: FirebaseConfigObject;
  switchFirebaseProject: (newConfig: FirebaseConfigObject) => Promise<boolean>;
  resetToDefaultFirebase: () => Promise<boolean>;
  syncNowWithFirebase: () => Promise<void>;
  seedFirebaseDatabase: () => Promise<void>;
  showFirebaseModal: boolean;
  setShowFirebaseModal: (show: boolean) => void;

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
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncStatus>('connecting');
  const [firebaseMessage, setFirebaseMessage] = useState<string>('Iniciando Firebase...');
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [activeConfig, setActiveConfig] = useState<FirebaseConfigObject>(() => getActiveFirebaseConfig());

  const handleSwitchFirebaseProject = async (newConfig: FirebaseConfigObject) => {
    const ok = await switchFirebaseProject(newConfig);
    if (ok) {
      setActiveConfig(newConfig);
      await syncNowWithFirebase();
    }
    return ok;
  };

  const handleResetFirebase = async () => {
    const ok = await resetToDefaultFirebase();
    if (ok) {
      setActiveConfig(getActiveFirebaseConfig());
      await syncNowWithFirebase();
    }
    return ok;
  };

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
  const [monedas] = useState<Moneda[]>(initialMonedas);
  const currentMoneda = monedas.find((m) => m.id === empresa.moneda_id) || monedas[0];
  const [documentos] = useState<DocumentoTipo[]>(initialDocumentos);
  const [comprobantes] = useState<ComprobanteTipo[]>(initialComprobantes);

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
  const [users] = useState<User[]>(initialUsers);
  const [roles] = useState<Role[]>(initialRoles);
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
  useEffect(() => saveStorage('activityLogs', activityLogs), [activityLogs]);
  useEffect(() => saveStorage('notificaciones', notificaciones), [notificaciones]);

  // Listen to Firebase status
  useEffect(() => {
    const unsub = subscribeFirebaseStatus((status, msg) => {
      setFirebaseStatus(status);
      if (msg) setFirebaseMessage(msg);
    });
    return unsub;
  }, []);

  // Initialize and seed Firebase on first load with all 21 database tables
  const seedFirebaseDatabase = useCallback(async () => {
    try {
      setFirebaseStatus('syncing');
      setFirebaseMessage('Poblando todas las tablas en Firebase Firestore...');
      await saveDocument('empresas', 1, initialEmpresa);
      await batchSaveCollection('categorias', initialCategorias);
      await batchSaveCollection('presentaciones', initialPresentaciones);
      await batchSaveCollection('marcas', initialMarcas);
      await batchSaveCollection('productos', initialProductos);
      await batchSaveCollection('clientes', initialClientes);
      await batchSaveCollection('proveedores', initialProveedores);
      await batchSaveCollection('empleados', initialEmpleados);
      await batchSaveCollection('cajas', initialCajas);
      await batchSaveCollection('movimientos_caja', initialMovimientosCaja);
      await batchSaveCollection('ventas', initialVentas);
      await batchSaveCollection('compras', initialCompras);
      await batchSaveCollection('inventario_ajustes', initialInventarioAjustes);
      await batchSaveCollection('kardex', initialKardex);
      await batchSaveCollection('users', initialUsers);
      await batchSaveCollection('roles', initialRoles);
      await batchSaveCollection('monedas', initialMonedas);
      await batchSaveCollection('documentos', initialDocumentos);
      await batchSaveCollection('comprobantes', initialComprobantes);
      await batchSaveCollection('activity_logs', initialActivityLogs);
      await batchSaveCollection('notificaciones', initialNotificaciones);
      setFirebaseStatus('connected');
      setFirebaseMessage('Todas las tablas pobladas exitosamente en Firebase');
    } catch (e) {
      console.error('Error seeding Firebase:', e);
      setFirebaseStatus('error');
      setFirebaseMessage('Error al sincronizar con Firebase');
    }
  }, []);

  const syncNowWithFirebase = useCallback(async () => {
    setFirebaseStatus('syncing');
    setFirebaseMessage('Sincronizando todas las tablas con Firestore...');
    try {
      const isOnline = await testFirestoreConnection();
      if (!isOnline) {
        setFirebaseStatus('offline');
        setFirebaseMessage('Modo offline: operando con datos locales de Imperio Lux');
        return;
      }

      // Check if products exist in Firestore
      const firestoreProducts = await fetchCollection<Producto>('productos');
      if (firestoreProducts && firestoreProducts.length > 0) {
        // Hydrate from Firestore
        setProductos(firestoreProducts);
        const [
          cats,
          marcasList,
          presList,
          clientesList,
          provsList,
          empleadosList,
          ventasList,
          comprasList,
          cajasList,
          movimientosList,
          ajustesList,
          kardexList,
          empList,
          logsList,
          notifsList,
        ] = await Promise.all([
          fetchCollection<Categoria>('categorias'),
          fetchCollection<Marca>('marcas'),
          fetchCollection<Presentacion>('presentaciones'),
          fetchCollection<Cliente>('clientes'),
          fetchCollection<Proveedor>('proveedores'),
          fetchCollection<Empleado>('empleados'),
          fetchCollection<Venta>('ventas'),
          fetchCollection<Compra>('compras'),
          fetchCollection<Caja>('cajas'),
          fetchCollection<MovimientoCaja>('movimientos_caja'),
          fetchCollection<InventarioAjuste>('inventario_ajustes'),
          fetchCollection<KardexItem>('kardex'),
          fetchCollection<Empresa>('empresas'),
          fetchCollection<ActivityLog>('activity_logs'),
          fetchCollection<Notificacion>('notificaciones'),
        ]);

        if (cats.length) setCategorias(cats);
        if (marcasList.length) setMarcas(marcasList);
        if (presList.length) setPresentaciones(presList);
        if (clientesList.length) setClientes(clientesList);
        if (provsList.length) setProveedores(provsList);
        if (empleadosList.length) setEmpleados(empleadosList);
        if (ventasList.length) setVentas(ventasList);
        if (comprasList.length) setCompras(comprasList);
        if (cajasList.length) setCajas(cajasList);
        if (movimientosList.length) setMovimientosCaja(movimientosList);
        if (ajustesList.length) setInventarioAjustes(ajustesList);
        if (kardexList.length) setKardex(kardexList);
        if (empList.length && empList[0]) setEmpresa(empList[0]);
        if (logsList.length) setActivityLogs(logsList);
        if (notifsList.length) setNotificaciones(notifsList);

        setFirebaseStatus('connected');
        setFirebaseMessage('Todas las tablas sincronizadas desde Firebase Firestore');
      } else {
        // First run on empty Firestore -> seed with complete luxury dataset
        await seedFirebaseDatabase();
      }
    } catch (err: any) {
      console.warn('Notice during syncNowWithFirebase:', err?.message || err);
      setFirebaseStatus('offline');
      setFirebaseMessage('Operando en modo local (sin conexión con Firestore)');
    }
  }, [seedFirebaseDatabase]);

  // Connect and sync on boot, and manage network transitions
  useEffect(() => {
    syncNowWithFirebase();

    const handleOnline = () => {
      syncNowWithFirebase();
    };
    const handleOffline = () => {
      setFirebaseStatus('offline');
      setFirebaseMessage('Dispositivo fuera de línea: operando localmente');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNowWithFirebase]);

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
    saveDocument('activity_logs', newLog.id, newLog).catch(() => {});
  };

  const updateEmpresa = (partial: Partial<Empresa>) => {
    const updated = { ...empresa, ...partial };
    setEmpresa(updated);
    saveDocument('empresas', 1, updated).catch(() => {});
    logActivity('Actualización', 'Empresa', 'Datos generales de Imperio Lux actualizados');
  };

  // Categorías
  const addCategoria = (cat: Omit<Categoria, 'id'>) => {
    const newId = categorias.length > 0 ? Math.max(...categorias.map((c) => c.id)) + 1 : 1;
    const item: Categoria = { ...cat, id: newId };
    setCategorias((prev) => [...prev, item]);
    saveDocument('categorias', newId, item).catch(() => {});
    logActivity('Creación', 'Categorías', `Categoría "${cat.nombre}" creada`);
  };

  const updateCategoria = (id: number, cat: Partial<Categoria>) => {
    setCategorias((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...cat };
          saveDocument('categorias', id, updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
    logActivity('Edición', 'Categorías', `Categoría #${id} actualizada`);
  };

  const deleteCategoria = (id: number) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    deleteDocument('categorias', id).catch(() => {});
    logActivity('Eliminación', 'Categorías', `Categoría #${id} eliminada`);
  };

  // Presentaciones
  const addPresentacion = (pres: Omit<Presentacion, 'id'>) => {
    const newId = presentaciones.length > 0 ? Math.max(...presentaciones.map((p) => p.id)) + 1 : 1;
    const item: Presentacion = { ...pres, id: newId };
    setPresentaciones((prev) => [...prev, item]);
    saveDocument('presentaciones', newId, item).catch(() => {});
    logActivity('Creación', 'Presentaciones', `Presentación "${pres.nombre}" creada`);
  };

  const updatePresentacion = (id: number, pres: Partial<Presentacion>) => {
    setPresentaciones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...pres };
          saveDocument('presentaciones', id, updated).catch(() => {});
          return updated;
        }
        return p;
      })
    );
    logActivity('Edición', 'Presentaciones', `Presentación #${id} actualizada`);
  };

  const deletePresentacion = (id: number) => {
    setPresentaciones((prev) => prev.filter((p) => p.id !== id));
    deleteDocument('presentaciones', id).catch(() => {});
    logActivity('Eliminación', 'Presentaciones', `Presentación #${id} eliminada`);
  };

  // Marcas
  const addMarca = (m: Omit<Marca, 'id'>) => {
    const newId = marcas.length > 0 ? Math.max(...marcas.map((item) => item.id)) + 1 : 1;
    const item: Marca = { ...m, id: newId };
    setMarcas((prev) => [...prev, item]);
    saveDocument('marcas', newId, item).catch(() => {});
    logActivity('Creación', 'Marcas', `Marca "${m.nombre}" creada`);
  };

  const updateMarca = (id: number, m: Partial<Marca>) => {
    setMarcas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...m };
          saveDocument('marcas', id, updated).catch(() => {});
          return updated;
        }
        return item;
      })
    );
    logActivity('Edición', 'Marcas', `Marca #${id} actualizada`);
  };

  const deleteMarca = (id: number) => {
    setMarcas((prev) => prev.filter((item) => item.id !== id));
    deleteDocument('marcas', id).catch(() => {});
    logActivity('Eliminación', 'Marcas', `Marca #${id} eliminada`);
  };

  // Productos
  const addProducto = (prod: Omit<Producto, 'id'>) => {
    const newId = productos.length > 0 ? Math.max(...productos.map((p) => p.id)) + 1 : 1;
    const item: Producto = { ...prod, id: newId };
    setProductos((prev) => [...prev, item]);
    saveDocument('productos', newId, item).catch(() => {});

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
      saveDocument('kardex', kardexEntry.id, kardexEntry).catch(() => {});
    }
    logActivity('Creación', 'Productos', `Producto "${prod.nombre}" registrado`);
  };

  const updateProducto = (id: number, prod: Partial<Producto>) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...prod };
          saveDocument('productos', id, updated).catch(() => {});
          return updated;
        }
        return p;
      })
    );
    logActivity('Edición', 'Productos', `Producto #${id} actualizado`);
  };

  const deleteProducto = (id: number) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    deleteDocument('productos', id).catch(() => {});
    logActivity('Eliminación', 'Productos', `Producto #${id} eliminado`);
  };

  // Clientes
  const addCliente = (c: Omit<Cliente, 'id'>): Cliente => {
    const newId = clientes.length > 0 ? Math.max(...clientes.map((item) => item.id)) + 1 : 1;
    const item: Cliente = { ...c, id: newId };
    setClientes((prev) => [...prev, item]);
    saveDocument('clientes', newId, item).catch(() => {});
    logActivity('Creación', 'Clientes', `Cliente "${c.razon_social}" registrado`);
    return item;
  };

  const updateCliente = (id: number, c: Partial<Cliente>) => {
    setClientes((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...c };
          saveDocument('clientes', id, updated).catch(() => {});
          return updated;
        }
        return item;
      })
    );
    logActivity('Edición', 'Clientes', `Cliente #${id} actualizado`);
  };

  const deleteCliente = (id: number) => {
    setClientes((prev) => prev.filter((item) => item.id !== id));
    deleteDocument('clientes', id).catch(() => {});
    logActivity('Eliminación', 'Clientes', `Cliente #${id} eliminado`);
  };

  // Proveedores
  const addProveedor = (p: Omit<Proveedor, 'id'>) => {
    const newId = proveedores.length > 0 ? Math.max(...proveedores.map((item) => item.id)) + 1 : 1;
    const item: Proveedor = { ...p, id: newId };
    setProveedores((prev) => [...prev, item]);
    saveDocument('proveedores', newId, item).catch(() => {});
    logActivity('Creación', 'Proveedores', `Proveedor "${p.razon_social}" registrado`);
  };

  const updateProveedor = (id: number, p: Partial<Proveedor>) => {
    setProveedores((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...p };
          saveDocument('proveedores', id, updated).catch(() => {});
          return updated;
        }
        return item;
      })
    );
    logActivity('Edición', 'Proveedores', `Proveedor #${id} actualizado`);
  };

  const deleteProveedor = (id: number) => {
    setProveedores((prev) => prev.filter((item) => item.id !== id));
    deleteDocument('proveedores', id).catch(() => {});
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
          saveDocument('productos', prod.id, updated).catch(() => {});
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
    kardexEntries.forEach((ke) => saveDocument('kardex', ke.id, ke).catch(() => {}));

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
            saveDocument('cajas', c.id, updated).catch(() => {});
            return updated;
          }
          return c;
        })
      );
    }

    setVentas((prev) => [newVenta, ...prev]);
    saveDocument('ventas', newVenta.id, newVenta).catch(() => {});

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
          saveDocument('productos', prod.id, updated).catch(() => {});
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
    kardexReversals.forEach((kr) => saveDocument('kardex', kr.id, kr).catch(() => {}));

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
            saveDocument('cajas', c.id, updated).catch(() => {});
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
          saveDocument('ventas', id, updated).catch(() => {});
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
          saveDocument('productos', prod.id, updated).catch(() => {});
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
    kardexEntries.forEach((ke) => saveDocument('kardex', ke.id, ke).catch(() => {}));

    setCompras((prev) => [newCompra, ...prev]);
    saveDocument('compras', newCompra.id, newCompra).catch(() => {});

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
    saveDocument('cajas', nuevaCaja.id, nuevaCaja).catch(() => {});
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
          saveDocument('cajas', id, updated).catch(() => {});
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
    saveDocument('movimientos_caja', nuevoMovimiento.id, nuevoMovimiento).catch(() => {});

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
          saveDocument('cajas', c.id, updated).catch(() => {});
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
    saveDocument('inventario_ajustes', ajuste.id, ajuste).catch(() => {});

    // Update product stock
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === productoId) {
          const nuevaCant = tipo === 'Entrada' ? p.cantidad + cantidad : Math.max(0, p.cantidad - cantidad);
          const updated = { ...p, cantidad: nuevaCant };
          saveDocument('productos', p.id, updated).catch(() => {});
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
      saveDocument('kardex', kardexEntry.id, kardexEntry).catch(() => {});
    }

    logActivity('Ajuste', 'Inventario', `Ajuste ${tipo} de ${cantidad} unid. (${motivo})`);
  };

  // Empleados
  const addEmpleado = (emp: Omit<Empleado, 'id'>) => {
    const newId = empleados.length > 0 ? Math.max(...empleados.map((e) => e.id)) + 1 : 1;
    const nuevo = { ...emp, id: newId };
    setEmpleados((prev) => [...prev, nuevo]);
    saveDocument('empleados', newId, nuevo).catch(() => {});
    logActivity('Creación', 'Empleados', `Empleado "${emp.nombre} ${emp.apellido}" registrado`);
  };

  const updateEmpleado = (id: number, emp: Partial<Empleado>) => {
    setEmpleados((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...emp };
          saveDocument('empleados', id, updated).catch(() => {});
          return updated;
        }
        return e;
      })
    );
    logActivity('Edición', 'Empleados', `Empleado #${id} actualizado`);
  };

  const deleteEmpleado = (id: number) => {
    setEmpleados((prev) => prev.filter((e) => e.id !== id));
    deleteDocument('empleados', id).catch(() => {});
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
    await seedFirebaseDatabase();
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

        firebaseStatus,
        firebaseMessage,
        firebaseProjectId: activeConfig.projectId,
        firebaseDatabaseId: activeConfig.firestoreDatabaseId || '(default)',
        activeFirebaseConfig: activeConfig,
        switchFirebaseProject: handleSwitchFirebaseProject,
        resetToDefaultFirebase: handleResetFirebase,
        syncNowWithFirebase,
        seedFirebaseDatabase,
        showFirebaseModal,
        setShowFirebaseModal,

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
