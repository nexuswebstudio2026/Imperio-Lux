# Matriz DOFA — Imperio Lux

Evaluación basada en el código disponible el 9 de octubre de 2026.

| Fortalezas | Oportunidades |
| --- | --- |
| ERP con módulos conectados para ventas, compras, inventario, caja, clientes y reportes. | Instalable como PWA y accesible desde dispositivos móviles con una experiencia de aplicación. |
| Interfaz React modular, exportación Excel/PDF y panel de operación. | Centralizar datos en Google Sheets para facilitar consulta, respaldo y adopción inicial sin infraestructura de base de datos propia. |
| Ya existían rutinas de importación, exportación y mapeo de tablas a pestañas. | Automatizar alertas del navegador, sincronización y copias programadas; evolucionar a una base transaccional cuando crezca el volumen. |
| Moneda y parámetros regionales se pueden configurar para operación en Colombia. | Agregar autenticación y roles reales en servidor, auditoría, sincronización incremental y modo offline con cola de cambios. |

| Debilidades | Amenazas |
| --- | --- |
| La lógica actual guarda gran parte del estado en `localStorage`; esto no coordina usuarios ni equipos y depende del navegador/dispositivo. | Google Sheets tiene límites de cuota, concurrencia y consistencia; no reemplaza una base relacional para alto volumen ni transacciones de caja. |
| La credencial de servicio no existía como integración de servidor y el código previo dependía de Firebase/OAuth en el cliente. | Exponer la clave privada, compartir la hoja incorrectamente o dejar la API abierta puede filtrar/modificar toda la información comercial. |
| Las operaciones de sincronización completas sobrescriben pestañas y pueden causar pérdida de cambios concurrentes. | Pérdida de conexión, cambios manuales en encabezados/filas o eliminación accidental pueden dejar datos inconsistentes. |
| No había manifiesto PWA ni estrategia offline instalable en la aplicación web. | Datos personales y contables requieren controles de acceso, copias verificadas, políticas de retención y revisión normativa local. |

## Acciones priorizadas

1. Mantener la cuenta de servicio en el servidor, nunca en el bundle del navegador; compartir el Spreadsheet con su correo como editor.
2. Restringir la API con autenticación y autorización antes de publicar en Internet. La cuenta de servicio resuelve acceso a Google, no identifica a los usuarios del ERP.
3. Añadir sincronización incremental con IDs estables, marcas de tiempo, detección de conflictos y copias recuperables antes de reemplazar sincronización de pestañas completas.
4. Para operación multiusuario o transacciones críticas, migrar la persistencia operativa a una base de datos transaccional y conservar Sheets como exportación/analítica.
5. Probar restauración de respaldos y operación offline en dispositivos reales antes de considerar la PWA lista para producción.
