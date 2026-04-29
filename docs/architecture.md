# Architecture

## Purpose

This project is a medical appointments application with:

- a React + Vite frontend
- a local Express + TypeScript backend
- MikroORM + PostgreSQL persistence
- a shared HTTP contract layer used by both frontend and backend

The current architecture is designed to keep UI concerns, domain logic, transport contracts, and persistence concerns separated enough to evolve safely.

## Repository map

```text
/
  src/                    Frontend application
  server/src/             Backend application
  shared/contracts/       Shared HTTP transport contracts
  public/                 Static assets and PWA files
  uploads/                Legacy local document fallback
  docs/                   Architecture and contributor guidance
  ctasnew/                Historical reference copy, not the main app
```

## Frontend shape

```text
src/
  app/
    App.tsx
    AppTabContent.tsx
    layout/
    types.ts
  features/
    appointments/
    controls/
    dashboard/
    export/
    import/
    medical-profile/
    medications/
    reports/
    search/
    settings/
    timeline/
    vaccines/
    vital-signs/
  shared/
    api/
    components/
    lib/
  styles/
```

### Frontend responsibilities

- `app/` owns shell concerns: top-level layout, tab coordination, mobile navigation, overlays.
- `features/` owns domain-specific screens, components, and hooks.
- `shared/api/` owns frontend-facing app models plus HTTP client/parsing.
- `shared/components/` owns reusable UI pieces that are not domain-specific.
- `shared/lib/` owns browser/platform helpers such as notifications.

### Frontend data model

There are two layers of types on the frontend:

1. Transport contracts from `shared/contracts/http.ts`
   These describe what goes over HTTP.
   Dates are strings here.

2. App-facing frontend contracts in `src/shared/api/contracts.ts`
   These describe what the UI works with internally.
   Dates are `Date` objects here.

`src/shared/api/api.ts` is the translation layer between those two worlds.

## Backend shape

```text
server/src/
  app/
    create-app.ts
    routes.ts
  entities/
  migrations/
  modules/
    app-data/
    appointments/
    controls/
    health/
    medical-profile/
    medications/
    notification-preferences/
    shared/
    tags/
    uploads/
    vaccines/
    vital-signs/
  scripts/
  tests/
  index.ts
```

### Backend responsibilities

- `index.ts` bootstraps env, ORM, migrations, and app startup.
- `app/create-app.ts` creates the Express app, middleware, static file serving, and error handling.
- `app/routes.ts` wires domain modules together.
- `modules/<domain>/routes.ts` keeps route registration thin.
- `modules/<domain>/*.controller.ts` owns request/response orchestration.
- `modules/<domain>/*.service.ts` owns business logic and ORM coordination.
- `modules/<domain>/*.schemas.ts` owns request parsing and validation.
- `modules/<domain>/*.types.ts` owns module input types, now backed by shared transport contracts.
- `modules/<domain>/*.serializer.ts` owns DTO generation.
- `entities/` owns MikroORM persistence entities.

### Shared backend utilities

`server/src/modules/shared/` currently holds:

- validation helpers
- route id parsing helpers
- reusable entity factory/update helpers
- simple persistence helpers like `findFirst`

These are intentionally low-level and domain-agnostic.

## Repository decision

The backend currently stays on a `controller -> schema -> service -> MikroORM` flow without a dedicated repository layer.

That is intentional for now.

Why:

- most modules still have fairly direct query shapes
- services are already small enough to read and test in isolation
- adding repositories too early would add files and indirection faster than it would add clarity

When to introduce repositories later:

- a service starts coordinating multiple complex queries
- the same query logic is duplicated across services
- persistence mocking or swapping becomes painful enough to justify a seam

Until one of those happens, services remain the ownership boundary for persistence orchestration.

## Shared contracts

`shared/contracts/http.ts` is the shared transport layer.

It is used by:

- backend input type modules
- backend serializer return DTOs
- frontend HTTP client parsing/serialization

This layer should describe network payloads only.

Decision for now:

- `shared/contracts/` stays repo-local
- it is not becoming a separate package yet

Why:

- there is still only one deployable app and one backend in this repo
- the contracts are shared at build time, not published independently
- a separate package would add versioning and workspace overhead before it adds meaningful leverage

When to revisit that:

- another app or service starts consuming the same contracts
- contracts need independent versioning or release cadence
- the repo grows into a true multi-package workspace with clear ownership boundaries

Guideline:

- transport contracts use JSON-safe values
- dates are ISO strings
- no browser-only objects like `File`
- no ORM entities

## Request flow

Typical backend write flow:

1. Route registers endpoint.
2. Controller receives request.
3. Schema/parser validates and normalizes payload.
4. Service performs persistence work through MikroORM.
5. Serializer returns DTO aligned with shared HTTP contracts.
6. Frontend API client parses DTO into app-facing models.

Example:

1. `POST /api/appointments`
2. `appointment.controller.ts`
3. `appointment.schemas.ts`
4. `appointment.service.ts`
5. `appointment.serializer.ts`
6. `src/shared/api/api.ts -> parseAppointment()`

## Dates

Date handling is one of the most important conventions in this repo.

- HTTP contracts use ISO strings.
- Backend serializers always return strings for dates.
- Frontend API client converts those strings into `Date` objects.
- UI components should not parse raw API payloads directly.

If a component needs a date, it should receive a `Date` from the frontend app model layer whenever possible.

## File uploads

Uploads are handled separately from JSON payloads.

- appointment/document metadata is saved through the appointments API
- actual file bytes go through `POST /api/upload`
- new file bytes are stored in MinIO
- document entities keep `storageBucket`, `storageKey`, `filePath`, and `fileUrl`
- file reads are exposed through `GET /api/documents/:documentId/file`

This means `File` should remain a frontend-only concern, not part of shared HTTP transport contracts.

### MinIO bucket strategy

The application intentionally does not create one bucket for every doctor or specialty.

Reason:

- doctor and specialty are organizational dimensions that grow without a hard bound
- bucket count should represent administrative or policy boundaries
- object prefixes are the right place for hierarchy like specialty, doctor, and appointment

Current strategy:

- one bucket per document class
- object key prefixes inside each bucket for `specialty/doctor/year/appointment`

Current bucket layout:

- `<MINIO_BUCKET_PREFIX>-historias-clinicas`
- `<MINIO_BUCKET_PREFIX>-ordenes-procedimiento`
- `<MINIO_BUCKET_PREFIX>-ordenes-medicamento`
- `<MINIO_BUCKET_PREFIX>-ordenes-control`
- `<MINIO_BUCKET_PREFIX>-laboratorios`

Current object key layout:

```text
<specialty>/<doctor>/<year>/<appointmentId>/<documentId>-<sanitized-original-name>
```

Why this is the chosen balance:

- separates retention and policy boundaries by medical document class
- avoids an unbounded bucket explosion per doctor or specialty
- keeps objects easy to browse operationally by prefix
- preserves room for future lifecycle/versioning policies per bucket

The backend auto-creates required buckets when MinIO is configured and can also enable bucket versioning for safer overwrite behavior.

## Tests

Current backend smoke tests live in:

- `server/src/tests/run-smoke-tests.ts`

They currently cover:

- app bootstrap through the real Express app
- `GET /health`
- request validation failures for selected endpoints

Run with:

```bash
npm run test:server
```

These are intentionally lightweight and do not require a running database for their current scenarios.

## Recommended next architecture steps

The highest-value next improvements are:

1. review linting/formatting setup so the structure rules become enforceable
2. continue removing remaining local frontend view-model duplicates
3. archive or remove `ctasnew/` once it stops being useful as a reference
4. optionally slim `App.tsx` a little further only if another shell concern makes it worth extracting
