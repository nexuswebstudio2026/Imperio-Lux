import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Categoria, Presentacion, Marca } from '../../types';
import { Tag, Package, Megaphone, Plus, Edit2, Trash2, X } from 'lucide-react';

/* ================= CATEGORÍAS ================= */
export const CategoriaView: React.FC = () => {
  const { categorias, addCategoria, updateCategoria, deleteCategoria } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const openNew = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setModalOpen(true);
  };

  const openEdit = (c: Categoria) => {
    setEditingId(c.id);
    setNombre(c.nombre);
    setDescripcion(c.descripcion || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (editingId) {
      updateCategoria(editingId, { nombre, descripcion });
    } else {
      addCategoria({ nombre, descripcion, estado: true });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <Breadcrumb
        title="Categorías de Productos"
        items={[{ label: 'Módulos' }, { label: 'Categorías' }]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Categoría</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categorias.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">#{c.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>{c.nombre}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{c.descripcion || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => updateCategoria(c.id, { estado: !c.estado })}
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
                        if (confirm(`¿Eliminar categoría "${c.nombre}"?`)) deleteCategoria(c.id);
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
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
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

/* ================= PRESENTACIONES ================= */
export const PresentacionView: React.FC = () => {
  const { presentaciones, addPresentacion, updatePresentacion, deletePresentacion } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [sigla, setSigla] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const openNew = () => {
    setEditingId(null);
    setNombre('');
    setSigla('');
    setDescripcion('');
    setModalOpen(true);
  };

  const openEdit = (p: Presentacion) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setSigla(p.sigla);
    setDescripcion(p.descripcion || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !sigla.trim()) return;
    if (editingId) {
      updatePresentacion(editingId, { nombre, sigla: sigla.toUpperCase(), descripcion });
    } else {
      addPresentacion({ nombre, sigla: sigla.toUpperCase(), descripcion, estado: true });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <Breadcrumb
        title="Presentaciones de Productos"
        items={[{ label: 'Módulos' }, { label: 'Presentaciones' }]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Presentación</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 text-center">Sigla</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {presentaciones.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">#{p.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-purple-500" />
                  <span>{p.nombre}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-mono font-bold rounded text-[11px]">
                    {p.sigla}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.descripcion || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => updatePresentacion(p.id, { estado: !p.estado })}
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
                        if (confirm(`¿Eliminar presentación "${p.nombre}"?`)) deletePresentacion(p.id);
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
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Presentación' : 'Nueva Presentación'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Unidad / Caja"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sigla:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: UND / CJ"
                  maxLength={6}
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value.toUpperCase())}
                  className="w-full uppercase font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold cursor-pointer"
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

/* ================= MARCAS ================= */
export const MarcaView: React.FC = () => {
  const { marcas, addMarca, updateMarca, deleteMarca } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const openNew = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setModalOpen(true);
  };

  const openEdit = (m: Marca) => {
    setEditingId(m.id);
    setNombre(m.nombre);
    setDescripcion(m.descripcion || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (editingId) {
      updateMarca(editingId, { nombre, descripcion });
    } else {
      addMarca({ nombre, descripcion, estado: true });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <Breadcrumb
        title="Marcas de Fabricantes"
        items={[{ label: 'Módulos' }, { label: 'Marcas' }]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Marca</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marcas.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">#{m.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5 text-rose-500" />
                  <span>{m.nombre}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{m.descripcion || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => updateMarca(m.id, { estado: !m.estado })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      m.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.estado ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(m)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar marca "${m.nombre}"?`)) deleteMarca(m.id);
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
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Marca' : 'Nueva Marca'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nestlé"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
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
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
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
