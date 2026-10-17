import React, { useEffect, useState } from 'react';
import { Building2, CalendarDays, FileText, LogOut, PackageCheck, UserRound } from 'lucide-react';
import type { User } from '../../types';

type PortalTransaction = {
  number: string;
  date: string;
  total: number;
  status: string;
  paymentStatus?: string;
};

type PortalData = {
  type: 'client' | 'supplier';
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
    document: string;
  };
  transactions: PortalTransaction[];
};

interface RolePortalProps {
  user: User;
  type: 'client' | 'supplier';
  onLogout: () => void;
}

const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const RolePortal: React.FC<RolePortalProps> = ({ user, type, onLogout }) => {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isSupplier = type === 'supplier';
  const title = isSupplier ? 'Portal de proveedores' : 'Mi portal de cliente';

  useEffect(() => {
    let active = true;
    fetch('/api/portal/data')
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'No se pudo cargar la información del portal.');
        return body as PortalData;
      })
      .then((result) => { if (active) setData(result); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la información del portal.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-300 pb-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9b7b3e]">Imperio Lux</p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Hola, {user.name}. Aquí puedes consultar la información asociada a tu cuenta.</p>
          </div>
          <button onClick={onLogout} className="inline-flex items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition hover:border-[#b89652] dark:border-slate-700">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </header>

        {loading ? <p className="py-12 text-center text-sm text-slate-500">Cargando tu información…</p> : null}
        {error ? <p role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p> : null}

        {data ? <>
          <section className="mt-7 grid gap-4 md:grid-cols-3">
            <article className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center bg-[#b89652]/10 text-[#9b7b3e]"><Building2 size={19} /></span>
                <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Cuenta registrada</p><h2 className="mt-1 font-serif text-xl">{data.profile.name}</h2></div>
              </div>
              <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-slate-500">Correo</dt><dd className="mt-1 break-all">{data.profile.email || 'No registrado'}</dd></div>
                <div><dt className="text-xs text-slate-500">Teléfono</dt><dd className="mt-1">{data.profile.phone || 'No registrado'}</dd></div>
                <div><dt className="text-xs text-slate-500">Documento</dt><dd className="mt-1">{data.profile.document || 'No registrado'}</dd></div>
                <div><dt className="text-xs text-slate-500">Dirección</dt><dd className="mt-1">{data.profile.address || 'No registrada'}</dd></div>
              </dl>
            </article>
            <article className="flex items-center gap-4 border border-[#b89652]/30 bg-[#b89652]/10 p-5">
              {isSupplier ? <PackageCheck className="h-8 w-8 text-[#9b7b3e]" /> : <UserRound className="h-8 w-8 text-[#9b7b3e]" />}
              <div><p className="text-xs text-slate-600 dark:text-slate-300">{isSupplier ? 'Compras registradas' : 'Compras realizadas'}</p><p className="mt-1 font-serif text-3xl">{data.transactions.length}</p></div>
            </article>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9b7b3e]">{isSupplier ? 'Relación comercial' : 'Tu actividad'}</p><h2 className="mt-1 font-serif text-2xl">{isSupplier ? 'Compras y pagos' : 'Historial de compras'}</h2></div>
              <span className="text-xs text-slate-500">{data.transactions.length} registros</span>
            </div>
            <div className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {data.transactions.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                      <tr><th className="px-4 py-3">Comprobante</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Estado</th>{isSupplier ? <th className="px-4 py-3">Pago</th> : null}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.transactions.map((transaction) => (
                        <tr key={transaction.number}>
                          <td className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-2"><FileText size={15} className="text-[#9b7b3e]" />{transaction.number}</span></td>
                          <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" />{transaction.date || '—'}</span></td>
                          <td className="px-4 py-3 font-semibold">{currency.format(transaction.total || 0)}</td>
                          <td className="px-4 py-3">{transaction.status || '—'}</td>
                          {isSupplier ? <td className="px-4 py-3">{transaction.paymentStatus || '—'}</td> : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="px-5 py-10 text-center text-sm text-slate-500">Aún no hay movimientos asociados a esta cuenta.</p>}
            </div>
          </section>
        </> : null}
      </div>
    </main>
  );
};
