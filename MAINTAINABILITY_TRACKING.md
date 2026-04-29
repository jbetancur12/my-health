# Maintainability Tracking

## Objective

Reorganize the project so it is:

- easier to understand
- easier to extend
- safer to change
- better aligned with scalable frontend and backend practices

This document is the working checklist for that refactor.

## Current Snapshot

### Frontend

Current structure:

```text
src/
  app/
    App.tsx
    AppTabContent.tsx
    components/
    layout/
  features/
    appointments/
      components/
      hooks/
      screens/
    calculators/
      components/
    controls/
      components/
      screens/
    dashboard/
      components/
    export/
      components/
    import/
      components/
    medical-profile/
      components/
      hooks/
      screens/
    medications/
      components/
      hooks/
    reports/
      components/
    search/
      components/
    settings/
      components/
      hooks/
      screens/
    timeline/
      components/
    vaccines/
      components/
      hooks/
    vital-signs/
      components/
      hooks/
  shared/
    api/
    components/
    lib/
  styles/
```

Observed issues:

- `App.tsx` still coordinates some cross-feature state and overlay flow, even though most UI composition already moved out.
- Domain components are grouped by feature and most orchestration now lives in hooks/screens, but the app shell can still slim down a bit more if we want.
- Frontend contracts are now centralized in `src/shared/api/contracts.ts`, and several local duplicates were removed from hooks and feature components.
- Import/export now lives in separate feature boundaries and uses typed shared contracts.
- `app/components/ui` and `app/components/figma` are now intentional app-level libraries governed by repo-level structure/lint rules, though a few shared boundaries could still evolve over time.

### Backend

Current structure:

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
    medications/
    medical-profile/
    notification-preferences/
    tags/
    shared/
    uploads/
    vaccines/
    vital-signs/
  index.ts
  mikro-orm.config.ts
  orm.ts
  scripts/
  tests/
```

Observed issues:

- `server/src/index.ts` is now focused on bootstrap and modules are layered; repository extraction is intentionally deferred unless query complexity grows enough to justify it.
- Request validation, DTO shaping, and transport contracts are now separated well enough for normal feature work.
- Domain ownership for serializers and module input types now lives directly inside each backend module.

### Repository-level observations

- `ctasnew/` still exists as a reference/import source and should eventually be archived or removed.
- `dist/`, logs, and generated artifacts should stay clearly separated from source concerns.
- Architecture and structure guidance now exist in `docs/`, but they should keep evolving with the codebase.

## Target Architecture

### Frontend target

Proposed shape:

```text
src/
  app/
    App.tsx
    AppTabContent.tsx
    components/
    layout/
  features/
    appointments/
      components/
      hooks/
      types/
    calculators/
      components/
    controls/
      components/
      hooks/
      types/
    dashboard/
      components/
    export/
      components/
    import/
      components/
    medical-profile/
      components/
      hooks/
      types/
    medications/
      components/
      hooks/
      types/
    vaccines/
      components/
      hooks/
      types/
    vital-signs/
      components/
      hooks/
      types/
    search/
      components/
      hooks/
    reports/
      components/
      hooks/
    settings/
      components/
      hooks/
    timeline/
      components/
  shared/
    api/
    components/
    lib/
  styles/
```

Principles:

- organize by domain first, not by file type alone
- keep app shell separate from feature logic
- keep shared UI and shared utilities out of feature folders
- use hooks for data orchestration
- use lazy boundaries intentionally at screen/feature level

### Backend target

Proposed shape:

```text
server/src/
  app/
    create-app.ts
    routes.ts
    middleware/
  modules/
    app-data/
    appointments/
      appointment.controller.ts
      appointment.service.ts
      appointment.schemas.ts
      appointment.serializer.ts
      appointment.types.ts
    controls/
    health/
    medications/
    medical-profile/
    notification-preferences/
    shared/
    tags/
    vaccines/
    vital-signs/
    uploads/
  entities/
  migrations/
  scripts/
  orm.ts
  mikro-orm.config.ts
  index.ts
```

Principles:

- `index.ts` should only bootstrap the server
- each module should own its HTTP handlers, validation, business logic, and serialization
- keep persistence access behind small service boundaries first; extract repositories only when query complexity or testability clearly demands it
- validation should be explicit and close to the route boundary

## Refactor Phases

### Phase 1: Audit and structure definition

Status: `completed`

Goals:

- document current shape
- define target structure
- identify risky moves before file relocation

Tasks:

- [x] inspect current frontend and backend folder layout
- [x] document current pain points
- [x] define target frontend structure
- [x] define target backend structure
- [x] create this tracking document

### Phase 2: Frontend folder reorganization

Status: `completed`

Goals:

- move flat feature files into domain folders
- keep behavior unchanged during the move

Tasks:

- [x] create `src/features`
- [x] move appointment-related components into `features/appointments`
- [x] move medication-related components into `features/medications`
- [x] move profile/vaccine/vital-sign components into their own feature folders
- [x] move search, import/export, report concerns into dedicated features
- [x] create `shared/api` and `shared/lib`
- [x] reduce direct cross-feature imports
- [x] review whether `mobile` should stay feature-scoped or move under `app/layout`
- [x] split import/export into separate feature boundaries so file parsing and download concerns are no longer coupled
- [x] reduce remaining direct feature imports inside `App.tsx`
  Progress: `App.tsx` still imports a few top-level hooks and feature entry points, but no longer carries the old flat component dependency graph.

### Phase 3: Frontend state and hooks cleanup

Status: `completed`

Goals:

- reduce `App.tsx` responsibility
- make data loading and mutations feature-oriented

Tasks:

- [x] introduce domain hooks like `useAppointments`, `useMedications`, `useMedicalProfile`
- [x] move request/mutation orchestration out of `App.tsx`
- [x] keep `App.tsx` as shell/layout/tab coordination only
  Progress: header, desktop navigation, floating action button, tab content composition, and mobile navigation now live outside `App.tsx`; it mainly coordinates state, navigation, and overlays.
- [x] isolate loading/error/empty states per feature
  Progress: tab-specific loading and error/empty states now resolve inside `AppTabContent` with a shared state panel component.
- [x] reduce duplicated frontend contracts across components and hooks
  Progress: core app/API contracts now live in `src/shared/api/contracts.ts`, the main hooks plus several domain components and control/dashboard views consume that shared layer, and import/export now uses typed bundle contracts instead of `any`.

### Phase 4: Backend modularization

Status: `completed`

Goals:

- split `index.ts` into modules
- isolate HTTP, validation, and business logic

Tasks:

- [x] create `server/src/app/create-app.ts`
- [x] move route registration out of `index.ts`
- [x] create module folders for appointments, controls, medications, profile, tags, vaccines, vital signs
- [x] split handlers into controller/service layers
- [x] move serializers and input types closer to each module

### Phase 5: Validation and contracts

Status: `mostly_completed`

Goals:

- remove implicit payload assumptions
- make API contracts easier to trust and evolve

Tasks:

- [x] choose validation strategy for backend request payloads
- [x] define per-module schemas
  Progress: shared validation helpers and first-pass schemas now cover the main write flows, with module-local types and serializers also in place.
- [x] normalize response DTOs
  Progress: module serializers now align with shared HTTP DTO contracts, but response typing can still be expanded in controllers and tests.
- [x] reduce duplicated type definitions between frontend and backend
  Progress: backend types are now domain-local, frontend app contracts are centralized, shared HTTP transport contracts now live in `shared/contracts/http.ts`, and import/export now uses those contracts instead of local weak typing.
- [x] evaluate a shared contract layer for safe reuse
- [x] decide whether `shared/contracts/` should stay repo-local or become a separate package
  Decision: keep it repo-local for now; split it into its own package only if another app/service needs independent versioning.

### Phase 6: Quality and tooling

Status: `mostly_completed`

Goals:

- improve consistency and long-term safety

Tasks:

- [x] review linting/formatting setup
  Progress: ESLint and Prettier are now configured with repo-level scripts, frontend/backend/shared coverage, and the repo currently passes `lint`, `typecheck`, and `build`.
- [x] document naming conventions and folder rules
- [x] add architecture notes for contributors
- [~] add basic tests for services and critical endpoints
  Progress: backend integration smoke tests now cover app bootstrap, `/health`, and request validation failures through the real Express app.
- [ ] add basic UI tests for key workflows
- [x] decide whether backend repositories are required right now
  Decision: no dedicated repository layer for now; current service-to-MikroORM boundaries stay in place until query complexity or testing pain justifies extraction.

## Risks to Manage

- Moving too many files at once can create noisy diffs and broken imports.
- Shared types can become more confusing before they become cleaner if we do not define ownership early.
- Backend modularization can accidentally mix transport-layer DTOs with ORM entities if we move too fast.
- `ctasnew/` should not keep leaking structure decisions into the main app forever.

## Working Rules

During the refactor:

- prefer behavior-preserving moves first
- keep commits small and thematic
- validate with `typecheck` and `build` after each phase
- avoid large “rename + logic rewrite + architecture rewrite” changes in one step

## Immediate Next Step

Recommended next action:

1. archive or remove `ctasnew/` once it is no longer needed as a reference snapshot
2. optionally slim `App.tsx` a little further only if another shell concern makes a new extraction worth it
3. add first UI workflow tests for the highest-value frontend flows when we want broader regression safety

That keeps the architecture honest without reopening large refactors that the app no longer needs right now.
