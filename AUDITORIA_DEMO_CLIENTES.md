# Auditoría para demo comercial de Gruppy

Fecha: 4 de agosto de 2026  
Última actualización: 4 de agosto de 2026, después de la remediación técnica

## Dictamen

La versión corregida es apta para una **demo privada o pública con datos ficticios**. Antes de un piloto con datos reales deben completarse la identidad y textos legales definitivos, contratar/configurar backups y monitorización del proveedor, y ejecutar la prueba end-to-end sobre el despliegue final.

La propuesta de valor principal se puede enseñar de extremo a extremo: alta de restaurante, creación de menú y evento, enlace de invitación, selección de platos, alérgenos, dashboard de producción y exportación.

## Estado de remediación

| Hallazgo original | Estado actual |
|---|---|
| Datos de invitados expuestos por código público | Corregido: consultas separadas y seguimiento con token privado |
| PIN en texto plano | Corregido: bcrypt y migración al iniciar sesión |
| Cookie sin firma | Corregido: HMAC, expiración, `httpOnly`, `sameSite` y `secure` en producción |
| Fuerza bruta de PIN | Corregido: bloqueo tras cinco intentos |
| Dependencias vulnerables | Corregido: Next.js 16.3 y auditoría sin vulnerabilidades |
| Sin pruebas automatizadas | Corregido parcialmente: pruebas de sesión y privacidad; falta E2E del despliegue final |
| Duplicados y aforo | Corregido: índice único y transacción serializable |
| Gestión incompleta | Mejorado: renombrado, eliminación segura, cierre y reapertura; la edición estructural de platos queda como evolución |
| Seguimiento manual | Corregido: actualización automática cada 15 segundos |
| Advertencia sanitaria | Corregido: consentimiento, privacidad y aviso visible |
| PWA incompleta | Corregido: manifiesto e icono |
| Sin health check/operación | Corregido en aplicación y documentación; la contratación del proveedor es externa |

## Qué se puede enseñar ahora

| Flujo | Estado | Condición para la demo |
|---|---|---|
| Crear restaurante con nombre y PIN | Demostrable | Usar un restaurante ficticio y un PIN no reutilizado |
| Crear menú por tiempos y platos | Demostrable | Incluye descripciones, 14 alérgenos UE y platos compartidos |
| Crear evento y enlace de 6 caracteres | Demostrable | Usar nombres y correos ficticios |
| Configurar cierre de votaciones | Demostrable | Enseñar tanto cierre automático como manual |
| Votación móvil sin registro | Demostrable | Usar invitados ficticios |
| Aviso de conflicto de alérgenos | Demostrable | Explicar que es una ayuda operativa, no una garantía sanitaria |
| Dashboard de producción | Demostrable | Incluye raciones compartidas y progreso |
| Gestión manual de invitados | Demostrable | El restaurante puede añadir, editar y eliminar respuestas |
| Exportación de resumen `.txt` | Demostrable | No exportar datos personales reales |
| Vista de seguimiento del organizador | Demostrable con cautela | Contiene datos personales y requiere el enlace privado con token del organizador |

## Pendientes que dependen del despliegue o de una decisión empresarial

No quedan bloqueantes técnicos conocidos para una demo con datos ficticios. Estos puntos no pueden cerrarse solo con código:

- Sustituir `soporte@gruppy.app` y `privacidad@gruppy.app` por direcciones confirmadas.
- Completar razón social, responsable del tratamiento, encargado, proveedores, ubicación de datos y plazos de conservación.
- Elegir y configurar el proveedor PostgreSQL, backups, retención y restauración.
- Elegir el destino de monitorización de errores compatible con la política de privacidad.
- Decidir si la edición estructural de platos de un menú ya usado debe versionar el menú o quedar bloqueada.

## Verificaciones realizadas después de corregir

- Next.js actualizado a 16.3.0 y React a 19.2.4.
- `npm run build`: correcto, incluidas comprobaciones TypeScript.
- `npm run lint`: correcto, sin avisos ni errores.
- `npm run test`: 5 pruebas correctas sobre firma de sesiones y proyecciones de privacidad.
- `npm audit`: 0 vulnerabilidades, incluidas dependencias de desarrollo.
- Migración local aplicada sin borrar el evento existente.
- Manifiesto PWA, icono, páginas legales de demo, cabeceras de seguridad y `/api/health` incluidos.
- No se pudo completar una prueba visual automatizada con el navegador integrado en esta sesión; debe hacerse en la URL final antes de enseñarla.

## Alcance recomendado para la primera versión enseñable

1. Desplegar un entorno separado con `DATABASE_URL` y `SESSION_SECRET`.
2. Cargar un restaurante, menú, evento e invitados completamente ficticios.
3. Enseñar los roles de comensal, organizador y restaurante.
4. Verificar en móvil el consentimiento, la selección y la advertencia de alérgenos.
5. No presentar la demo como sistema de seguridad alimentaria ni usar datos reales.

## Puerta de salida a piloto real

Completar los puntos empresariales anteriores, activar backups/monitorización, ejecutar un E2E completo en producción y verificar aislamiento entre dos restaurantes diferentes. La guía operativa está en `OPERACION_DEMO.md`.
