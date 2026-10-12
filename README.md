# Imperio Lux

Punto de venta y gestión comercial construido con React, TypeScript, Vite y Express. Google Sheets funciona como base de datos a través de la API del servidor y una cuenta de servicio.

## Requisitos

- Node.js 20 o superior y npm o Bun.
- Una cuenta de servicio de Google con acceso a Google Sheets API y Google Drive API.
- Una hoja de cálculo de Google compartida con el correo de la cuenta de servicio como editor.

## Configuración local

1. Copia `.env.example` a `.env` y configura `GOOGLE_SERVICE_ACCOUNT_FILE` con la ruta de la clave JSON fuera del repositorio. También puedes usar `GOOGLE_SERVICE_ACCOUNT_JSON` en un entorno de despliegue.
2. Configura `GOOGLE_SHEETS_ID` con el identificador de la hoja y compártela con `client_email` de la cuenta de servicio.
3. Instala dependencias con `npm install` o `bun install`.
4. Inicia la aplicación con `npm run dev` o `bun run dev`.

La comprobación de conexión está disponible en `GET /api/database/status`. El cliente consulta y modifica la hoja mediante `/api/google-sheets`; el servidor agrega el token de la cuenta de servicio. Ninguna clave privada ni token de Google se incluye en el bundle del navegador.

## Producción

Construye el frontend con `npm run build` y ejecuta el servidor con `NODE_ENV=production npm start`. El proceso Node debe permanecer activo para servir la aplicación y ejecutar el programador de respaldos. Conserva `.runtime/` en almacenamiento persistente si usas respaldos programados.

La cuenta de servicio solo autentica el servidor ante Google; no autentica a los operadores de la aplicación. Añade autenticación y autorización de usuarios en el servidor antes de exponer el sistema a Internet. Google Sheets es apropiado para un uso pequeño y de baja concurrencia, pero no ofrece transacciones para ventas concurrentes.
