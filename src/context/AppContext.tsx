import React, { createContext, useContext, useState, useEffect } from 'react';
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
  | 'activity_log';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

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
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    loadStorage<User | null>('currentUser', initialUsers[0])
  );
  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    loadStorage<AppTab>('activeTab', 'panel')
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

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
    setEmpresa((prev) => ({ ...prev, ...partial }));
    logActivity('Actualización', 'Empresa', 'Datos generales de la empresa actualizados');
  };

  // Categorías
  const addCategoria = (cat: Omit<Categoria, 'id'>) => {
    const newId = categorias.length > 0 ? Math.max(...categorias.map((c) => c.id)) + 1 : 1;
    const item: Categoria = { ...cat, id: newId };
    setCategorias((prev) => [...prev, item]);
    logActivity('Creación', 'Categorías', `Categoría "${cat.nombre}" creada`);
  };

  const updateCategoria = (id: number, cat: Partial<Categoria>) => {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...cat } : c)));
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
    setPresentaciones((prev) => prev.map((p) => (p.id === id ? { ...p, ...pres } : p)));
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
    setMarcas((prev) => prev.map((item) => (item.id === id ? { ...item, ...m } : item)));
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
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...prod } : p)));
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
    setClientes((prev) => prev.map((item) => (item.id === id ? { ...item, ...c } : item)));
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
    setProveedores((prev) => prev.map((item) => (item.id === id ? { ...item, ...p } : item)));
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
          return { ...prod, cantidad: nuevaCantidad };
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

    // Sumar a caja si es pago en efectivo
    if (activeCaja) {
      setCajas((prev) =>
        prev.map((c) =>
          c.id === activeCaja.id
            ? {
                ...c,
                ingresos_ventas: c.ingresos_ventas + newVenta.total,
                saldo_estimado: c.saldo_estimado + newVenta.total,
              }
            : c
        )
      );
    }

    setVentas((prev) => [newVenta, ...prev]);
    logActivity('Creación', 'Ventas', `Comprobante ${numero_comprobante} emitido por ${currentMoneda.simbolo} ${newVenta.total.toFixed(2)}`);

    return newVenta;
  };

  const anularVenta = (id: number) => {
    const ventaToAnular = ventas.find((v) => v.id === id);
    if (!ventaToAnular || ventaToAnular.estado === 'Anulada') return;

    // Restaurar stock
    setProductos((prev) =>
      prev.map((prod) => {
        const itemInVenta = ventaToAnular.items.find((it) => it.producto_id === prod.id);
        if (itemInVenta) {
          return { ...prod, cantidad: prod.cantidad + itemInVenta.cantidad };
        }
        return prod;
      })
    );

    // Kardex entries para devolución
    const kardexEntries: KardexItem[] = ventaToAnular.items.map((it) => {
      const prod = productos.find((p) => p.id === it.producto_id);
      const stockAnterior = prod ? prod.cantidad : 0;
      const costoUnit = prod ? prod.precio_compra : 0;
      const nuevoStock = stockAnterior + it.cantidad;
      return {
        id: Date.now() + Math.random(),
        producto_id: it.producto_id,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        tipo_movimiento: 'Ajuste Entrada',
        documento_ref: `ANULACION-${ventaToAnular.numero_comprobante}`,
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

    setKardex((prev) => [...kardexEntries, ...prev]);

    setVentas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, estado: 'Anulada' } : v))
    );

    logActivity('Anulación', 'Ventas', `Comprobante ${ventaToAnular.numero_comprobante} anulado`);
  };

  // Compras
  const addCompra = (compraData: Omit<Compra, 'id'>) => {
    const newId = compras.length > 0 ? Math.max(...compras.map((c) => c.id)) + 1 : 1;
    const newCompra: Compra = { ...compraData, id: newId };

    // Incrementar stock y actualizar costos de productos
    setProductos((prev) =>
      prev.map((prod) => {
        const itemInCompra = compraData.items.find((it) => it.producto_id === prod.id);
        if (itemInCompra) {
          return {
            ...prod,
            cantidad: prod.cantidad + itemInCompra.cantidad,
            precio_compra: itemInCompra.precio_compra,
            precio_venta: itemInCompra.precio_venta_sugerido || prod.precio_venta,
          };
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
    logActivity('Creación', 'Compras', `Compra ${compraData.numero_comprobante} registrada`);
  };

  // Cajas
  const openCaja = (nombre: string, montoInicial: number) => {
    const newId = cajas.length > 0 ? Math.max(...cajas.map((c) => c.id)) + 1 : 1;
    const newCaja: Caja = {
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
    setCajas((prev) => [newCaja, ...prev]);
    logActivity('Apertura', 'Cajas', `Caja "${nombre}" abierta con ${currentMoneda.simbolo} ${montoInicial.toFixed(2)}`);
  };

  const closeCaja = (id: number, montoFinal: number) => {
    setCajas((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const diff = montoFinal - c.saldo_estimado;
          return {
            ...c,
            estado: 'Cerrada',
            fecha_cierre: new Date().toISOString().replace('T', ' ').substring(0, 19),
            monto_final: montoFinal,
            diferencia: diff,
          };
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
          return {
            ...c,
            ingresos_movimientos: nuevoIngreso,
            egresos_movimientos: nuevoEgreso,
            saldo_estimado: c.saldo_estimado + delta,
          };
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
          return { ...p, cantidad: nuevaCant };
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
    setEmpleados((prev) => [...prev, { ...emp, id: newId }]);
    logActivity('Creación', 'Empleados', `Empleado "${emp.nombre} ${emp.apellido}" registrado`);
  };

  const updateEmpleado = (id: number, emp: Partial<Empleado>) => {
    setEmpleados((prev) => prev.map((e) => (e.id === id ? { ...e, ...emp } : e)));
    logActivity('Edición', 'Empleados', `Empleado #${id} actualizado`);
  };

  const deleteEmpleado = (id: number) => {
    setEmpleados((prev) => prev.filter((e) => e.id !== id));
    logActivity('Eliminación', 'Empleados', `Empleado #${id} eliminado`);
  };

  const markNotificationsAsRead = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const resetAllDataToDefaults = () => {
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
