# Structure Rules

## Goal

These rules exist to keep the project maintainable as features keep growing.

When adding or changing code, prefer following these rules instead of inventing a new structure ad hoc.

## General rules

- Organize by domain before file type.
- Prefer small thematic files over giant multi-purpose files.
- Keep behavior-preserving moves separate from logic rewrites when possible.
- Do not mix transport models, UI models, and ORM entities in one layer.

## Frontend rules

### Where files go

- Put app-shell concerns in `src/app/`.
- Put domain-specific UI in `src/features/<domain>/`.
- Put reusable non-domain UI in `src/shared/components/`.
- Put browser/platform helpers in `src/shared/lib/`.
- Put HTTP client logic in `src/shared/api/`.
- Keep import and export concerns in separate feature folders when they evolve independently.

### Type ownership

- If a type represents HTTP transport, source it from `shared/contracts/http.ts`.
- If a type represents frontend app state with `Date` objects, source it from `src/shared/api/contracts.ts`.
- Do not redefine `Appointment`, `Medication`, `MedicalProfile`, `Control`, `Vaccine`, or `VitalSignReading` inside components unless there is a clear view-specific reason.

### Hooks

- Data-loading hooks belong in `features/<domain>/hooks/`.
- Hooks should orchestrate API calls and local feature state.
- UI components should receive already-shaped data instead of doing API parsing themselves.

### Components

- Screens compose feature sections and route/tab-level behavior.
- Presentational components should avoid global app orchestration.
- If a component creates its own local type, verify first that an existing shared contract is not enough.

## Backend rules

### Module layering

Each backend domain should prefer this shape:

```text
routes -> controller -> schema -> service -> entity/ORM
```

Meaning:

- `routes.ts` only registers endpoints
- `controller.ts` handles HTTP orchestration
- `schemas.ts` validates/parses input
- `service.ts` performs domain/persistence work
- `serializer.ts` shapes output DTOs

Repositories are optional, not mandatory.

Add a repository file only when:

- a module accumulates complex reusable queries
- multiple services need the same persistence logic
- a service becomes harder to read because query code dominates it

### Type ownership

- Transport contracts belong in `shared/contracts/http.ts`.
- Domain input aliases can live in `server/src/modules/<domain>/<domain>.types.ts`.
- ORM entities belong only in `server/src/entities/`.
- Do not return ORM entities directly from controllers.

### Validation

- Validate at the route boundary through module schemas/parsers.
- Prefer throwing `ValidationError` from shared validation helpers.
- Keep validation messages specific enough for debugging and tests.

### Dates

- Input payloads should treat dates as strings.
- Services/entities may convert to `Date`.
- Serializers must convert back to ISO strings for transport.

## Shared contracts rules

- `shared/contracts/http.ts` is for network-safe shapes only.
- No `Date`, `File`, ORM objects, or framework-specific types there.
- If a frontend or backend change affects an API payload, update the shared contract first.

## Testing rules

- Prefer smoke tests for bootstrap and validation when DB is not required.
- Add persistence integration tests for domain flows that matter most.
- Keep tests focused on behavior and contracts, not implementation details.

## Naming guidance

- `*.controller.ts` for HTTP request/response handling
- `*.service.ts` for domain logic and persistence orchestration
- `*.schemas.ts` for payload validation/parsing
- `*.serializer.ts` for DTO output shaping
- `*.types.ts` for module-local type aliases
- `*.screen.tsx` or `screens/` for tab/view composition
- `hooks/useX.ts` for feature state orchestration

## What to avoid

- Giant route files with inline ORM logic
- Components redefining shared domain types without a real reason
- Parsing raw API payloads inside random UI components
- Mixing upload/file objects into shared HTTP contracts
- Adding new global utilities when a domain-local helper would do
