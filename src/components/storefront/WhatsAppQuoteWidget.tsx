import React, { FormEvent, useMemo, useState } from 'react';
import { MessageCircle, Minus, Plus, Send, X } from 'lucide-react';

interface QuoteProduct {
  id: number;
  nombre: string;
  precio_venta: number;
  estado: boolean;
  categoria_id: number;
}

interface QuoteCategory {
  id: number;
  nombre: string;
}

interface WhatsAppQuoteWidgetProps {
  businessName: string;
  businessPhone: string;
  products: QuoteProduct[];
  categories: QuoteCategory[];
  loading: boolean;
  formatCurrency: (value: number) => string;
}

const formatWhatsAppPhone = (value: string): string => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // The store is based in Colombia; accept a local 10-digit mobile number too.
  if (digits.length === 10) digits = `57${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : '';
};

export const WhatsAppQuoteWidget: React.FC<WhatsAppQuoteWidgetProps> = ({
  businessName,
  businessPhone,
  products,
  categories,
  loading,
  formatCurrency,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const destinationNumber = useMemo(() => formatWhatsAppPhone(businessPhone), [businessPhone]);
  const selectedProducts = products.filter((product) => selectedIds.includes(product.id));
  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === 'all'
      || (categoryFilter === 'uncategorized' ? !product.categoria_id : String(product.categoria_id) === categoryFilter);
    const matchesSearch = product.nombre.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'));
    return matchesCategory && matchesSearch;
  });
  const quoteTotal = selectedProducts.reduce(
    (total, product) => total + (Number(product.precio_venta) || 0) * (quantities[product.id] || 1),
    0,
  );

  const toggleProduct = (id: number) => {
    setError('');
    setSelectedIds((previous) => previous.includes(id)
      ? previous.filter((selectedId) => selectedId !== id)
      : [...previous, id]);
    setQuantities((previous) => ({ ...previous, [id]: previous[id] || 1 }));
  };

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFallbackUrl('');
    if (!destinationNumber) {
      setError('El negocio todavía no tiene un número de WhatsApp válido configurado.');
      return;
    }
    if (selectedProducts.length === 0) {
      setError('Selecciona al menos un producto para preparar la cotización.');
      return;
    }

    const whatsappWindow = window.open('about:blank', '_blank');
    setSubmitting(true);
    try {
      const response = await fetch('/api/storefront/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: customerPhone.trim(),
          email: email.trim(),
          items: selectedProducts.map((product) => ({ id: product.id, quantity: quantities[product.id] || 1 })),
        }),
      });
      const result = await response.json() as {
        error?: string;
        id: string;
        total: number;
        items: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
        pdfUrl: string;
      };
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la cotización. Intenta nuevamente.');

      const lines = result.items.map((item) => `• ${item.name} × ${item.quantity}\n  Precio de venta: ${formatCurrency(item.unitPrice)} c/u — ${formatCurrency(item.lineTotal)}`);
      const message = [
        `Hola, ${businessName || 'Imperio Lux'}. Quisiera solicitar una cotización:`,
        `Cotización: ${result.id}`,
        '',
        `Nombre: ${name.trim()}`,
        `WhatsApp de contacto: ${customerPhone.trim()}`,
        email.trim() ? `Correo: ${email.trim()}` : '',
        '',
        'Productos seleccionados:',
        ...lines,
        '',
        `Total estimado: ${formatCurrency(result.total)}`,
        `PDF de la cotización: ${result.pdfUrl}`,
        '',
        'Por favor, confirmen disponibilidad y condiciones. Gracias.',
      ].filter(Boolean).join('\n');
      const url = `https://wa.me/${destinationNumber}?text=${encodeURIComponent(message)}`;
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        whatsappWindow.location.href = url;
        setOpen(false);
      } else {
        setFallbackUrl(url);
        setError('La cotización se guardó, pero el navegador bloqueó WhatsApp. Usa el enlace para continuar.');
      }
    } catch (submitError) {
      whatsappWindow?.close();
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la cotización. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(''); }}
        aria-label="Solicitar cotización por WhatsApp"
        className="storefront-whatsapp-trigger fixed bottom-5 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#168c57] text-white shadow-[0_14px_36px_rgba(15,67,43,.32)] transition hover:-translate-y-0.5 hover:bg-[#117749] focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#101827]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-quote-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-[#111d30] dark:text-slate-100 sm:rounded-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#9b7b3e]">Asesoría personal</p>
                <h2 id="whatsapp-quote-title" className="mt-2 font-serif text-2xl sm:text-3xl">Prepara tu cotización</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Elige una o varias piezas y continúa la conversación por WhatsApp.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar cotización" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitQuote} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold">Nombre completo
                  <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-[#b89652] focus:ring-2 focus:ring-[#b89652]/20 dark:border-slate-700 dark:bg-[#0c1627]" placeholder="¿Cómo te llamas?" />
                </label>
                <label className="text-xs font-semibold">WhatsApp de contacto
                  <input required type="tel" autoComplete="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-[#b89652] focus:ring-2 focus:ring-[#b89652]/20 dark:border-slate-700 dark:bg-[#0c1627]" placeholder="Tu número con indicativo" />
                </label>
                <label className="text-xs font-semibold sm:col-span-2">Correo electrónico <span className="font-normal text-slate-400">(opcional)</span>
                  <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-[#b89652] focus:ring-2 focus:ring-[#b89652]/20 dark:border-slate-700 dark:bg-[#0c1627]" placeholder="tu@correo.com" />
                </label>
              </div>

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[.12em]">Productos para cotizar <span className="ml-1 font-normal text-slate-500">({products.length})</span></legend>
                <label className="mt-3 block text-xs font-semibold">Buscar producto
                  <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-[#b89652] focus:ring-2 focus:ring-[#b89652]/20 dark:border-slate-700 dark:bg-[#0c1627]" placeholder="Escribe el nombre del producto" />
                </label>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar productos por categoría">
                  <button type="button" onClick={() => setCategoryFilter('all')} aria-pressed={categoryFilter === 'all'} className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${categoryFilter === 'all' ? 'border-[#9b7b3e] bg-[#f7f3e9] text-[#765b2d] dark:bg-[#27334a] dark:text-[#e4d4ad]' : 'border-slate-200 dark:border-slate-700'}`}>Todas</button>
                  {categories.map((category) => (
                    <button key={category.id} type="button" onClick={() => setCategoryFilter(String(category.id))} aria-pressed={categoryFilter === String(category.id)} className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${categoryFilter === String(category.id) ? 'border-[#9b7b3e] bg-[#f7f3e9] text-[#765b2d] dark:bg-[#27334a] dark:text-[#e4d4ad]' : 'border-slate-200 dark:border-slate-700'}`}>{category.nombre}</button>
                  ))}
                  {products.some((product) => !product.categoria_id) && <button type="button" onClick={() => setCategoryFilter('uncategorized')} aria-pressed={categoryFilter === 'uncategorized'} className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${categoryFilter === 'uncategorized' ? 'border-[#9b7b3e] bg-[#f7f3e9] text-[#765b2d] dark:bg-[#27334a] dark:text-[#e4d4ad]' : 'border-slate-200 dark:border-slate-700'}`}>Sin categoría</button>}
                </div>
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                  {loading ? <p className="px-3 py-5 text-center text-sm text-slate-500">Cargando todos los productos del catálogo…</p> : filteredProducts.length ? filteredProducts.map((product) => {
                    const selected = selectedIds.includes(product.id);
                    return (
                      <div key={product.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${selected ? 'bg-[#f7f3e9] dark:bg-[#27334a]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'}`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleProduct(product.id)} aria-label={`Agregar ${product.nombre} a la cotización`} className="h-4 w-4 accent-[#987437]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.nombre}</p>
                          <p className="mt-0.5 text-xs text-[#94713b]">{formatCurrency(Number(product.precio_venta) || 0)} <span className="text-slate-400">precio de venta</span></p>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-2" aria-label={`Cantidad de ${product.nombre}`}>
                            <button type="button" onClick={() => setQuantities((previous) => ({ ...previous, [product.id]: Math.max(1, (previous[product.id] || 1) - 1) }))} aria-label={`Quitar una unidad de ${product.nombre}`} className="rounded-full border border-slate-200 p-1.5 dark:border-slate-600"><Minus className="h-3 w-3" /></button>
                            <span className="w-5 text-center text-sm font-semibold">{quantities[product.id] || 1}</span>
                            <button type="button" onClick={() => setQuantities((previous) => ({ ...previous, [product.id]: Math.min(99, (previous[product.id] || 1) + 1) }))} aria-label={`Agregar una unidad de ${product.nombre}`} className="rounded-full border border-slate-200 p-1.5 dark:border-slate-600"><Plus className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>
                    );
                  }) : products.length ? <p className="px-3 py-5 text-center text-sm text-slate-500">No hay productos que coincidan con los filtros.</p> : <p className="px-3 py-5 text-center text-sm text-slate-500">No hay productos activos disponibles para cotizar.</p>}
                </div>
              </fieldset>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-[#0c1627]">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total estimado</span>
                <strong className="text-lg text-[#8b692e]">{formatCurrency(quoteTotal)}</strong>
              </div>

              {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
              {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm font-semibold text-[#168c57] underline">Abrir cotización en WhatsApp</a>}
              {!destinationNumber && <p className="text-xs text-amber-700 dark:text-amber-300">WhatsApp del negocio pendiente de configurar en los datos de empresa.</p>}
              <p className="text-[11px] leading-5 text-slate-400">Al continuar, guardaremos la cotización en Google Sheets, generaremos su PDF y abriremos WhatsApp con el enlace para revisarlo antes de enviarlo.</p>

              <button type="submit" disabled={!products.length || loading || submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#168c57] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#117749] disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-4 w-4" /> {submitting ? 'Guardando cotización…' : 'Continuar en WhatsApp'}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
};
