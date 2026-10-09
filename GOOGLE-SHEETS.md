# Configuración de Google Sheets

La aplicación usa una cuenta de servicio desde el servidor. La clave privada no debe añadirse a `src`, a variables `VITE_*`, ni al repositorio.

1. En Google Cloud, habilita Google Sheets API y crea una cuenta de servicio.
2. Descarga la clave JSON y guárdala fuera del repositorio, o configura `GOOGLE_SERVICE_ACCOUNT_JSON` con su contenido en los secretos del servidor.
3. Comparte la hoja con el correo `client_email` de esa cuenta y dale permiso de editor.
4. Configura `GOOGLE_SERVICE_ACCOUNT_FILE` (ruta a la clave) o `GOOGLE_SERVICE_ACCOUNT_JSON` en el servidor. Opcionalmente, configura `GOOGLE_SHEETS_ID`.
5. Inicia el servidor con `npm run dev` para desarrollo y `npm start` en producción (`NODE_ENV=production`).

El endpoint `/api/sheets/status` indica si el servidor pudo autenticarse. La cuenta de servicio concede acceso a Google Sheets; no autentica a los usuarios del ERP. Añade autenticación de usuarios y control de roles en el servidor antes de exponer la aplicación públicamente.

Google Sheets sirve para operaciones pequeñas y de baja concurrencia. Para ventas simultáneas, auditoría robusta o contabilidad crítica, migra los datos operativos a una base transaccional y conserva Sheets para exportación y análisis.
