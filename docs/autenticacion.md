# Acceso de usuarios y recuperación

## Hoja `Usuarios`

El servidor agrega estas columnas a la hoja existente sin borrar las demás:

- `usuario`
- `contrasena_salt`
- `contrasena_hash`

Las contraseñas no se guardan en texto plano. Cada cuenta debe tener un usuario único, sal aleatoria y hash scrypt. La sesión se guarda en una cookie `HttpOnly`; las rutas de datos de Sheets y administración exigen sesión de administrador.

## Primer administrador

1. Copia `.env.example` a `.env` en el servidor y configura Google Sheets como ya está configurado.
2. Genera una clave aleatoria larga para `AUTH_BOOTSTRAP_SECRET` y mantenla solo en el entorno privado del servidor.
3. Abre `/login`, elige **Primera configuración del administrador** y usa el correo de la fila administrativa existente en `Usuarios`.
4. Configura el usuario y una contraseña de al menos 10 caracteres. El endpoint inicial solo funciona si el admin aún no tiene credenciales.
5. Inicia sesión y abre **Usuarios registrados → Acceso al sistema** para asignar credenciales iniciales a empleados y clientes.

No hay contraseñas predeterminadas para las filas existentes. Hasta que se provisionen, esas cuentas no pueden iniciar sesión.

## Recuperación por correo

Configura SMTP en el servidor antes de habilitarla:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=cuenta@dominio.com
SMTP_PASSWORD=contraseña-de-aplicación
SMTP_FROM="Imperio Lux <cuenta@dominio.com>"
```

Para Gmail usa una contraseña de aplicación. No pongas secretos SMTP ni la clave de la cuenta de servicio en variables `VITE_` o en el repositorio. Reinicia el servidor después de añadir estas variables. Los códigos vencen a los 10 minutos; la recuperación de contraseña pide usuario y verifica el correo guardado en la hoja.
