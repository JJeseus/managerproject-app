# Gestor de Proyectos

Aplicación personal (usuario único, sin login) para gestionar proyectos, tareas y notas en español (`es-MX`), construida con `Next.js + Drizzle + Neon`.

## Requisitos

- Node.js 22+
- Base de datos Postgres (Neon recomendado)
- Variables de entorno:
  - `DATABASE_URL`
  - `ALLOW_MOCK_FALLBACK_DEV` (`true` solo en desarrollo local)

## Scripts principales

- `npm run dev`: desarrollo
- `npm run lint`: lint bloqueante
- `npm run typecheck`: validación TypeScript
- `npm test`: pruebas unitarias/integración
- `npm run build`: build de producción
- `npm run start`: servidor de producción
- `npm run db:migrate`: migraciones Drizzle
- `npm run db:seed`: carga inicial de datos

## Healthchecks

- `GET /api/health`: estado general de aplicación
- `GET /api/health/db`: conectividad a base de datos

## Checklist de release

1. Confirmar variables en Vercel (Preview/Production): `DATABASE_URL`.
2. Ejecutar `npm ci`.
3. Ejecutar `npm run lint`.
4. Ejecutar `npm run typecheck`.
5. Ejecutar `npm test`.
6. Ejecutar `npm run build`.
7. Ejecutar migraciones en producción (`npm run db:migrate`).
8. (Opcional bootstrap) Ejecutar seed inicial una sola vez (`npm run db:seed`).
9. Verificar `/api/health` y `/api/health/db`.
10. Publicar despliegue y monitorear logs de error.

## Política de fallback de datos

- En producción: nunca usar mock fallback.
- En desarrollo: solo se permite fallback a datos mock con `ALLOW_MOCK_FALLBACK_DEV=true`.

## Respaldo y recuperación (Neon)

### Respaldo periódico

1. Activar backups automáticos en Neon para la base de datos de producción.
2. Programar export semanal adicional (`pg_dump`) a almacenamiento externo.
3. Verificar restauración al menos una vez al mes en entorno de staging.

### Recuperación

1. Crear base temporal desde backup/snapshot en Neon.
2. Validar integridad de tablas críticas (`projects`, `tasks`, `notes`, `comments`, `subtasks`, `activities`).
3. Cambiar `DATABASE_URL` al recurso recuperado.
4. Ejecutar smoke checks (`/api/health`, `/api/health/db`, navegación principal).

## Rollback de despliegue

1. Revertir a deployment previo estable desde Vercel.
2. Reaplicar `DATABASE_URL` previa si fue modificada.
3. Confirmar checks de salud y logs.
4. Abrir incidente con causa raíz y plan de corrección.
