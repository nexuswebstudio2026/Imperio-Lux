import type { AppTab } from '../context/AppContext';

export const ADMIN_TAB_ROUTES: Record<AppTab, string> = {
  panel: '/admin/panel',
  ventas: '/admin/ventas',
  ventas_create: '/admin/ventas/nueva',
  compras: '/admin/compras',
  compras_create: '/admin/compras/nueva',
  productos: '/admin/productos',
  categorias: '/admin/categorias',
  presentaciones: '/admin/presentaciones',
  marcas: '/admin/marcas',
  inventario: '/admin/inventario',
  kardex: '/admin/kardex',
  cajas: '/admin/cajas',
  clientes: '/admin/clientes',
  proveedores: '/admin/proveedores',
  empleados: '/admin/empleados',
  usuarios_registrados: '/admin/usuarios-registrados',
  empresa: '/admin/empresa',
  users: '/admin/usuarios',
  roles: '/admin/roles',
  activity_log: '/admin/actividad',
  database: '/admin/base-datos',
  sheets_config: '/admin/base-datos/configuracion',
};

const ADMIN_ROUTE_TABS = Object.fromEntries(
  Object.entries(ADMIN_TAB_ROUTES).map(([tab, route]) => [route, tab]),
) as Record<string, AppTab>;

const ADMIN_ROUTE_ALIASES: Record<string, AppTab> = {
  '/admin': 'panel',
  '/admin/dashboard': 'panel',
  '/admin/activity-log': 'activity_log',
};

export const PUBLIC_SECTION_ROUTES: Record<string, string> = {
  '/catalogo': 'catalogo',
  '/nosotros': 'nosotros',
  '/contacto': 'contacto',
};

export function normalizePathname(pathname: string): string {
  const withoutTrailingSlashes = pathname.replace(/\/+$/, '');
  return withoutTrailingSlashes || '/';
}

export function adminTabFromPath(pathname: string): AppTab | null {
  const path = normalizePathname(pathname);
  return ADMIN_ROUTE_TABS[path] || ADMIN_ROUTE_ALIASES[path] || null;
}

export function isAdminPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === '/admin' || path.startsWith('/admin/');
}
