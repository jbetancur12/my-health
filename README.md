
# Citas medicas app

Frontend en React/Vite con backend local en Express + TypeScript + MikroORM + PostgreSQL.

El diseno original viene de Figma:
https://www.figma.com/design/byxeyb2kWVScOJIv7fKpJG/Citas-m%C3%A9dicas-app

La aplicacion principal ya no usa Supabase.
La carpeta `ctasnew/` se conserva solo como referencia del origen migrado.

## Configuracion

1. Crea `.env` a partir de `.env.example`.
2. Asegura que PostgreSQL este corriendo y que `DATABASE_URL` apunte a una base valida.
3. Instala dependencias con `npm install`.

En desarrollo, el servidor intenta crear la base si no existe.
En produccion, la base debe existir previamente.

## Desarrollo

Ejecuta `npm run dev`.

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

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
  
