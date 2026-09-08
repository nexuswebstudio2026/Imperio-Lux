import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Cliente, Proveedor } from '../../types';
import { Users, Truck, Plus, Edit2, Trash2, X, Search, Building2, User } from 'lucide-react';

/* ================= CLIENTES ================= */
export const ClienteListView: React.FC = () => {
  const { clientes, addCliente, updateCliente, deleteCliente, documentos } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [tipoPersona, setTipoPersona] = useState<'Natural' | 'Juridica'>('Natural');
  const [razonSocial, setRazonSocial] = useState('');
  const [documentoId, setDocumentoId] = useState<number>(1);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const openNew = () => {
    setEditingId(null);
    setTipoPersona('Natural');
    setRazonSocial('');
    setDocumentoId(1);
    setNumeroDocumento('');
    setEmail('');
    setTelefono('');
    setDireccion('');
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingId(c.id);
    setTipoPersona(c.tipo_persona);
    setRazonSocial(c.razon_social);
    setDocumentoId(c.documento_id);
    setNumeroDocumento(c.numero_documento);
    setEmail(c.email || '');
    setTelefono(c.telefono || '');
    setDireccion(c.direccion || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razonSocial.trim()) return;

    if (editingId) {
      updateCliente(editingId, {
        tipo_persona: tipoPersona,
        razon_social: razonSocial,
        documento_id: Number(documentoId),
        numero_documento: numeroDocumento,
        email,
        telefono,
        direccion,
      });
    } else {
      addCliente({
        tipo_persona: tipoPersona,
        razon_social: razonSocial,
        documento_id: Number(documentoId),
        numero_documento: numeroDocumento,
        email,
        telefono,
        direccion,
        estado: true,
      });
    }
    setModalOpen(false);
  };

  const filtered = clientes.filter(
    (c) =>
      c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      c.numero_documento.includes(search) ||
      (c.telefono && c.telefono.includes(search))
  );

  return (
    <div>
      <Breadcrumb
        title="Clientes"
        items={[{ label: 'Módulos' }, { label: 'Clientes' }]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Cliente</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por documento o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 pl-8 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nombre / Razón Social</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Teléfono / Correo</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const doc = documentos.find((d) => d.id === c.documento_id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                      {c.tipo_persona === 'Juridica' ? (
                        <Building2 className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <User className="w-4 h-4 text-cyan-500" />
                      )}
                      <span>{c.razon_social}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                        {c.tipo_persona}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      {doc?.nombre}: {c.numero_documento}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{c.telefono || '-'}</div>
                      <div className="text-[10px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                      {c.direccion || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateCliente(c.id, { estado: !c.estado })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          c.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {c.estado ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar cliente "${c.razon_social}"?`)) deleteCliente(c.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Cliente' : 'Crear Cliente'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Persona:</label>
                  <select
                    value={tipoPersona}
                    onChange={(e) => {
                      const tp = e.target.value as any;
                      setTipoPersona(tp);
                      if (tp === 'Juridica') setDocumentoId(2);
                      else setDocumentoId(1);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Natural">Persona Natural</option>
                    <option value="Juridica">Persona Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Documento:</label>
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tipoPersona === 'Juridica' ? 'Razón Social:' : 'Nombre Completo:'}
                </label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    N° Documento:
                  </label>
                  <input
                    type="text"
                    required
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
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
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
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

/* ================= PROVEEDORES ================= */
export const ProveedorListView: React.FC = () => {
  const { proveedores, addProveedor, updateProveedor, deleteProveedor, documentos } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [tipoPersona, setTipoPersona] = useState<'Natural' | 'Juridica'>('Juridica');
  const [razonSocial, setRazonSocial] = useState('');
  const [documentoId, setDocumentoId] = useState<number>(2);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const openNew = () => {
    setEditingId(null);
    setTipoPersona('Juridica');
    setRazonSocial('');
    setDocumentoId(2);
    setNumeroDocumento('');
    setEmail('');
    setTelefono('');
    setDireccion('');
    setModalOpen(true);
  };

  const openEdit = (p: Proveedor) => {
    setEditingId(p.id);
    setTipoPersona(p.tipo_persona);
    setRazonSocial(p.razon_social);
    setDocumentoId(p.documento_id);
    setNumeroDocumento(p.numero_documento);
    setEmail(p.email || '');
    setTelefono(p.telefono || '');
    setDireccion(p.direccion || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razonSocial.trim()) return;

    if (editingId) {
      updateProveedor(editingId, {
        tipo_persona: tipoPersona,
        razon_social: razonSocial,
        documento_id: Number(documentoId),
        numero_documento: numeroDocumento,
        email,
        telefono,
        direccion,
      });
    } else {
      addProveedor({
        tipo_persona: tipoPersona,
        razon_social: razonSocial,
        documento_id: Number(documentoId),
        numero_documento: numeroDocumento,
        email,
        telefono,
        direccion,
        estado: true,
      });
    }
    setModalOpen(false);
  };

  const filtered = proveedores.filter(
    (p) =>
      p.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      p.numero_documento.includes(search)
  );

  return (
    <div>
      <Breadcrumb
        title="Proveedores"
        items={[{ label: 'Módulos' }, { label: 'Proveedores' }]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Proveedor</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por RUC o Razón Social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 pl-8 text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Razón Social</th>
                <th className="px-4 py-3">Documento (RUC)</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span>{p.razon_social}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                    {p.numero_documento}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{p.telefono || '-'}</div>
                    <div className="text-[10px] text-slate-400">{p.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                    {p.direccion || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => updateProveedor(p.id, { estado: !p.estado })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        p.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.estado ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar proveedor "${p.razon_social}"?`)) deleteProveedor(p.id);
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
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Proveedor' : 'Crear Proveedor'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razón Social:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Alimenticia S.A."
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RUC / Doc:</label>
                  <input
                    type="text"
                    required
                    placeholder="20..."
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
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
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold cursor-pointer"
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
