import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Producto } from '../../types';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
  Barcode,
  Eye,
  Filter,
} from 'lucide-react';

export const ProductoListView: React.FC = () => {
  const {
    productos,
    addProducto,
    updateProducto,
    deleteProducto,
    marcas,
    presentaciones,
    categorias,
    currentMoneda,
    setActiveTab,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<number | 'Todas'>('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [marcaId, setMarcaId] = useState<number>(marcas[0]?.id || 1);
  const [presentacionId, setPresentacionId] = useState<number>(presentaciones[0]?.id || 1);
  const [selectedCats, setSelectedCats] = useState<number[]>([categorias[0]?.id || 1]);
  const [cantidad, setCantidad] = useState<number>(0);
  const [precioCompra, setPrecioCompra] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);

  const openNewModal = () => {
    setEditingId(null);
    setCodigo(String(Math.floor(775000000000 + Math.random() * 999999999)));
    setNombre('');
    setDescripcion('');
    setFechaVencimiento('2027-12-31');
    setMarcaId(marcas[0]?.id || 1);
    setPresentacionId(presentaciones[0]?.id || 1);
    setSelectedCats([categorias[0]?.id || 1]);
    setCantidad(10);
    setPrecioCompra(2.50);
    setPrecioVenta(4.00);
    setModalOpen(true);
  };

  const openEditModal = (p: Producto) => {
    setEditingId(p.id);
    setCodigo(p.codigo);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setFechaVencimiento(p.fecha_vencimiento || '');
    setMarcaId(p.marca_id);
    setPresentacionId(p.presentacione_id);
    setSelectedCats(p.categoria_ids || []);
    setCantidad(p.cantidad);
    setPrecioCompra(p.precio_compra);
    setPrecioVenta(p.precio_venta);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (editingId) {
      updateProducto(editingId, {
        codigo,
        nombre,
        descripcion,
        fecha_vencimiento: fechaVencimiento,
        marca_id: marcaId,
        presentacione_id: presentacionId,
        categoria_ids: selectedCats,
        cantidad,
        precio_compra: Number(precioCompra),
        precio_venta: Number(precioVenta),
      });
    } else {
      addProducto({
        codigo,
        nombre,
        descripcion,
        fecha_vencimiento: fechaVencimiento,
        marca_id: marcaId,
        presentacione_id: presentacionId,
        categoria_ids: selectedCats,
        cantidad,
        precio_compra: Number(precioCompra),
        precio_venta: Number(precioVenta),
        estado: true,
      });
    }
    setModalOpen(false);
  };

  const filteredProductos = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.includes(search) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(search.toLowerCase()));

    const matchesCat =
      filterCat === 'Todas' || (p.categoria_ids && p.categoria_ids.includes(filterCat));

    return matchesSearch && matchesCat;
  });

  return (
    <div>
      <Breadcrumb
        title="Catálogo de Productos"
        items={[{ label: 'Módulos' }, { label: 'Productos' }]}
        actions={
          <button
            id="btn-nuevo-producto"
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Producto</span>
          </button>
        }
      />

      {/* Toolbar filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por código de barra o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 pl-8 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Categoría:</span>
          <select
            value={filterCat}
            onChange={(e) =>
              setFilterCat(e.target.value === 'Todas' ? 'Todas' : Number(e.target.value))
            }
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Todas">Todas las Categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre / Descripción</th>
                <th className="px-4 py-3">Marca / Pres.</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((prod) => {
                  const marca = marcas.find((m) => m.id === prod.marca_id);
                  const pres = presentaciones.find((pr) => pr.id === prod.presentacione_id);
                  const isLowStock = prod.cantidad <= 5;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prod.codigo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{prod.nombre}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{prod.descripcion}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="font-medium text-slate-800">{marca?.nombre || 'General'}</span>
                        <span className="block text-[10px] text-slate-400">
                          {pres?.nombre} ({pres?.sigla})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isLowStock
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 text-red-600" />}
                          <span>{prod.cantidad}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {currentMoneda.simbolo} {prod.precio_compra.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {currentMoneda.simbolo} {prod.precio_venta.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => updateProducto(prod.id, { estado: !prod.estado })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            prod.estado
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {prod.estado ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar el producto "${prod.nombre}"?`)) {
                                deleteProducto(prod.id);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>{editingId ? 'Editar Producto' : 'Registrar Nuevo Producto'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código de Barras:
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha Vencimiento:
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Producto:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Leche Evaporada Gloria 400g"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción:
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca:</label>
                  <select
                    value={marcaId}
                    onChange={(e) => setMarcaId(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Presentación:
                  </label>
                  <select
                    value={presentacionId}
                    onChange={(e) => setPresentacionId(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    {presentaciones.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.nombre} ({pr.sigla})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Categoría:
                </label>
                <select
                  value={selectedCats[0] || categorias[0]?.id}
                  onChange={(e) => setSelectedCats([Number(e.target.value)])}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stock Inicial:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    P. Compra ({currentMoneda.simbolo}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioCompra}
                    onChange={(e) => setPrecioCompra(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    P. Venta ({currentMoneda.simbolo}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 font-bold text-emerald-700"
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                >
                  {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
