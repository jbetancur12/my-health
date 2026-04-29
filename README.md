# Citas medicas app

Frontend en React/Vite con backend local en Express + TypeScript + MikroORM + PostgreSQL.
Los archivos clinicos se almacenan en MinIO usando una arquitectura multi-bucket.

El diseno original viene de Figma:
https://www.figma.com/design/byxeyb2kWVScOJIv7fKpJG/Citas-m%C3%A9dicas-app

La aplicacion principal ya no usa Supabase.
La carpeta `ctasnew/` se conserva solo como referencia del origen migrado.

## Configuracion

1. Crea `.env` a partir de `.env.example`.
2. Asegura que PostgreSQL este corriendo y que `DATABASE_URL` apunte a una base valida.
3. Configura MinIO con las variables `MINIO_*` del ejemplo.
4. Si quieres resumenes automaticos de documentos, configura el proveedor IA en `AI_SUMMARY_PROVIDER`.
5. Instala dependencias con `npm install`.

En desarrollo, el servidor intenta crear la base si no existe.
En produccion, la base debe existir previamente.

## Desarrollo

Ejecuta `npm run dev`.

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

La app puede seguir desarrollandose sin Docker si ya usas PostgreSQL y MinIO locales.

## Docker

El repo queda preparado para dos escenarios:

1. Infraestructura local opcional
   Levanta solo PostgreSQL y MinIO si algun dia quieres dejar de instalarlos en tu maquina:

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.local-infra.yaml up -d postgres minio
```

2. Produccion en un solo servidor
   Copia `.env.production.example` a `.env.production`, ajusta secretos y dominio, y luego:

```bash
./deploy.sh
```

Servicios del stack Docker:

- `web`: Nginx sirviendo el frontend y haciendo proxy a `/api`
- `app`: backend Express compilado
- `postgres`: base de datos PostgreSQL
- `minio`: almacenamiento S3-compatible para documentos

Notas:

- en produccion no se exponen PostgreSQL ni MinIO al exterior
- si ya tienes un proxy global como Nginx Proxy Manager, usa un `WEB_PORT` distinto, por ejemplo `8081`
- Nginx ya acepta uploads de hasta `50 MB`, alineado con el limite del backend
- el backend sigue ejecutando migraciones al iniciar
- MinIO sigue creando buckets automaticamente desde la app

## Almacenamiento de archivos

La aplicacion ya no guarda nuevos archivos medicos en un folder local como estrategia principal.

Arquitectura elegida:

- 1 bucket por tipo documental
- prefixes dentro del bucket por `especialidad/doctor/anio/cita`
- nombre final del objeto por `documentId + nombre-sanitizado`

Buckets creados automaticamente:

- `<MINIO_BUCKET_PREFIX>-historias-clinicas`
- `<MINIO_BUCKET_PREFIX>-ordenes-procedimiento`
- `<MINIO_BUCKET_PREFIX>-ordenes-medicamento`
- `<MINIO_BUCKET_PREFIX>-ordenes-control`
- `<MINIO_BUCKET_PREFIX>-laboratorios`

La aplicacion intenta crear esos buckets automaticamente al iniciar y tambien al primer upload si hacen falta. Si `MINIO_ENABLE_VERSIONING=true`, el backend tambien habilita versionado para proteger reescrituras accidentales.

Los documentos se sirven al frontend por `GET /api/documents/:documentId/file`, asi que la UI no depende de URLs publicas directas del bucket.

## Resumenes con IA

La aplicacion puede generar un resumen automatico por documento subido.

- el resumen se guarda por documento, no mezclado con las notas humanas de la cita
- al subir un archivo, el backend lo marca `pending` y procesa el resumen en segundo plano
- si el servidor reinicia, retoma documentos que quedaron `pending` o `processing`
- si falla, el documento queda `failed` y la UI permite `Reintentar resumen`

Variables relevantes:

- `AI_SUMMARY_PROVIDER` con `openai`, `gemini` o `disabled`
- `OPENAI_API_KEY`
- `OPENAI_SUMMARY_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_SUMMARY_MODEL`
- `AI_SUMMARY_MAX_FILE_BYTES`

Soporte actual de resumen automatico:

- PDF
- JPG
- PNG

Ejemplos:

- `AI_SUMMARY_PROVIDER=openai` para usar OpenAI
- `AI_SUMMARY_PROVIDER=gemini` para usar Google AI Studio / Gemini
- `AI_SUMMARY_PROVIDER=disabled` para desactivar los resumenes sin tocar el resto del flujo de archivos

## Migraciones

El proyecto usa migraciones reales de MikroORM.

- Aplicar migraciones: `npm run db:migrate`
- Crear una nueva migracion: `npm run db:migrate:create`
- Revertir la ultima migracion: `npm run db:migrate:down`

El backend ejecuta `migration:up` al iniciar, asi que en local normalmente no necesitas correrlas a mano si la base ya es accesible.

Flujo recomendado:

1. Cambia entidades en `server/src/entities`.
2. Genera migracion nueva con `npm run db:migrate:create`.
3. Revisa el archivo en `server/src/migrations`.
4. Aplica cambios con `npm run db:migrate`.

## Pruebas

- Smoke tests backend: `npm run test:server`

La suite actual valida el bootstrap real de Express, `GET /health` y errores de validacion en endpoints seleccionados.

## Calidad de codigo

- Lint: `npm run lint`
- Lint con auto-fix: `npm run lint:fix`
- Formato: `npm run format`
- Verificar formato: `npm run format:check`

ESLint cubre frontend, backend y contratos compartidos. Prettier se usa para mantener formato consistente del repo.

## Documentacion interna

- Arquitectura: [docs/architecture.md](docs/architecture.md)
- Reglas de estructura: [docs/structure-rules.md](docs/structure-rules.md)
- Produccion Docker: [docs/docker-production.md](docs/docker-production.md)

## API

- `GET /health`
- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `GET /api/controls`
- `POST /api/controls`
- `GET /api/medications`
- `POST /api/medications`
- `PUT /api/medications/:id`
- `DELETE /api/medications/:id`
- `POST /api/upload`
- `GET /api/documents/:documentId/file`
- `POST /api/documents/:documentId/summary/retry`
