import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Compra } from '../../types';
import {
  Store,
  Plus,
  Search,
  Eye,
  X,
  FileText,
  Truck,
} from 'lucide-react';

export const CompraListView: React.FC = () => {
  const { compras, proveedores, currentMoneda, setActiveTab } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);

  const filteredCompras = compras.filter((c) => {
    const prov = proveedores.find((p) => p.id === c.proveedor_id);
    return (
      c.numero_comprobante.toLowerCase().includes(search.toLowerCase()) ||
      (prov && prov.razon_social.toLowerCase().includes(search.toLowerCase())) ||
      c.fecha_hora.includes(search)
    );
  });

  const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);

  return (
    <div>
      <Breadcrumb
        title="Historial de Compras"
        items={[{ label: 'Compras', tab: 'compras' }, { label: 'Ver Compras' }]}
        actions={
          <button
            onClick={() => setActiveTab('compras_create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Realizar Nueva Compra</span>
          </button>
        }
      />

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Total de Órdenes de Compra</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{compras.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Monto Invertido en Mercadería</p>
            <p className="text-2xl font-bold text-violet-700 mt-0.5">
              {currentMoneda.simbolo} {totalCompras.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por comprobante o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 pl-8 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-center">Artículos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron órdenes de compra.
                  </td>
                </tr>
              ) : (
                filteredCompras.map((compra) => {
                  const prov = proveedores.find((p) => p.id === compra.proveedor_id);
                  const totalUnits = compra.items.reduce((sum, it) => sum + it.cantidad, 0);
                  return (
                    <tr key={compra.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {compra.numero_comprobante}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{compra.fecha_hora}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {prov?.razon_social || 'Proveedor'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                          {totalUnits} unid. ({compra.items.length} prod.)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {currentMoneda.simbolo} {compra.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedCompra(compra)}
                          className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Details */}
      {selectedCompra && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                <span>Detalle de Compra {selectedCompra.numero_comprobante}</span>
              </h3>
              <button
                onClick={() => setSelectedCompra(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
              <p>
                <strong>Proveedor:</strong>{' '}
                {proveedores.find((p) => p.id === selectedCompra.proveedor_id)?.razon_social}
              </p>
              <p>
                <strong>Fecha de registro:</strong> {selectedCompra.fecha_hora}
              </p>
            </div>

            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2 text-center">Cantidad</th>
                    <th className="px-3 py-2 text-right">Costo Unit.</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCompra.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {item.nombre_producto}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{item.cantidad}</td>
                      <td className="px-3 py-2 text-right">
                        {currentMoneda.simbolo} {item.precio_compra.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        {currentMoneda.simbolo} {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 text-right text-slate-600">
                      Total Compra:
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold text-violet-700 text-sm">
                      {currentMoneda.simbolo} {selectedCompra.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCompra(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
