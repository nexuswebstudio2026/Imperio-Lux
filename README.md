# Imperio Lux

Punto de venta y gestión comercial construido con React, TypeScript, Vite y Express. Google Sheets funciona como base de datos a través de la API del servidor y una cuenta de servicio.

## Requisitos

- Node.js 20 o superior y npm o Bun.
- Una cuenta de servicio de Google con acceso a Google Sheets API y Google Drive API.
- Una hoja de cálculo de Google compartida con el correo de la cuenta de servicio como editor.

## Configuración local

1. Copia `.env.example` a `.env` y configura `GOOGLE_SERVICE_ACCOUNT_FILE` con la ruta de la clave JSON fuera del repositorio. En Vercel configura `GOOGLE_SERVICE_ACCOUNT_JSON` con el contenido completo del JSON de la cuenta de servicio como variable de entorno (no subas la clave al repositorio). El servidor local también admite `GOOGLE_SERVICE_ACCOUNT_JSON`, por lo que puede usarse el mismo nombre y valor en ambos entornos.
2. Configura `GOOGLE_SHEETS_ID` con el identificador de la hoja y compártela con `client_email` de la cuenta de servicio.
3. Instala dependencias con `npm install` o `bun install`.
4. Inicia la aplicación con `npm run dev` o `bun run dev`.

La comprobación de conexión está disponible en `GET /api/database/status`. El catálogo público consulta productos, categorías y marcas activas mediante `GET /api/storefront/catalog`, que solo expone los campos destinados al sitio. Al entrar un administrador, el sistema descarga las pestañas con datos existentes o inicializa las 22 pestañas desde el estado local cuando `productos` está vacío. Después de sincronizar, los cambios administrativos en productos, clientes, proveedores, ventas, compras y demás colecciones se guardan automáticamente en su pestaña de Google Sheets. Los errores de escritura se muestran en el estado de conexión y en la consola del navegador. El cliente consulta y modifica la hoja mediante `/api/google-sheets`; el servidor agrega el token de la cuenta de servicio. Ninguna clave privada ni token de Google se incluye en el bundle del navegador.

## Producción

Construye el frontend con `npm run build` y ejecuta el servidor con `NODE_ENV=production npm start`. En Vercel, configura además `GOOGLE_SHEETS_ID` y `GOOGLE_SERVICE_ACCOUNT_JSON` en **Project → Settings → Environment Variables**, y vuelve a desplegar después de guardarlas. El correo y el resto de secretos del servidor también deben configurarse ahí. Comparte la hoja con el `client_email` de la cuenta de servicio como editor. El proceso Node debe permanecer activo para servir la aplicación y ejecutar el programador de respaldos. Conserva `.runtime/` en almacenamiento persistente si usas respaldos programados.

La cuenta de servicio solo autentica el servidor ante Google; no autentica a los operadores de la aplicación. Añade autenticación y autorización de usuarios en el servidor antes de exponer el sistema a Internet. Google Sheets es apropiado para un uso pequeño y de baja concurrencia, pero no ofrece transacciones para ventas concurrentes.

## Rutas del sitio

La tienda pública está disponible en `/`, `/catalogo`, `/nosotros` y `/contacto`; la navegación usa rutas limpias y no agrega fragmentos `#...`. El selector de acceso está en `/acceso`, con entradas separadas en `/acceso/admin`, `/acceso/clientes` y `/acceso/proveedores`. El panel administrativo usa rutas bajo `/admin`; los portales de cliente y proveedor están en `/cliente` y `/proveedor`. Las rutas internas conservan la sesión y admiten recarga y navegación atrás/adelante. Las cuentas de clientes y proveedores se vinculan a su registro por el identificador `CLI-<id>` o `PROV-<id>` generado al sincronizar la hoja `Usuarios`.
