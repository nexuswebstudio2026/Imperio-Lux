import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type Account = { id: string; name: string; email: string; document: string; phone: string; type: string; username: string; configured: boolean; cargo: string; rol: string; estado: boolean };
type Draft = Omit<Account, 'username' | 'configured'>;
const emptyDraft: Draft = { id: '', name: '', email: '', document: '', phone: '', type: 'customer', cargo: '', rol: '', estado: true };
const roleLabels: Record<string, string> = { admin: 'Administrador', employee: 'Empleado', customer: 'Cliente', supplier: 'Proveedor' };

export const UsersCrudPanel: React.FC = () => {
  const { empleados } = useApp();
  const [users, setUsers] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState(false);
  const visible = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.type} ${user.username}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))), [users, query]);
  const load = async () => {
    setLoading(true); setError('');
    try { const response = await fetch('/api/auth/admin/users', { credentials: 'same-origin' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron consultar los usuarios.'); setUsers((data.users || []).map((account: Account) => { const employeeId = account.id.match(/^EMP-(\d+)$/)?.[1]; const employee = employeeId ? empleados.find((item) => String(item.id) === employeeId) : undefined; return { ...account, document: account.document || employee?.numero_documento || '', phone: account.phone || employee?.telefono || '', email: account.email || employee?.email || '', cargo: account.cargo || employee?.cargo || '' }; })); setSelected([]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron consultar los usuarios.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setDraft(emptyDraft); setEditing(false); setModal(true); };
  const openEdit = (account: Account) => { setDraft({ id: account.id, name: account.name, email: account.email, document: account.document, phone: account.phone, type: account.type, cargo: account.cargo, rol: account.rol, estado: account.estado }); setEditing(true); setModal(true); };
  const openBulkEdit = () => { setDraft({ ...emptyDraft, type: '' }); setEditing(true); setModal(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const bulk = editing && selected.length > 1;
      const payload = bulk
        ? { partial: true, ...(draft.name.trim() ? { name: draft.name } : {}), ...(draft.email.trim() ? { email: draft.email } : {}), ...(draft.document.trim() ? { document: draft.document } : {}), ...(draft.phone.trim() ? { phone: draft.phone } : {}), ...(draft.type ? { type: draft.type } : {}), ...(draft.cargo.trim() ? { cargo: draft.cargo } : {}), ...(draft.rol.trim() ? { rol: draft.rol } : {}) }
        : { name: draft.name, email: draft.email, document: draft.document, phone: draft.phone, type: draft.type, cargo: draft.cargo, rol: draft.rol, estado: draft.estado };
      if (editing && selected.length > 1) {
        const results = await Promise.all(selected.map(async (id) => { const response = await fetch(`/api/auth/admin/users/${encodeURIComponent(id)}`, { method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || `No se pudo actualizar ${id}.`); }));
        void results; setMessage(`Se actualizaron ${selected.length} usuarios.`);
      } else {
        const response = await fetch(editing ? `/api/auth/admin/users/${encodeURIComponent(draft.id)}` : '/api/auth/admin/users', { method: editing ? 'PUT' : 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo guardar el usuario.'); setMessage(data.message || 'Usuario guardado.');
      }
      setModal(false); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!selected.length || !window.confirm(`¿Eliminar ${selected.length} usuario(s) de la hoja Usuarios? Esta acción también revocará sus sesiones activas.`)) return;
    setBusy(true); setError(''); setMessage('');
    try { const response = await fetch('/api/auth/admin/users/delete', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: selected }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron eliminar los usuarios.'); setMessage(data.message); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron eliminar los usuarios.'); }
    finally { setBusy(false); }
  };
  const syncEmployeeDetails = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const usersToSync = users.map((account) => {
        const employeeId = account.id.match(/^EMP-(\d+)$/)?.[1];
        const employee = employeeId ? empleados.find((item) => String(item.id) === employeeId) : undefined;
        return { id: account.id, tipo_usuario: roleLabels[account.type] || account.type, nombre: employee ? `${employee.nombre} ${employee.apellido}`.trim() : account.name, email: employee?.email || account.email, numero_documento: employee?.numero_documento || account.document, telefono: employee?.telefono || account.phone, cargo: employee?.cargo || account.cargo, rol: account.rol, estado: employee?.estado ?? account.estado };
      });
      const response = await fetch('/api/auth/admin/sync-users', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ users: usersToSync }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron sincronizar los datos.');
      setUsers((current) => current.map((account) => { const synced = usersToSync.find((item) => item.id === account.id); return synced ? { ...account, name: synced.nombre, email: synced.email, document: synced.numero_documento, phone: synced.telefono, cargo: synced.cargo, estado: synced.estado } : account; }));
      setMessage(`Usuarios sincronizados con la hoja Empleados. Se conservaron las credenciales. Total en Usuarios: ${data.count}.`);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron sincronizar los datos.'); }
    finally { setBusy(false); }
  };
  const allVisibleSelected = visible.length > 0 && visible.every((user) => selected.includes(user.id));
  const toggleAll = () => setSelected((current) => allVisibleSelected ? current.filter((id) => !visible.some((user) => user.id === id)) : [...new Set([...current, ...visible.map((user) => user.id)])]);

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 md:flex-row md:items-center md:justify-between">
      <div><h2 className="font-semibold text-slate-900 dark:text-white">Usuarios · Google Sheets</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fuente única: pestaña Usuarios. {users.length} registros.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void syncEmployeeDetails()} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-600 dark:text-white">{busy ? 'Sincronizando…' : 'Sincronizar empleados'}</button>
        {selected.length > 0 && <><button type="button" onClick={openBulkEdit} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-600 dark:text-white"><Pencil className="h-4 w-4"/>Actualizar ({selected.length})</button><button type="button" onClick={() => void remove()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-300"><Trash2 className="h-4 w-4"/>Eliminar ({selected.length})</button></>}
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#152238] px-3 py-2 text-xs font-semibold text-white dark:bg-[#bd9858] dark:text-[#101b2d]"><Plus className="h-4 w-4"/>Crear usuario</button>
        <button type="button" onClick={() => void load()} disabled={loading || busy} aria-label="Actualizar lista" className="rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:text-white"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/></button>
      </div>
    </header>
    {message && <p role="status" className="m-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{message}</p>}{error && <p role="alert" className="m-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">{error}</p>}
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative block sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario…" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><span className="text-xs text-slate-500">{selected.length ? `${selected.length} seleccionado(s)` : 'Selecciona uno o varios usuarios para acciones en lote.'}</span></div>
    <div className="max-h-[65vh] overflow-auto"><table className="min-w-[1050px] w-full text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr><th className="px-4 py-3"><input aria-label="Seleccionar todos los usuarios visibles" type="checkbox" checked={allVisibleSelected} onChange={toggleAll}/></th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Teléfono</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Cargo / rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{loading ? <tr><td colSpan={9} className="p-8 text-center text-slate-500">Leyendo hoja Usuarios…</td></tr> : visible.map((account) => <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-3"><input aria-label={`Seleccionar ${account.name}`} type="checkbox" checked={selected.includes(account.id)} onChange={() => setSelected((items) => items.includes(account.id) ? items.filter((id) => id !== account.id) : [...items, account.id])}/></td><td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{account.name || '—'}<span className="block pt-1 font-mono text-[10px] text-slate-400">{account.id}</span></td><td className="px-4 py-3">{roleLabels[account.type] || account.type}</td><td className="px-4 py-3">{account.document || '—'}</td><td className="px-4 py-3">{account.phone || '—'}</td><td className="px-4 py-3">{account.email || '—'}</td><td className="px-4 py-3">{account.cargo || account.rol || '—'}</td><td className="px-4 py-3">{account.estado ? 'Activo' : 'Inactivo'}</td><td className="px-4 py-3"><button type="button" onClick={() => { setSelected([account.id]); openEdit(account); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:text-white"><Pencil className="h-3 w-3"/>Editar</button></td></tr>)}{!loading && visible.length === 0 && <tr><td colSpan={9} className="p-10 text-center text-slate-500">No hay usuarios que coincidan.</td></tr>}</tbody></table></div>
    {modal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="users-crud-title"><form onSubmit={(event) => void save(event)} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h3 id="users-crud-title" className="text-lg font-bold text-slate-900 dark:text-white">{editing ? selected.length > 1 ? `Actualizar ${selected.length} usuarios` : 'Actualizar usuario' : 'Crear usuario'}</h3><button type="button" onClick={() => setModal(false)} aria-label="Cerrar" className="text-slate-500"><X/></button></div>{editing && selected.length > 1 && <p className="text-xs text-slate-500">Completa solo los campos que quieras cambiar; se aplicarán a todos los seleccionados.</p>}<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Nombre completo<input required={!editing || selected.length === 1} value={draft.name} onChange={(event) => setField('name', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="text-xs font-semibold">Correo electrónico<input required={!editing || selected.length === 1} type="email" value={draft.email} onChange={(event) => setField('email', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="text-xs font-semibold">Número de documento<input value={draft.document} onChange={(event) => setField('document', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="text-xs font-semibold">Teléfono<input value={draft.phone} onChange={(event) => setField('phone', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="text-xs font-semibold">Tipo de usuario<select value={draft.type} onChange={(event) => setField('type', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white">{editing && selected.length > 1 && <option value="">Sin cambios</option>}{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-semibold">Cargo<input value={draft.cargo} onChange={(event) => setField('cargo', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label><label className="text-xs font-semibold">Rol<input value={draft.rol} onChange={(event) => setField('rol', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label>{!(editing && selected.length > 1) && <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold"><input type="checkbox" checked={draft.estado} onChange={(event) => setField('estado', event.target.checked)}/>Activo</label>}</div><p className="text-[11px] text-slate-500">Las credenciales de acceso se pueden asignar desde “Acceso al sistema”.</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-600 dark:text-white">Cancelar</button><button disabled={busy} className="rounded-lg bg-[#152238] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-[#bd9858] dark:text-[#101b2d]">{busy ? 'Guardando…' : 'Guardar'}</button></div></form></div>}
  </section>;
};
