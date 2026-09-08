export interface Moneda {
  id: number;
  estandar_iso: string;
  nombre_completo: string;
  simbolo: string;
}

export interface Empresa {
  id: number;
  nombre: string;
  propietario: string;
  ruc: string;
  porcentaje_impuesto: number;
  abreviatura_impuesto: string;
  direccion: string;
  ubicacion: string;
  telefono: string;
  correo: string;
  moneda_id: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface Presentacion {
  id: number;
  nombre: string;
  sigla: string;
  descripcion?: string;
  estado: boolean;
}

export interface Marca {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_vencimiento?: string;
  imagen?: string;
  marca_id: number;
  presentacione_id: number;
  categoria_ids: number[];
  cantidad: number; // Stock actual
  precio_compra: number;
  precio_venta: number;
  estado: boolean;
}

export interface DocumentoTipo {
  id: number;
  nombre: string;
}

export interface Cliente {
  id: number;
  tipo_persona: 'Natural' | 'Juridica';
  razon_social: string;
  documento_id: number;
  numero_documento: string;
  email: string;
  telefono: string;
  direccion: string;
  estado: boolean;
}

export interface Proveedor {
  id: number;
  tipo_persona: 'Natural' | 'Juridica';
  razon_social: string;
  documento_id: number;
  numero_documento: string;
  email: string;
  telefono: string;
  direccion: string;
  estado: boolean;
}

export interface ComprobanteTipo {
  id: number;
  nombre: string; // 'Boleta' | 'Factura' | 'Ticket'
  serie_default: string;
}

export interface DetalleVentaItem {
  id: number;
  producto_id: number;
  nombre_producto: string;
  presentacion_sigla: string;
  cantidad: number;
  precio_venta: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  numero_comprobante: string;
  comprobante_id: number;
  cliente_id: number;
  user_id: number;
  caja_id?: number;
  fecha_hora: string;
  subtotal: number;
  impuesto: number;
  total: number;
  metodo_pago: 'Efectivo' | 'Tarjeta de Débito' | 'Tarjeta de Crédito' | 'Transferencia' | 'Yape / Plin';
  monto_recibido?: number;
  vuelto_entregado?: number;
  estado: 'Completada' | 'Anulada';
  items: DetalleVentaItem[];
}

export interface DetalleCompraItem {
  id: number;
  producto_id: number;
  nombre_producto: string;
  cantidad: number;
  precio_compra: number;
  precio_venta_sugerido: number;
  subtotal: number;
}

export interface Compra {
  id: number;
  numero_comprobante: string;
  comprobante_id: number;
  proveedor_id: number;
  user_id: number;
  fecha_hora: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'Completada' | 'Anulada';
  items: DetalleCompraItem[];
}

export interface Caja {
  id: number;
  nombre: string;
  user_id: number;
  fecha_apertura: string;
  monto_inicial: number;
  ingresos_ventas: number;
  ingresos_movimientos: number;
  egresos_movimientos: number;
  saldo_estimado: number;
  fecha_cierre?: string;
  monto_final?: number;
  diferencia?: number;
  estado: 'Abierta' | 'Cerrada';
}

export interface MovimientoCaja {
  id: number;
  caja_id: number;
  tipo: 'Ingreso' | 'Egreso';
  concepto: string;
  monto: number;
  fecha_hora: string;
  user_id: number;
}

export interface InventarioAjuste {
  id: number;
  producto_id: number;
  tipo: 'Entrada' | 'Salida';
  cantidad: number;
  motivo: string;
  fecha: string;
  user_id: number;
}

export interface KardexItem {
  id: number;
  producto_id: number;
  fecha: string;
  tipo_movimiento: 'Compra' | 'Venta' | 'Ajuste Entrada' | 'Ajuste Salida';
  documento_ref: string;
  entrada_cantidad: number;
  entrada_costo: number;
  entrada_total: number;
  salida_cantidad: number;
  salida_costo: number;
  salida_total: number;
  saldo_cantidad: number;
  saldo_costo: number;
  saldo_total: number;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  documento_id: number;
  numero_documento: string;
  cargo: string;
  telefono: string;
  email: string;
  estado: boolean;
}

export interface Role {
  id: number;
  nombre: string;
  permisos: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  empleado_id?: number;
}

export interface ActivityLog {
  id: number;
  accion: string;
  modulo: string;
  descripcion: string;
  user_name: string;
  fecha: string;
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'warning' | 'info' | 'success';
}
