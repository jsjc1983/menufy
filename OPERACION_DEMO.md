# Operación del entorno de demo

## Variables obligatorias

- `DATABASE_URL`: PostgreSQL con TLS.
- `SESSION_SECRET`: secreto aleatorio de 32 caracteres o más. Generarlo con `openssl rand -base64 48` y no guardarlo en Git.

## Despliegue

1. Crear una base PostgreSQL separada de cualquier piloto real.
2. Configurar las variables en Vercel.
3. Ejecutar `npm run check` antes de publicar.
4. Desplegar; `vercel.json` aplica migraciones antes del build.
5. Verificar `GET /api/health`, alta, acceso, menú, evento, voto y seguimiento privado.
6. Usar únicamente datos ficticios en la demo comercial.

## Copias de seguridad

- Activar copias diarias y recuperación a un punto en el tiempo en el proveedor PostgreSQL.
- Mantener al menos 7 días de retención para la demo y 30 días para un piloto.
- Probar una restauración en una base separada antes del primer piloto.
- No guardar volcados con nombres o alergias en carpetas compartidas sin cifrado.

## Monitorización

- Monitorizar `/api/health` cada 5 minutos desde una ubicación externa.
- Configurar alertas para respuestas 5xx y latencia anómala en Vercel.
- Los errores no controlados se registran en formato estructurado sin nombres, correos ni alergias.
- Antes del piloto, conectar el destino de logs/errores aprobado por el responsable del tratamiento.

## Incidentes

1. Cerrar el evento afectado y preservar logs sin copiar datos personales innecesarios.
2. Revocar `SESSION_SECRET` si existe sospecha sobre sesiones.
3. Rotar credenciales de base de datos si existe riesgo de acceso.
4. Evaluar alcance, datos afectados y obligaciones de notificación con el responsable legal.
