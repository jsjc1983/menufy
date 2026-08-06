# Gruppy

Gestión de menús de grupo para restaurantes. Sin registro, sin complicaciones.

## ¿Qué es?

Gruppy permite a restaurantes digitalizar la recogida de pedidos para eventos de grupo (cenas de empresa, celebraciones, banquetes...). El restaurante crea el menú y el evento, comparte un enlace con los comensales, y cada uno elige sus platos desde el móvil. El restaurante ve en tiempo real el resumen de producción con los conteos exactos.

## Características

### Para el restaurante

- **Gestión de menús** — Crea menús con tiempos (entrante, principal, postre...) y platos por tiempo. Cada plato puede tener descripción y alérgenos de la UE marcados.
- **Platos individuales o para compartir** — Marca un plato como "para compartir" e indica para cuántas personas. El resumen de producción calcula automáticamente las raciones necesarias (ej: 20 selecciones de calamares para 4 → 5 raciones).
- **Eventos** — Crea eventos con fecha, número de comensales esperados y menú asignado. Genera un código de invitación único de 6 caracteres.
- **Plazo de votaciones** — Configura cuántos días antes del evento se cierran las votaciones. El sistema bloquea automáticamente las respuestas cuando llega la fecha límite.
- **Dashboard en tiempo real** — Visualiza el progreso de respuestas y accede a tres vistas:
  - **Producción** — Conteo de platos por tiempo, con cálculo de raciones para platos compartidos.
  - **Alérgenos** — Lista de comensales con alergias declaradas y alertas de riesgo cuando alguien ha elegido un plato que contiene su alérgeno.
  - **Invitados** — Tabla completa con las selecciones de cada comensal.
- **Exportar resumen** — Descarga un `.txt` con toda la información del evento: producción, alérgenos y lista de invitados.
- **Cerrar evento manualmente** — Cierra las votaciones en cualquier momento.
- **Acceso por PIN seguro** — El panel está protegido por PIN con hash, sesión firmada, bloqueo de intentos y cookie segura en producción.
- **Seguimiento privado** — El organizador recibe un enlace distinto, protegido por token, que se actualiza automáticamente.

### Para el comensal

- **Sin registro** — El invitado solo necesita el enlace o código de 6 caracteres.
- **Declaración de alérgenos** — Marca sus alergias o intolerancias (14 alérgenos de la UE) con notas adicionales opcionales.
- **Selección de platos** — Elige un plato por cada tiempo del menú. Los platos para compartir se identifican con una etiqueta visual.
- **Avisos de alérgenos** — Si selecciona un plato que contiene algún alérgeno que ha declarado, recibe un aviso de confirmación antes de guardarlo.
- **Fecha límite visible** — Se muestra el plazo para votar directamente en el formulario.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Base de datos | PostgreSQL vía Prisma ORM |
| Estilos | Tailwind CSS + shadcn/ui |
| Lenguaje | TypeScript |

## Instalación y uso local

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

Si arrancas `npm run dev` sin un `DATABASE_URL` real, el proyecto usará automáticamente la base local SQLite `prisma/dev.db` para que puedas probar la app en localhost.

Para trabajar contra PostgreSQL:

```bash
# Configurar la conexión de base de datos PostgreSQL
cp .env.example .env
# Edita DATABASE_URL en .env

# Crear las tablas en PostgreSQL y generar el cliente Prisma
npm run db:migrate

# Iniciar el servidor de desarrollo
npm run dev
```

Para producción en Vercel, crea una base de datos gestionada (Vercel Postgres, Neon, Supabase, etc.) y añade `DATABASE_URL` en las variables de entorno del proyecto. El despliegue de Vercel ejecuta `npm run db:deploy` antes del build para aplicar las migraciones.

También es obligatorio configurar `SESSION_SECRET` con un valor aleatorio de al menos 32 caracteres:

```bash
openssl rand -base64 48
```

Si necesitas aplicar las migraciones manualmente:

```bash
npm run db:deploy
```

No uses SQLite en Vercel para este proyecto: las funciones serverless no tienen un sistema de archivos persistente para escrituras de base de datos.

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Sincroniza el schema con la base de datos y regenera el cliente |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:studio` | Abre Prisma Studio para explorar la base de datos |
| `npm run test` | Ejecuta las pruebas automatizadas |
| `npm run lint` | Revisa calidad y patrones inseguros |
| `npm run check` | Ejecuta lint, pruebas, build y auditoría de dependencias |

## Flujo de uso

```
Restaurante
  └─ Crea restaurante (nombre + PIN)
       └─ Crea menú (tiempos + platos + alérgenos)
            └─ Crea evento (fecha + comensales + plazo + menú)
                 └─ Comparte el enlace con los invitados
                      └─ Dashboard → Producción / Alérgenos / Invitados
                           └─ Exporta resumen .txt

Comensal
  └─ Abre el enlace o introduce el código
       └─ Declara nombre + alérgenos
            └─ Selecciona un plato por tiempo
                 └─ Confirma → selección registrada
```

## Modelo de datos

```
Restaurant
  ├─ menus[]
  │    └─ courses[] (ordenados)
  │         └─ dishes[] (isShared, sharesFor, allergens)
  └─ events[]
       ├─ votingDeadline
       ├─ shareCode (único, 6 chars)
       └─ guests[]
            ├─ allergens[]
            └─ selections[] → dish
```

## Seguridad y privacidad

- El enlace público de votación no devuelve respuestas de otros invitados.
- El seguimiento del organizador requiere un token privado separado.
- Los PIN nuevos se guardan con bcrypt; los PIN antiguos se migran al iniciar sesión.
- Los nombres se normalizan y son únicos por evento; el aforo se comprueba en una transacción serializable.
- La información de alergias requiere consentimiento y se acompaña de una advertencia sanitaria.
- Consulta [OPERACION_DEMO.md](./OPERACION_DEMO.md) antes de desplegar.

## Deuda técnica

- **Alérgenos** — En el MVP se guardan como JSON serializado en campos `String @default("[]")` (`Dish.allergens` y `Guest.allergens`). Es suficiente para el piloto, pero más adelante conviene normalizarlo a tablas relacionales:
  - `DishAllergen` para los alérgenos presentes en cada plato.
  - `GuestAllergen` para las alergias declaradas por cada comensal.
- **Identidad legal** — Antes de un piloto real deben sustituirse los contactos de demostración y completar responsable, encargado, proveedores, ubicación y plazos de conservación.
