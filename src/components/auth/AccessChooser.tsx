import React from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ShieldCheck, Truck, UserRound } from 'lucide-react';

interface AccessChooserProps {
  onSelect: (path: string) => void;
  onBack: () => void;
}

const portals = [
  {
    title: 'Administrador',
    description: 'Gestiona ventas, inventario, compras, usuarios y configuración.',
    path: '/acceso/admin',
    icon: ShieldCheck,
  },
  {
    title: 'Empleado',
    description: 'Accede a las herramientas y la información de tu trabajo.',
    path: '/acceso/empleados',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Proveedor',
    description: 'Consulta tus datos, compras registradas y estado de pago.',
    path: '/acceso/proveedores',
    icon: Truck,
  },
  {
    title: 'Cliente',
    description: 'Consulta tu perfil, comprobantes e historial de compras.',
    path: '/acceso/clientes',
    icon: UserRound,
  },
];

export const AccessChooser: React.FC<AccessChooserProps> = ({ onSelect, onBack }) => (
  <main className="min-h-screen bg-[#f7f5f0] px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
    <div className="mx-auto max-w-5xl">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-[#9b7b3e] dark:text-slate-300">
        <ArrowLeft size={16} /> Volver al sitio
      </button>
      <header className="mb-10 text-center">
        <img src="/assets/imperio-icon.svg" alt="" className="mx-auto mb-4 h-12 w-12 rounded-full" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9b7b3e]">Imperio Lux</p>
        <h1 className="mt-2 font-serif text-4xl">Elige tu portal de acceso</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Ingresa al espacio correspondiente a tu cuenta.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portals.map(({ title, description, path, icon: Icon }) => (
          <button
            key={path}
            type="button"
            onClick={() => onSelect(path)}
            className="group flex min-h-64 flex-col items-start border border-[#d8d2c4] bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#b89652] hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="grid h-12 w-12 place-items-center border border-[#b89652]/30 bg-[#b89652]/10 text-[#9b7b3e]">
              <Icon size={22} />
            </span>
            <span className="mt-7 font-serif text-2xl">{title}</span>
            <span className="mt-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</span>
            <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8b6d35]">
              Ingresar <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        ))}
      </div>
    </div>
  </main>
);
