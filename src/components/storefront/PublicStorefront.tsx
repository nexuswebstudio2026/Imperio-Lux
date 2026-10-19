import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Clock3, Download, House, Laptop, LogIn, Mail, MapPin, MessageCircle, MonitorDown, Moon, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Sun, Truck, UsersRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PUBLIC_SECTION_ROUTES } from '../../lib/routes';
import { WhatsAppQuoteWidget } from './WhatsAppQuoteWidget';

const OWNER_WHATSAPP_NUMBER = '573118444853';
const RELEASES_URL = 'https://github.com/nexuswebstudio2026/Imperio-Lux/releases/latest';
const RELEASE_API_URL = 'https://api.github.com/repos/nexuswebstudio2026/Imperio-Lux/releases/latest';

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  html_url: string;
  assets: GitHubReleaseAsset[];
}

interface SystemVersionInfo {
  releaseVersion: string | null;
}

interface StorefrontProduct {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  categoria_id: number;
  marca_id: number;
  precio_venta: number;
  estado: boolean;
}

const appPlatforms = [
  { id: 'android', name: 'Android', detail: 'Teléfonos y tabletas Android', icon: Smartphone, match: (name: string) => name.endsWith('.apk') },
  { id: 'ios', name: 'iOS', detail: 'iPhone y iPad · App Store / TestFlight', icon: Smartphone, match: (_name: string) => false },
  { id: 'windows', name: 'Windows', detail: 'Instalador para equipos Windows', icon: MonitorDown, match: (name: string) => /\.(exe|msi)$/.test(name) },
  { id: 'mac', name: 'macOS', detail: 'Mac · imagen de instalación', icon: Laptop, match: (name: string) => /\.(dmg|pkg)$/.test(name) },
] as const;

interface StorefrontCatalogData {
  products: StorefrontProduct[];
  categories: Array<Pick<ReturnType<typeof useApp>['categorias'][number], 'id' | 'nombre' | 'descripcion' | 'estado'>>;
  brands: Array<Pick<ReturnType<typeof useApp>['marcas'][number], 'id' | 'nombre' | 'descripcion' | 'estado'>>;
}

interface PublicStorefrontProps {
  currentPath: string;
  onAdminLogin: () => void;
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({ currentPath, onAdminLogin }) => {
  const { empresa, productos, categorias, marcas, formatCurrency, theme, toggleTheme } = useApp();
  const [catalogData, setCatalogData] = useState<StorefrontCatalogData | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [siteVersion, setSiteVersion] = useState<string | null>(null);
  const visibleProducts: StorefrontProduct[] = catalogData?.products ?? productos.map((product) => ({
    id: product.id,
    nombre: product.nombre,
    descripcion: product.descripcion,
    imagen: product.imagen || '',
    categoria_id: product.categoria_ids?.[0] || 0,
    marca_id: product.marca_id,
    precio_venta: product.precio_venta,
    estado: product.estado,
  }));
  const visibleCategories = catalogData?.categories ?? categorias;
  const visibleBrands = catalogData?.brands ?? marcas;
  const activeProducts = visibleProducts.filter((product) => product.estado);
  const featuredProducts = currentPath === '/catalogo' ? activeProducts : activeProducts.slice(0, 4);
  const featuredCategories = visibleCategories.filter((category) => category.estado).slice(0, 4);
  const phone = OWNER_WHATSAPP_NUMBER;
  const whatsapp = `https://wa.me/${phone}`;
  const mobileNavigation = [
    { href: '/', label: 'Inicio', icon: House },
    { href: '/catalogo', label: 'Catálogo', icon: ShoppingBag },
    { href: '/nosotros', label: 'Nosotros', icon: UsersRound },
    { href: '/contacto', label: 'Contacto', icon: MessageCircle },
    { href: '/acceso', label: 'Acceder', icon: LogIn },
  ];

  useEffect(() => {
    let active = true;
    fetch('/api/storefront/catalog')
      .then(async (response) => {
        const data = await response.json() as StorefrontCatalogData & { error?: string };
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo desde Google Sheets.');
        if (!Array.isArray(data.products) || !Array.isArray(data.categories) || !Array.isArray(data.brands)) {
          throw new Error('La respuesta del catálogo tiene un formato inválido.');
        }
        return data;
      })
      .then((data) => { if (active) setCatalogData(data); })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'No se pudo cargar el catálogo desde Google Sheets.';
        setCatalogError(message);
        console.error('No se pudo cargar el catálogo público:', error);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const updateVersion = async () => {
      try {
        const response = await fetch('/api/system/version', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`No se pudo consultar la versión del sitio (HTTP ${response.status}).`);
        const data = await response.json() as SystemVersionInfo;
        if (active && data.releaseVersion) setSiteVersion(data.releaseVersion);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('No se pudo actualizar la versión mostrada en el pie de página:', error);
        }
      }
    };
    let active = true;
    void updateVersion();
    const interval = window.setInterval(() => void updateVersion(), 5 * 60 * 1000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (currentPath !== '/') return;
    const controller = new AbortController();
    fetch(RELEASE_API_URL, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } })
      .then((response) => response.ok ? response.json() as Promise<GitHubRelease> : null)
      .then((data) => { if (data) setRelease(data); })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') console.info('Las descargas de aplicaciones aún no están publicadas.');
      });
    return () => controller.abort();
  }, [currentPath]);

  useEffect(() => {
    const sectionId = PUBLIC_SECTION_ROUTES[currentPath];
    if (!sectionId) return;
    document.getElementById(sectionId)?.scrollIntoView({ block: 'start' });
  }, [currentPath]);

  return (
    <div className="storefront min-h-screen bg-[#f7f5f0] pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-[#171714] md:pb-0" data-theme={theme}>
      <div className="storefront-announcement relative z-50 flex min-h-9 items-center justify-center overflow-hidden bg-[#151512] px-3 py-2 text-center text-[9px] font-medium uppercase leading-4 tracking-[0.12em] text-[#d8c38c] sm:px-4 sm:text-[11px] sm:tracking-[0.22em]">
        <span className="relative z-10 block max-w-full">Una selección extraordinaria · Envíos a todo Colombia</span>
      </div>

      <header className="z-40 border-b border-black/10 bg-[#f7f5f0]/95 backdrop-blur-md md:sticky md:top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-5 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Imperio Lux, inicio">
            <span className="storefront-brand-mark h-10 w-10 shrink-0 overflow-hidden rounded-full sm:h-11 sm:w-11">
              <img src="/assets/imperio-icon.svg" alt="" className="block h-full w-full rounded-full object-cover" />
            </span>
            <span className="font-serif text-base tracking-[0.1em] sm:text-xl sm:tracking-[0.12em]">IMPERIO LUX</span>
          </a>

          <nav aria-label="Navegación principal" className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55534c] md:flex">
            <a className="store-nav-link" href="/">Inicio</a>
            <a className="store-nav-link" href="/catalogo">Catálogo</a>
            <a className="store-nav-link" href="/nosotros">Sobre nosotros</a>
            <a className="store-nav-link" href="/contacto">Contáctenos</a>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'} title={theme === 'dark' ? 'Modo día' : 'Modo noche'} className="inline-flex h-10 w-10 items-center justify-center border border-[#b9b3a5] text-[#5d584c] transition hover:border-[#9b7b3e] hover:text-[#9b7b3e]">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onAdminLogin}
              className="hidden shrink-0 items-center gap-1.5 bg-[#b89652] px-3 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#9c7838] md:inline-flex sm:gap-2 sm:px-5 sm:text-[10px] sm:tracking-[0.16em]"
            >
              Accesos <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <nav aria-label="Navegación móvil" className="store-mobile-nav md:hidden">
        {mobileNavigation.map(({ href, label, icon: Icon }) => {
          const isActive = currentPath === href || (href === '/' && currentPath === '/');
          return (
            <a key={href} href={href} aria-current={isActive ? 'page' : undefined} className={`store-mobile-nav-link${isActive ? ' is-active' : ''}`}>
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>

      <main>
        <section id="inicio" className="relative isolate min-h-[620px] overflow-hidden bg-[#171714] text-white lg:min-h-[690px]">
          <div className="hero-background absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_70%_35%,rgba(184,150,82,0.24),transparent_48%),linear-gradient(110deg,#171714_0%,#202019_54%,#121210_100%)]" />
          <div className="absolute -right-24 top-16 -z-10 h-[490px] w-[490px] rounded-full border border-[#d0b475]/20 lg:right-[8%] lg:top-20 lg:h-[560px] lg:w-[560px]" />
          <div className="absolute right-[-2%] top-1/2 -z-10 hidden h-[430px] w-[430px] -translate-y-1/2 rounded-full border border-[#d0b475]/15 lg:block" />
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-6 py-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d8c38c] sm:text-xs">
                <span className="h-px w-10 bg-[#b89652]" /> Lujo seleccionado, estilo atemporal
              </p>
              <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                El arte de elegir <span className="italic text-[#d8c38c]">lo extraordinario.</span>
              </h1>
              <p className="mt-7 max-w-lg text-sm leading-7 text-white/65 sm:text-base">
                Piezas que cuentan historias. Descubre relojería, joyería, fragancias y accesorios elegidos para acompañarte siempre.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a href="/catalogo" className="store-hero-primary inline-flex items-center gap-3 bg-[#b89652] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#c9a968]">
                  Explorar catálogo <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#descargas" className="inline-flex items-center gap-2 border border-white/25 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 transition hover:border-[#d8c38c] hover:text-[#e5d4a8]">
                  <Download className="h-4 w-4" /> Descargar aplicación
                </a>
                <a href="/nosotros" className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75 transition hover:text-white">Nuestra historia</a>
              </div>
              <div className="mt-16 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-6 text-[10px] uppercase tracking-[0.16em] text-white/55">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d8c38c]" /> Selección de confianza</span>
                <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#d8c38c]" /> Envíos nacionales</span>
              </div>
            </div>

            <div className="relative mx-auto flex h-[380px] w-full max-w-[500px] items-center justify-center lg:h-[500px]">
              <div className="absolute h-[290px] w-[290px] rounded-full border border-[#d8c38c]/35 sm:h-[360px] sm:w-[360px]" />
              <div className="absolute h-[245px] w-[245px] rounded-full bg-[#b89652]/10 blur-3xl sm:h-[310px] sm:w-[310px]" />
              {featuredProducts[0]?.imagen ? (
                <img src={featuredProducts[0].imagen} alt={featuredProducts[0].nombre} className="relative h-[300px] w-[260px] rounded-t-full object-cover shadow-2xl shadow-black/60 sm:h-[390px] sm:w-[330px]" />
              ) : (
                <div className="relative flex h-[300px] w-[260px] items-center justify-center rounded-t-full border border-[#d8c38c]/30 bg-gradient-to-br from-[#d3bd88]/30 via-[#544a34] to-[#191916] shadow-2xl sm:h-[390px] sm:w-[330px]">
                  <Sparkles className="h-20 w-20 text-[#e6d4a4]" strokeWidth={0.8} />
                </div>
              )}
              <div className="absolute bottom-5 left-0 max-w-[220px] border border-white/15 bg-[#171714]/90 p-4 backdrop-blur sm:bottom-10 sm:left-3">
                <p className="text-[9px] uppercase tracking-[0.22em] text-[#d8c38c]">Imperio Lux · Edición selecta</p>
                <p className="mt-2 font-serif text-lg leading-tight">Detalles que dejan huella.</p>
              </div>
              <div className="hero-location-badge absolute right-0 top-7 hidden rounded-full border border-[#d8c38c]/40 px-5 py-3 text-[9px] uppercase tracking-[0.22em] text-[#e4d4ad] sm:block">{empresa.ubicacion || 'Colombia'}</div>
            </div>
          </div>
          <a href="/catalogo" aria-label="Desplazarse al catálogo" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-white/50 lg:flex">
            Descubrir <ArrowDown className="h-3.5 w-3.5" />
          </a>
        </section>

        {currentPath === '/' && (
          <section id="descargas" className="scroll-mt-24 bg-[#eeeae1] px-5 py-16 dark:bg-[#111a28] sm:py-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9b7b3e]">Imperio Lux en tus dispositivos</p>
                  <h2 className="mt-3 font-serif text-4xl text-[#171714] dark:text-white sm:text-5xl">Descarga nuestra aplicación</h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-[#77746c] dark:text-slate-300">Elige tu dispositivo. Las descargas se habilitarán al publicarse cada instalador oficial.</p>
              </div>

              <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {appPlatforms.map(({ id, name, detail, icon: Icon, match }) => {
                  const asset = release?.assets.find(({ name: assetName }) => match(assetName.toLowerCase()));
                  return (
                    <article key={id} className="flex min-h-[215px] flex-col border border-[#d9d3c6] bg-[#f8f6f1] p-5 dark:border-slate-700 dark:bg-[#172337] sm:p-6">
                      <div className="flex items-center justify-between">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e8dfcc] text-[#8b6d35] dark:bg-[#253650] dark:text-[#e0c78f]"><Icon className="h-5 w-5" /></span>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.16em] ${asset ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#8a8170] dark:text-slate-400'}`}>{asset ? 'Disponible' : 'Próximamente'}</span>
                      </div>
                      <h3 className="mt-5 font-serif text-2xl text-[#171714] dark:text-white">{name}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#77746c] dark:text-slate-300">{detail}</p>
                      {asset ? (
                        <a href={asset.browser_download_url} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#17243a] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#263b5b] dark:bg-[#bd9858] dark:text-[#101827] dark:hover:bg-[#d1ae68]" download>
                          <Download className="h-4 w-4" /> Descargar
                        </a>
                      ) : id === 'ios' ? (
                        <button type="button" disabled className="mt-5 inline-flex cursor-not-allowed items-center justify-center rounded-full border border-[#c8c1b3] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a8170] opacity-80 dark:border-slate-600 dark:text-slate-400">
                          App Store próximamente
                        </button>
                      ) : (
                        <a href={release?.html_url || RELEASES_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center justify-center rounded-full border border-[#c8c1b3] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#77746c] transition hover:border-[#9b7b3e] hover:text-[#8b6d35] dark:border-slate-600 dark:text-slate-300 dark:hover:border-[#bd9858] dark:hover:text-[#e0c78f]">
                          Ver disponibilidad
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {currentPath === '/contacto' && (
          <section className="bg-[#eeeae1] px-5 py-16 dark:bg-[#111a28] sm:py-20 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9b7b3e]">Estamos para atenderte</p>
              <h2 className="mt-3 font-serif text-4xl text-[#171714] dark:text-white sm:text-5xl">Contacto</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="border border-[#d9d3c6] bg-[#f8f6f1] p-6 dark:border-slate-700 dark:bg-[#172337]">
                  <MapPin className="h-5 w-5 text-[#9b7b3e]" />
                  <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#77746c] dark:text-slate-400">Ciudad y dirección</h3>
                  <p className="mt-2 text-lg text-[#171714] dark:text-white">{empresa.ubicacion || 'Colombia'}</p>
                  <p className="mt-1 text-sm text-[#77746c] dark:text-slate-300">{empresa.direccion}</p>
                </div>
                <a href={`tel:${empresa.telefono.replace(/[^\d+]/g, '')}`} className="border border-[#d9d3c6] bg-[#f8f6f1] p-6 transition hover:border-[#9b7b3e] dark:border-slate-700 dark:bg-[#172337]">
                  <Clock3 className="h-5 w-5 text-[#9b7b3e]" />
                  <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#77746c] dark:text-slate-400">Teléfono</h3>
                  <p className="mt-2 text-lg text-[#171714] dark:text-white">{empresa.telefono}</p>
                </a>
                <a href={`mailto:${empresa.correo}`} className="border border-[#d9d3c6] bg-[#f8f6f1] p-6 transition hover:border-[#9b7b3e] dark:border-slate-700 dark:bg-[#172337] sm:col-span-2">
                  <Mail className="h-5 w-5 text-[#9b7b3e]" />
                  <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#77746c] dark:text-slate-400">Correo electrónico</h3>
                  <p className="mt-2 text-lg text-[#171714] dark:text-white">{empresa.correo}</p>
                </a>
              </div>
            </div>
          </section>
        )}

        <section id="catalogo" className="scroll-mt-28 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            {catalogError && <p role="alert" className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{catalogError} Se muestran los datos locales disponibles.</p>}
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9b7b3e]">Curaduría Imperio Lux</p>
                <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Un universo de distinción</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#77746c]">Explora piezas escogidas por su diseño, carácter y calidad excepcional.</p>
            </div>

            {featuredCategories.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {featuredCategories.map((category) => (
                  <span key={category.id} className="border border-[#ded9cd] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#66635a]">{category.nombre}</span>
                ))}
              </div>
            )}

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const brand = visibleBrands.find((item) => item.id === product.marca_id)?.nombre;
                return (
                  <article key={product.id} className="group bg-white">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e5dc]">
                      {product.imagen ? (
                        <img src={product.imagen} alt={product.nombre} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#e9e5dc] to-[#c8bd9e]"><Sparkles className="h-10 w-10 text-[#9b7b3e]" /></div>
                      )}
                      <span className="absolute left-3 top-3 bg-[#f7f5f0]/90 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#6f5a31]">Selección Lux</span>
                    </div>
                    <div className="p-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9b7b3e]">{brand || 'Imperio Lux'}</p>
                      <h3 className="mt-2 min-h-[42px] font-serif text-lg leading-snug">{product.nombre}</h3>
                      <div className="mt-4 flex items-center justify-between border-t border-[#eeeae2] pt-3">
                        <span className="text-sm font-semibold">{formatCurrency(product.precio_venta)}</span>
                        <a href={whatsapp} target={phone ? '_blank' : undefined} rel={phone ? 'noreferrer' : undefined} className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8b6d35] hover:text-[#151512]">Consultar</a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {featuredProducts.length === 0 && (
              <div className="mt-8 border border-dashed border-[#d9d3c6] bg-white/60 px-6 py-12 text-center text-sm text-[#77746c]">Pronto encontrarás aquí nuestra selección de productos.</div>
            )}
          </div>
        </section>

        <section id="nosotros" className="scroll-mt-28 bg-[#eae6dd] px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="store-about-panel relative min-h-[360px] overflow-hidden bg-[#26251f] p-8 text-white sm:min-h-[440px] sm:p-12">
              <div className="store-about-glow absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(184,150,82,0.28),transparent_55%)]" />
              <div className="relative flex h-full min-h-[290px] flex-col justify-between border border-[#d8c38c]/30 p-7 sm:min-h-[340px] sm:p-10">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#d8c38c]">Nuestra esencia</p>
                <div>
                  <p className="font-serif text-4xl leading-tight sm:text-5xl">El lujo está en cada detalle.</p>
                  <p className="mt-5 max-w-sm text-xs leading-6 text-white/60">Una experiencia cercana para encontrar piezas con personalidad, autenticidad y belleza duradera.</p>
                </div>
                <span className="text-[9px] uppercase tracking-[0.22em] text-white/40">{empresa.ubicacion || 'Colombia'}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9b7b3e]">Sobre nosotros</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Elegancia con una historia propia.</h2>
              <p className="mt-6 text-sm leading-7 text-[#6f6c64]">En {empresa.nombre || 'Imperio Lux'} creemos que los objetos que elegimos hablan de quiénes somos. Por eso reunimos una colección de relojería, joyería, perfumería y accesorios donde cada pieza tiene algo especial que contar.</p>
              <p className="mt-4 text-sm leading-7 text-[#6f6c64]">Te acompañamos con asesoría personalizada para que encuentres el detalle perfecto, para ti o para alguien importante.</p>
              <div className="mt-9 grid gap-5 border-t border-[#d2ccbf] pt-6 sm:grid-cols-2">
                <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9b7b3e]" /><div><p className="text-xs font-bold">Selección cuidada</p><p className="mt-1 text-xs leading-5 text-[#77746c]">Calidad y diseño en cada colección.</p></div></div>
                <div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#9b7b3e]" /><div><p className="text-xs font-bold">Asesoría personal</p><p className="mt-1 text-xs leading-5 text-[#77746c]">Atención cercana para elegir mejor.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="contacto" className="scroll-mt-28 bg-[#171714] px-5 py-16 text-white sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="relative z-30 max-w-5xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d8c38c]">Contáctenos</p>
              <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">Tu próxima pieza favorita empieza con una conversación.</h2>
              <a href={whatsapp} target={phone ? '_blank' : undefined} rel={phone ? 'noreferrer' : undefined} className="mt-8 inline-flex items-center gap-3 border border-[#b89652] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e5d4a8] transition hover:bg-[#b89652] hover:text-white">Escríbenos <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="relative z-30 mt-12 grid gap-3 border-t border-white/15 pt-6 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex min-w-0 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2 lg:col-span-1">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d8c38c]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8c38c]">Ciudad y dirección</p>
                  <p className="mt-2 break-words text-sm text-white">{empresa.ubicacion || 'Colombia'}</p>
                  <p className="mt-1 break-words text-xs leading-5">{empresa.direccion}</p>
                </div>
              </div>
              <a href={`tel:${String(empresa.telefono || '').replace(/[^\d+]/g, '')}`} className="flex min-w-0 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#b89652] hover:text-white">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#d8c38c]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8c38c]">Teléfono</p>
                  <p className="mt-2 break-words text-sm">{empresa.telefono || 'Atención personalizada'}</p>
                </div>
              </a>
              <a href={`mailto:${empresa.correo}`} className="flex min-w-0 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#b89652] hover:text-white">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#d8c38c]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8c38c]">Correo electrónico</p>
                  <p className="mt-2 break-words text-sm">{empresa.correo}</p>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#11110f] px-5 py-6 text-white/45">
        <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-center text-xs text-white/65">
          <span>© {new Date().getFullYear()}</span>
          <a href="https://nexuswebstudio.vercel.app/" className="font-semibold text-[#d8c38c] hover:text-white">Nexus Web Studio</a>
          <span>Todos los derechos reservados.</span>
          <a href="https://imperio-lux.vercel.app/" className="font-semibold text-[#d8c38c] hover:text-white">Imperio Lux</a>
          <span>V. {siteVersion || '—'}</span>
        </p>
      </footer>
      <WhatsAppQuoteWidget
        businessName={empresa.nombre || 'Imperio Lux'}
        businessPhone={phone}
        products={activeProducts}
        categories={visibleCategories.filter((category) => category.estado)}
        loading={!catalogData && !catalogError}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};
