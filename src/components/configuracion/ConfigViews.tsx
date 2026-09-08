import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Empleado } from '../../types';
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
