# Docker Production

## Goal

This project is prepared for a single-host production deployment with:

- `web` for static frontend delivery and reverse proxy
- `app` for the Express backend
- `postgres` for relational persistence
- `minio` for document storage

This keeps production reproducible without forcing Docker into the normal local coding workflow.

## Files

- `Dockerfile.app`
- `Dockerfile.web`
- `docker/nginx/default.conf`
- `compose.yaml`
- `compose.production.yaml`
- `compose.local-infra.yaml`
- `.env.production.example`

## Recommended operating model

### Local development

Keep using:

- frontend and backend directly on the host
- PostgreSQL and MinIO installed locally if that is already your fastest workflow

Docker is optional locally.

### Optional local infra only

If you want Docker only for infrastructure:

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.local-infra.yaml up -d postgres minio
```

This exposes:

- PostgreSQL on `${POSTGRES_PORT:-5432}`
- MinIO API on `${MINIO_API_PORT:-9000}`
- MinIO console on `${MINIO_CONSOLE_PORT:-9001}`

### Production

1. Copy `.env.production.example` to `.env.production`
2. Replace passwords and domain values
3. Deploy:

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --build
```

### Production on a VPS with Nginx Proxy Manager

This matches your current VPS shape well.

Recommended values:

- `WEB_PORT=8081`
- `CLIENT_ORIGIN=https://citas.betancur.work`

Deploy with:

```bash
./deploy.sh
```

Then create a new Proxy Host in Nginx Proxy Manager:

- Domain Names: `citas.betancur.work`
- Scheme: `http`
- Forward Hostname / IP: `127.0.0.1`
- Forward Port: `8081`
- Block Common Exploits: enabled
- Websockets Support: enabled

In the SSL tab:

- Request a new SSL certificate
- Force SSL
- HTTP/2 Support

Important:

- do not bind this app directly to `80` or `443`
- those ports already belong to the global proxy manager
- this app should only publish an internal host port like `8081`

## Network model

```text
Internet
  -> web (nginx)
      -> app (express)
          -> postgres
          -> minio
```

Important decisions:

- only `web` publishes a port publicly
- `postgres` and `minio` remain internal in production
- `app` is only reachable through the internal Docker network
- when using a global proxy like Nginx Proxy Manager, `web` should publish a non-conflicting host port such as `8081`

## Why this shape

This matches the current application well:

- frontend already works with relative `/api` URLs
- backend already handles migrations during startup
- MinIO bucket creation already happens from the app
- document access already goes through backend-controlled URLs

## Persistence

The stack depends on named Docker volumes:

- `postgres-data`
- `minio-data`

Do not treat containers as the persistence layer.
Back up the volumes or back up PostgreSQL and MinIO with dedicated jobs.

## Reverse proxy details

Nginx currently:

- serves the Vite frontend build
- proxies `/api/*` to `app:3001`
- proxies `/health` to `app:3001`
- allows request bodies up to `50 MB`
- falls back to `index.html` for SPA routing

## Secrets and env

Do not commit `.env.production`.

At minimum rotate:

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `MINIO_SECRET_KEY`

Recommended later improvements:

- move production secrets to your hosting platform secret store
- add automated backups for PostgreSQL
- add MinIO backup or replication
- add HTTPS termination with real certificates

## Notes about scaling

This setup is intentionally aimed at:

- one VPS
- one dedicated server
- one small VM

If you later need higher availability, the first upgrades should usually be:

1. managed PostgreSQL or external Postgres
2. external object storage / separate MinIO deployment
3. then consider orchestration changes
