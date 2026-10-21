import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Empleado } from '../../types';
import { UsersCrudPanel } from '../database/UsersCrudPanel';
import {
  Building2,
  Save,
  CheckCircle,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  ShieldCheck,
  Activity,
  Users,
  Search,
  CloudUpload,
  Key,
  RefreshCw,
} from 'lucide-react';

/* ================= EMPRESA CONFIG ================= */
export const EmpresaConfigView: React.FC = () => {
  const { empresa, updateEmpresa, monedas, currentMoneda } = useApp();

  const [nombre, setNombre] = useState(empresa.nombre);
  const [propietario, setPropietario] = useState(empresa.propietario);
  const [ruc, setRuc] = useState(empresa.ruc);
  const [porcentajeImpuesto, setPorcentajeImpuesto] = useState(empresa.porcentaje_impuesto);
  const [abreviaturaImpuesto, setAbreviaturaImpuesto] = useState(empresa.abreviatura_impuesto);
  const [direccion, setDireccion] = useState(empresa.direccion);
  const [ubicacion, setUbicacion] = useState(empresa.ubicacion);
  const [telefono, setTelefono] = useState(empresa.telefono);
  const [correo, setCorreo] = useState(empresa.correo);
  const [monedaId, setMonedaId] = useState(empresa.moneda_id);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmpresa({
      nombre,
      propietario,
      ruc,
      porcentaje_impuesto: Number(porcentajeImpuesto),
      abreviatura_impuesto: abreviaturaImpuesto,
      direccion,
      ubicacion,
      telefono,
      correo,
      moneda_id: Number(monedaId),
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div>
      <Breadcrumb
        title="Configuración de la Empresa"
        items={[{ label: 'Otros' }, { label: 'Empresa' }]}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-3xl overflow-hidden">
        <div className="bg-sky-700 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Building2 className="w-5 h-5" />
            <span>Datos Fiscales y de Identidad Comercial</span>
          </div>
          {savedMessage && (
            <span className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded font-semibold animate-pulse">
              <CheckCircle className="w-3.5 h-3.5" /> Guardado exitosamente
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre Comercial:</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Propietario / Representante:</label>
              <input
                type="text"
                value={propietario}
                onChange={(e) => setPropietario(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIT / Identificación Fiscal:</label>
              <input
                type="text"
                required
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Abrev. Impuesto:</label>
              <input
                type="text"
                required
                placeholder="IGV / IVA"
                value={abreviaturaImpuesto}
                onChange={(e) => setAbreviaturaImpuesto(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Porcentaje Impuesto (%):</label>
              <input
                type="number"
                step="0.01"
                required
                value={porcentajeImpuesto}
                onChange={(e) => setPorcentajeImpuesto(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-3 py-2 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Moneda Principal del Sistema:</label>
              <select
                value={monedaId}
                onChange={(e) => setMonedaId(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-3 py-2 font-semibold"
              >
                {monedas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.estandar_iso} - {m.nombre_completo} ({m.simbolo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono de Contacto:</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dirección Fiscal:</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ciudad / Ubicación:</label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Correo Electrónico:</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              id="btn-guardar-empresa"
              type="submit"
              className="px-6 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold shadow transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= EMPLEADOS ================= */
export const EmpleadoListView: React.FC = () => {
  const { empleados, addEmpleado, updateEmpleado, deleteEmpleado, documentos } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [documentoId, setDocumentoId] = useState<number>(1);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  const openNew = () => {
    setEditingId(null);
    setNombre('');
    setApellido('');
    setDocumentoId(1);
    setNumeroDocumento('');
    setCargo('Cajero');
    setTelefono('');
    setEmail('');
    setModalOpen(true);
  };

  const openEdit = (e: Empleado) => {
    setEditingId(e.id);
    setNombre(e.nombre);
    setApellido(e.apellido);
    setDocumentoId(e.documento_id);
    setNumeroDocumento(e.numero_documento);
    setCargo(e.cargo);
    setTelefono(e.telefono || '');
    setEmail(e.email || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim()) return;

    if (editingId) {
      updateEmpleado(editingId, {
        nombre,
        apellido,
        documento_id: Number(documentoId),
        numero_documento: numeroDocumento,
        cargo,
        telefono,
        email,
      });
    } else {
      addEmpleado({
        nombre,
        apellido,
        documento_id: Number(documentoId),
        numero_documento: numeroDocumento,
        cargo,
        telefono,
        email,
        estado: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <Breadcrumb
        title="Personal y Empleados"
        items={[{ label: 'Otros' }, { label: 'Empleados' }]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Empleado</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {empleados.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  <span>
                    {emp.nombre} {emp.apellido}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{emp.cargo}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{emp.numero_documento}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{emp.telefono || '-'}</div>
                  <div className="text-[10px] text-slate-400">{emp.email}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => updateEmpleado(emp.id, { estado: !emp.estado })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      emp.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {emp.estado ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(emp)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar empleado "${emp.nombre}"?`)) deleteEmpleado(emp.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos:</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Doc:</label>
                  <select
                    value={documentoId}
                    onChange={(e) => setDocumentoId(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    {documentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° Documento:</label>
                  <input
                    type="text"
                    required
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo / Puesto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cajero Principal, Supervisor"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= USUARIOS REGISTRADOS ================= */
export const RegisteredUsersView: React.FC = () => {
  const [authAccounts, setAuthAccounts] = useState<Array<{ id: string; name: string; email: string; type: string; username: string; configured: boolean }>>([]);
  const [authAccountsLoading, setAuthAccountsLoading] = useState(true);
  const [credentialDrafts, setCredentialDrafts] = useState<Record<string, { username: string; password: string }>>({});
  const [credentialMessage, setCredentialMessage] = useState('');
  const [credentialError, setCredentialError] = useState('');
  const [savingAccount, setSavingAccount] = useState('');
  const loadAuthAccounts = async () => {
    setAuthAccountsLoading(true); setCredentialError('');
    try { const response = await fetch('/api/auth/admin/users', { credentials: 'same-origin' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron leer las cuentas.'); setAuthAccounts(data.users || []); }
    catch (error) { setCredentialError(error instanceof Error ? error.message : 'No se pudieron leer las cuentas.'); }
    finally { setAuthAccountsLoading(false); }
  };
  useEffect(() => { void loadAuthAccounts(); }, []);
  const saveCredentials = async (id: string) => {
    setSavingAccount(id); setCredentialError(''); setCredentialMessage(''); const draft = credentialDrafts[id];
    try { const response = await fetch('/api/auth/admin/credentials', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, username: draft?.username, password: draft?.password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron guardar las credenciales.'); setCredentialMessage(data.message); setCredentialDrafts((previous) => ({ ...previous, [id]: { username: '', password: '' } })); await loadAuthAccounts(); }
    catch (error) { setCredentialError(error instanceof Error ? error.message : 'No se pudieron guardar las credenciales.'); }
    finally { setSavingAccount(''); }
  };
  return <div>
    <Breadcrumb title="Usuarios Registrados" items={[{ label: 'Otros' }, { label: 'Usuarios Registrados' }]} />
    <div className="space-y-7"><UsersCrudPanel />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800"><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Acceso al sistema</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Asigna usuario y contraseña a cada cuenta. Las contraseñas se guardan únicamente como hash.</p></div>
        {credentialMessage && <p role="status" className="m-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{credentialMessage}</p>}{credentialError && <p role="alert" className="m-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">{credentialError}</p>}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">{authAccountsLoading && <p role="status" className="px-4 py-8 text-center text-xs text-slate-500">Cargando usuarios desde Google Sheets…</p>}{authAccounts.map((account) => { const draft = credentialDrafts[account.id] || { username: account.username, password: '' }; return <div key={account.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"><div><p className="text-xs font-semibold text-slate-900 dark:text-white">{account.name || 'Cuenta'}</p><p className="mt-1 text-[11px] text-slate-500">{account.email} · {account.type === 'admin' ? 'Administrador' : account.type === 'employee' ? 'Empleado' : account.type === 'supplier' ? 'Proveedor' : 'Cliente'}</p><p className="mt-1 text-[10px] text-slate-400">{account.configured ? 'Credenciales configuradas' : 'Sin credenciales'}</p></div><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Usuario<input value={draft.username} onChange={(event) => setCredentialDrafts((previous) => ({ ...previous, [account.id]: { ...draft, username: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{account.configured ? 'Nueva contraseña' : 'Contraseña inicial'}<input type="password" autoComplete="new-password" placeholder="Mínimo 10 caracteres" value={draft.password} onChange={(event) => setCredentialDrafts((previous) => ({ ...previous, [account.id]: { ...draft, password: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label><button disabled={savingAccount === account.id} onClick={() => void saveCredentials(account.id)} className="rounded-lg bg-[#152238] px-4 py-2 text-xs font-semibold text-white hover:bg-[#233b5d] disabled:opacity-50 dark:bg-[#bd9858] dark:text-[#101b2d]">{savingAccount === account.id ? 'Guardando…' : 'Guardar'}</button></div>; })}{!authAccountsLoading && !credentialError && authAccounts.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-500">No hay filas en la hoja Usuarios.</p>}</div>
      </section>
    </div>
  </div>;
};
const defaultPermissions: Record<string, string[]> = {
  admin: ['users.read', 'users.write', 'roles.manage', 'sheets.config', 'reports.view', 'inventory.manage', 'sales.manage', 'finance.manage'],
  employee: ['inventory.read', 'sales.create', 'purchases.create', 'cashier.manage', 'reports.view'],
  client: ['catalog.view', 'quotes.create', 'profile.view'],
  supplier: ['suppliers.manage', 'quotes.send', 'catalog.view'],
};

type UserRoleAccount = { id: string; name: string; email: string; type: string; rol: string };

/* ================= USUARIOS Y ROLES ================= */
export const UsuariosRolesView: React.FC = () => {
  const { roles } = useApp();
  const [roleUsers, setRoleUsers] = useState<UserRoleAccount[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [roleUsersLoading, setRoleUsersLoading] = useState(true);
  const [roleUsersError, setRoleUsersError] = useState('');
  const [roleUsersMessage, setRoleUsersMessage] = useState('');
  const [savingRoleUser, setSavingRoleUser] = useState('');

  const loadRoleUsers = async () => {
    setRoleUsersLoading(true);
    setRoleUsersError('');
    try {
      const response = await fetch('/api/auth/admin/users', { credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron leer los usuarios de Google Sheets.');
      if (!Array.isArray(data.users)) throw new Error('La respuesta de usuarios no tiene el formato esperado.');
      const accounts = data.users as UserRoleAccount[];
      setRoleUsers(accounts);
      setRoleDrafts(Object.fromEntries(accounts.map((account) => [account.id, account.rol || ''])));
    } catch (error) {
      setRoleUsersError(error instanceof Error ? error.message : 'No se pudieron leer los usuarios de Google Sheets.');
    } finally {
      setRoleUsersLoading(false);
    }
  };

  useEffect(() => { void loadRoleUsers(); }, []);

  const saveUserRole = async (account: UserRoleAccount, remove = false) => {
    const role = remove ? '' : (roleDrafts[account.id] ?? account.rol).trim();
    if (!remove && !role) {
      setRoleUsersError('Escribe un rol para asignarlo. Usa “Quitar rol” para eliminar la asignación.');
      return;
    }
    if (remove && !window.confirm(`¿Quitar el rol de ${account.name || account.email}? Esto no afectará a otros usuarios con el mismo rol.`)) return;

    setSavingRoleUser(account.id);
    setRoleUsersError('');
    setRoleUsersMessage('');
    try {
      const response = await fetch(`/api/auth/admin/users/${encodeURIComponent(account.id)}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ partial: true, rol: role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el rol del usuario.');
      setRoleUsersMessage(remove ? 'Se quitó la asignación de rol.' : `Rol “${role}” guardado para ${account.name || account.email}.`);
      await loadRoleUsers();
    } catch (error) {
      setRoleUsersError(error instanceof Error ? error.message : 'No se pudo actualizar el rol del usuario.');
    } finally {
      setSavingRoleUser('');
    }
  };

  const availableRoleNames = Array.from(new Map(
    [...roles.map((role) => role.nombre), ...roleUsers.map((account) => account.rol)]
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => [name.toLocaleLowerCase('es'), name])
  ).values());
  const assignedRoleCounts = roleUsers.reduce<Record<string, { name: string; count: number }>>((counts, account) => {
    const role = account.rol.trim();
    if (!role) return counts;
    const key = role.toLocaleLowerCase('es');
    if (counts[key]) counts[key].count += 1;
    else counts[key] = { name: role, count: 1 };
    return counts;
  }, {});

  // Estado de permisos por rol (editable por admin)
  const [permissionState, setPermissionState] = React.useState<Record<number, Set<string>>>(() => {
    const state: Record<number, Set<string>> = {};
    roles.forEach((r) => {
      state[r.id] = new Set(r.permisos || []);
    });
    return state;
  });

  // Función para alternar permiso
  const togglePermission = (roleId: number, perm: string) => {
    setPermissionState((prev) => {
      const newState = { ...prev };
      const perms = newState[roleId] || new Set();
      if (perms.has(perm)) {
        perms.delete(perm);
      } else {
        perms.add(perm);
      }
      newState[roleId] = perms;
      return newState;
    });
  };

  // Funciones disponibles por rol
  const roleFunctions: Record<string, string[]> = {
    admin: [
      'Gestión completa del sistema',
      'Configuración de Google Sheets',
      'Sincronización de datos',
      'Gestión de usuarios y roles',
      'Ver reportes y auditoría',
      'Configuración de empresa',
      'Gestión de catálogo de productos',
      'Ver todas las transacciones',
    ],
    employee: [
      'Gestión de inventario',
      'Registro de ventas y compras',
      'Caja y finanzas',
      'Ver catálogo de productos',
      'Emisión de cotizaciones',
    ],
    client: [
      'Visitar catálogo de productos',
      'Solicitar cotizaciones',
      'Ver mi perfil',
    ],
    supplier: [
      'Gestión de proveedores',
      'Enviar cotizaciones',
      'Ver catálogo de productos',
    ],
  };

  return (
    <div>
      <Breadcrumb
        title="Usuarios del Sistema y Permisos de Roles"
        items={[{ label: 'Otros' }, { label: 'Usuarios y Roles' }]}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Roles por usuario · Google Sheets</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Lectura y cambios en la columna “roles” (o “rol”) de la pestaña Usuarios. El mismo rol puede asignarse a varios usuarios.</p>
            </div>
            <button type="button" onClick={() => void loadRoleUsers()} disabled={roleUsersLoading || Boolean(savingRoleUser)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-white">
              <RefreshCw className={`h-4 w-4 ${roleUsersLoading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </header>
          {roleUsersMessage && <p role="status" className="m-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{roleUsersMessage}</p>}
          {roleUsersError && <p role="alert" className="m-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">{roleUsersError}</p>}
          {!roleUsersLoading && !roleUsersError && Object.keys(assignedRoleCounts).length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              {Object.values(assignedRoleCounts).map(({ name, count }) => <span key={name} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{name} · {count} usuario(s)</span>)}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Rol asignado</th><th className="px-4 py-3">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roleUsersLoading ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">Leyendo usuarios y roles desde Google Sheets…</td></tr>
                  : roleUsers.map((account) => {
                    const draft = roleDrafts[account.id] ?? account.rol;
                    const unchanged = draft.trim() === account.rol.trim();
                    return <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{account.name || '—'}<span className="block pt-1 font-normal text-slate-500">{account.email || account.id}</span></td>
                      <td className="px-4 py-3 capitalize">{account.type}</td>
                      <td className="px-4 py-3">
                        <input aria-label={`Rol de ${account.name || account.email}`} list="assigned-role-options" value={draft} onChange={(event) => setRoleDrafts((current) => ({ ...current, [account.id]: event.target.value }))} placeholder="Escribe o elige un rol" disabled={Boolean(savingRoleUser)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void saveUserRole(account)} disabled={Boolean(savingRoleUser) || unchanged || !draft.trim()} className="inline-flex items-center gap-1 rounded-lg bg-[#152238] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-40 dark:bg-[#bd9858] dark:text-[#101b2d]">
                            <Save className="h-3.5 w-3.5" /> {savingRoleUser === account.id ? 'Guardando…' : account.rol ? 'Actualizar' : 'Asignar'}
                          </button>
                          {account.rol && <button type="button" onClick={() => void saveUserRole(account, true)} disabled={Boolean(savingRoleUser)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-[11px] font-semibold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" /> Quitar</button>}
                        </div>
                      </td>
                    </tr>;
                  })}
                {!roleUsersLoading && !roleUsersError && roleUsers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay usuarios en la pestaña Usuarios.</td></tr>}
              </tbody>
            </table>
          </div>
          <datalist id="assigned-role-options">{availableRoleNames.map((name) => <option key={name} value={name} />)}</datalist>
        </section>

        {/* Roles and permissions matrix */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-4 h-4 text-red-500" />
              <span>Roles y Matriz de Permisos (Spatie)</span>
            </span>
          </div>
          <div className="p-4 space-y-4">
            {roles.map((r) => {
              return (
                <div
                  key={r.id}
                  className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs uppercase text-slate-900">
                      {r.nombre} {r.permisos.length > 0 && <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">({r.permisos.length} perms)</span>}
                    </span>
                  </div>

                  {/* Permissions list */}
                  <div className="space-y-2">
                    {defaultPermissions[r.nombre.toLowerCase()]?.map((perm, idx) => {
                      const isCurrentlyAssigned = permissionState[r.id]?.has(perm) || false;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2 py-1 rounded bg-white ${
                            isCurrentlyAssigned ? 'bg-blue-50' : 'bg-slate-100'
                          }"
                        >
                          <input
                            type="checkbox"
                            checked={isCurrentlyAssigned}
                            onChange={() => togglePermission(r.id, perm)}
                            className="w-3 h-3 rounded border-slate-400 cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-700 font-mono">
                            {perm}
                          </span>
                        </div>
                      );
                    })}

                    {!defaultPermissions[r.nombre.toLowerCase()] && (
                      <p className="text-[9px] text-slate-500 italic">
                        Sin permisos predefinidos
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= ACTIVITY LOG ================= */
export const ActivityLogView: React.FC = () => {
  const { activityLogs } = useApp();

  return (
    <div>
      <Breadcrumb
        title="Registro de Actividades y Auditoría del Sistema"
        items={[{ label: 'Otros' }, { label: 'Registro de Actividades' }]}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {activityLogs.length} eventos registrados en el log de auditoría
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Usuario Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.fecha}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{log.modulo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.descripcion}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.user_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
