import type { Cliente, Empleado, Proveedor, User } from '../types';

export const REGISTERED_USERS_HEADERS = [
  'id',
  'tipo_usuario',
  'nombre',
  'email',
  'numero_documento',
  'telefono',
  'cargo',
  'rol',
  'estado',
  'usuario',
  'contrasena_salt',
  'contrasena_hash',
];

export interface RegisteredUser {
  id: string;
  tipo_usuario: 'Administrador' | 'Empleado' | 'Cliente' | 'Proveedor';
  nombre: string;
  email: string;
  numero_documento: string;
  telefono: string;
  cargo: string;
  rol: string;
  estado: boolean;
}

export function buildRegisteredUsers(
  users: User[],
  empleados: Empleado[],
  clientes: Cliente[],
  proveedores: Proveedor[] = []
): RegisteredUser[] {
  const employeeById = new Map(empleados.map((employee) => [employee.id, employee]));
  const linkedEmployeeIds = new Set<number>();

  const accounts = users.map((user) => {
    const employee = user.empleado_id ? employeeById.get(user.empleado_id) : undefined;
    if (employee) linkedEmployeeIds.add(employee.id);
    const isAdmin = /admin/i.test(user.role);
    const employeeName = employee ? `${employee.nombre} ${employee.apellido}`.trim() : '';

    return {
      id: `${isAdmin ? 'ADMIN' : 'EMP'}-${user.id}`,
      tipo_usuario: isAdmin ? 'Administrador' as const : 'Empleado' as const,
      nombre: employeeName || user.name,
      email: user.email || employee?.email || '',
      numero_documento: employee?.numero_documento || '',
      telefono: employee?.telefono || '',
      cargo: employee?.cargo || '',
      rol: user.role,
      estado: employee?.estado ?? true,
    };
  });

  const standaloneEmployees = empleados
    .filter((employee) => !linkedEmployeeIds.has(employee.id))
    .map((employee) => ({
      id: `EMP-${employee.id}`,
      tipo_usuario: 'Empleado' as const,
      nombre: `${employee.nombre} ${employee.apellido}`.trim(),
      email: employee.email,
      numero_documento: employee.numero_documento,
      telefono: employee.telefono,
      cargo: employee.cargo,
      rol: '',
      estado: employee.estado,
    }));

  const customerRows = clientes.map((client) => ({
    id: `CLI-${client.id}`,
    tipo_usuario: 'Cliente' as const,
    nombre: client.razon_social,
    email: client.email,
    numero_documento: client.numero_documento,
    telefono: client.telefono,
    cargo: '',
    rol: '',
    estado: client.estado,
  }));

  const supplierRows = proveedores.map((supplier) => ({
    id: `PROV-${supplier.id}`,
    tipo_usuario: 'Proveedor' as const,
    nombre: supplier.razon_social,
    email: supplier.email,
    numero_documento: supplier.numero_documento,
    telefono: supplier.telefono,
    cargo: '',
    rol: '',
    estado: supplier.estado,
  }));

  return [...accounts, ...standaloneEmployees, ...customerRows, ...supplierRows];
}
