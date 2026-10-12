import type { Cliente, Empleado, User } from '../types';

export const REGISTERED_USERS_HEADERS = [
  'id',
  'tipo_usuario',
  'nombre',
  'email',
  'cargo',
  'rol',
  'estado',
];

export interface RegisteredUser {
  id: string;
  tipo_usuario: 'Administrador' | 'Empleado' | 'Cliente';
  nombre: string;
  email: string;
  cargo: string;
  rol: string;
  estado: boolean;
}

export function buildRegisteredUsers(
  users: User[],
  empleados: Empleado[],
  clientes: Cliente[]
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
      cargo: employee.cargo,
      rol: '',
      estado: employee.estado,
    }));

  const customerRows = clientes.map((client) => ({
    id: `CLI-${client.id}`,
    tipo_usuario: 'Cliente' as const,
    nombre: client.razon_social,
    email: client.email,
    cargo: '',
    rol: '',
    estado: client.estado,
  }));

  return [...accounts, ...standaloneEmployees, ...customerRows];
}
