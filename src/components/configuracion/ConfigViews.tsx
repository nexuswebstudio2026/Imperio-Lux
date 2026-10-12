import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Empleado } from '../../types';
import { buildRegisteredUsers, type RegisteredUser } from '../../lib/registeredUsers';
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
  User,
  Users,
  Search,
  CloudUpload,
  Key,
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
              <label className="block font-bold text-slate-700 mb-1">RUC / Identificación Fiscal:</label>
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
  const { users, empleados, clientes, uploadSingleTableToGoogleSheets } = useApp();
  const [filter, setFilter] = useState<'Todos' | RegisteredUser['tipo_usuario']>('Todos');
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [authAccounts, setAuthAccounts] = useState<Array<{ id: string; name: string; email: string; type: string; username: string; configured: boolean }>>([]);
  const [credentialDrafts, setCredentialDrafts] = useState<Record<string, { username: string; password: string }>>({});
  const [credentialMessage, setCredentialMessage] = useState('');
  const [credentialError, setCredentialError] = useState('');
  const [savingAccount, setSavingAccount] = useState('');
  const registeredUsers = buildRegisteredUsers(users, empleados, clientes);
  const normalizedSearch = search.trim().toLocaleLowerCase('es');
  const filteredUsers = registeredUsers.filter((user) => {
    const matchesType = filter === 'Todos' || user.tipo_usuario === filter;
    const searchable = [user.nombre, user.email, user.cargo, user.rol]
      .join(' ')
      .toLocaleLowerCase('es');
    return matchesType && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
  const loadAuthAccounts = async () => {
    const response = await fetch('/api/auth/admin/users');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudieron leer las cuentas.');
    setAuthAccounts(data.users || []);
  };
  useEffect(() => { void loadAuthAccounts().catch((error) => setCredentialError(error instanceof Error ? error.message : 'No se pudieron leer las cuentas.')); }, []);
  const saveCredentials = async (id: string) => {
    setSavingAccount(id); setCredentialError(''); setCredentialMessage('');
    const draft = credentialDrafts[id];
    try {
      const response = await fetch('/api/auth/admin/credentials', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, username: draft?.username, password: draft?.password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron guardar las credenciales.');
      setCredentialMessage(data.message); setCredentialDrafts((previous) => ({ ...previous, [id]: { username: '', password: '' } }));
      await loadAuthAccounts();
    } catch (error) { setCredentialError(error instanceof Error ? error.message : 'No se pudieron guardar las credenciales.'); }
    finally { setSavingAccount(''); }
  };
  const counts = {
    Administrador: registeredUsers.filter((user) => user.tipo_usuario === 'Administrador').length,
    Empleado: registeredUsers.filter((user) => user.tipo_usuario === 'Empleado').length,
    Cliente: registeredUsers.filter((user) => user.tipo_usuario === 'Cliente').length,
  };
  const syncUsersSheet = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const result = await uploadSingleTableToGoogleSheets('Usuarios', registeredUsers);
      setSyncMessage(`Google Sheets actualizado con ${result.count} registros.`);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'No se pudo actualizar Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        title="Usuarios Registrados"
        items={[{ label: 'Otros' }, { label: 'Usuarios Registrados' }]}
        actions={
          <button
            type="button"
            onClick={syncUsersSheet}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-lg bg-[#152238] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#233b5d] disabled:cursor-wait disabled:opacity-60 dark:bg-[#bd9858] dark:text-[#101b2d] dark:hover:bg-[#dfc58f]"
          >
            <CloudUpload className="h-4 w-4" />
            {isSyncing ? 'Sincronizando…' : 'Actualizar hoja Usuarios'}
          </button>
        }
      />
      {syncMessage && (
        <p role="status" className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {syncMessage}
        </p>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          ['Todos', registeredUsers.length],
          ['Administrador', counts.Administrador],
          ['Empleado', counts.Empleado],
          ['Cliente', counts.Cliente],
        ] as const).map(([type, count]) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`rounded-xl border p-4 text-left transition-colors ${filter === type
              ? 'border-[#bd9858] bg-[#bd9858]/10 shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#bd9858]/60 dark:border-slate-700 dark:bg-slate-900'}`}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{type === 'Todos' ? 'Registros' : type === 'Administrador' ? 'Administradores' : type === 'Empleado' ? 'Empleados' : 'Clientes'}</span>
            <span className="mt-1 block text-2xl font-bold text-slate-900 dark:text-white">{count}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Users className="h-4 w-4 text-[#bd9858]" />
            <span>Directorio de usuarios</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">{filteredUsers.length}</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o documento"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-[#bd9858] focus:ring-2 focus:ring-[#bd9858]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo de usuario</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Cargo / rol</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{user.nombre || 'Sin nombre'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[#bd9858]/30 bg-[#bd9858]/10 px-2.5 py-1 text-[10px] font-bold text-[#8b692e] dark:text-[#dfc58f]">{user.tipo_usuario}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700 dark:text-slate-200">{user.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{user.cargo || user.rol || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.estado
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {user.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No hay usuarios que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Acceso al sistema</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Asigna usuario y contraseña a cada cuenta. Las contraseñas se guardan únicamente como hash.</p>
        </div>
        {credentialMessage && <p role="status" className="m-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{credentialMessage}</p>}
        {credentialError && <p role="alert" className="m-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">{credentialError}</p>}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {authAccounts.map((account) => {
            const draft = credentialDrafts[account.id] || { username: account.username, password: '' };
            return <div key={account.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <div><p className="text-xs font-semibold text-slate-900 dark:text-white">{account.name || 'Cuenta'}</p><p className="mt-1 text-[11px] text-slate-500">{account.email} · {account.type === 'admin' ? 'Administrador' : account.type === 'employee' ? 'Empleado' : 'Cliente'}</p><p className="mt-1 text-[10px] text-slate-400">{account.configured ? 'Credenciales configuradas' : 'Sin credenciales'}</p></div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Usuario<input value={draft.username} onChange={(event) => setCredentialDrafts((previous) => ({ ...previous, [account.id]: { ...draft, username: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{account.configured ? 'Nueva contraseña' : 'Contraseña inicial'}<input type="password" autoComplete="new-password" placeholder="Mínimo 10 caracteres" value={draft.password} onChange={(event) => setCredentialDrafts((previous) => ({ ...previous, [account.id]: { ...draft, password: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label>
              <button disabled={savingAccount === account.id} onClick={() => void saveCredentials(account.id)} className="rounded-lg bg-[#152238] px-4 py-2 text-xs font-semibold text-white hover:bg-[#233b5d] disabled:opacity-50 dark:bg-[#bd9858] dark:text-[#101b2d]">{savingAccount === account.id ? 'Guardando…' : 'Guardar'}</button>
            </div>;
          })}
          {authAccounts.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-500">No hay filas en la hoja Usuarios.</p>}
        </div>
      </section>
    </div>
  );
};

/* ================= USUARIOS Y ROLES ================= */
export const UsuariosRolesView: React.FC = () => {
  const { users, roles } = useApp();

  return (
    <div>
      <Breadcrumb
        title="Usuarios del Sistema y Permisos de Roles"
        items={[{ label: 'Otros' }, { label: 'Usuarios y Roles' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users list */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600" />
              <span>Usuarios Registrados</span>
            </span>
          </div>
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Usuario</th>
                <th className="px-4 py-2.5">Correo</th>
                <th className="px-4 py-2.5 text-center">Rol Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Roles and permissions matrix */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-4 h-4 text-red-500" />
              <span>Roles y Matriz de Permisos (Spatie)</span>
            </span>
          </div>
          <div className="p-4 space-y-4">
            {roles.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs uppercase text-slate-900">{r.nombre}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    {r.permisos.length} permisos
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.permisos.map((perm, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
