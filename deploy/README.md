# Deploy Scaffolding (Phase 10)

This folder contains dev-like deployment templates for the target architecture:

- 3 silo backends (same codebase `apps/backend`) running with `SECTOR={fire|hospital|police}`
- 1 control-plane backend (`apps/super-admin-backend`)

These templates are intentionally minimal and are meant to be adapted for your actual infra.

## Prereqs

- Docker + Docker Compose
- `INTERNAL_API_KEY` shared between control plane and all silos (used as `x-internal-api-key`)

## Start Silos

1. Copy env templates

`cp deploy/fire/silo.env.example deploy/fire/silo.env`

Repeat for `hospital` and `police`.

2. Start a sector

Export a shared internal API key first:

`export INTERNAL_API_KEY=replace_me`

`docker compose -f deploy/fire/docker-compose.yml up -d --build`

Silo ports:

- fire: `http://localhost:7401`
- hospital: `http://localhost:7402`
- police: `http://localhost:7403`

## Start Control Plane

1. Copy env

`cp deploy/control-plane/control-plane.env.example deploy/control-plane/control-plane.env`

2. Start

`export INTERNAL_API_KEY=replace_me`

`docker compose -f deploy/control-plane/docker-compose.yml up -d --build`

Control plane port:

- `http://localhost:7500`

## Notes

- Each silo uses a separate Postgres database (with PostGIS) and separate Redis.
- Control plane uses a separate Postgres database.
- Each silo also runs its own Kafka broker (see the per-silo compose templates).

## Start Full Stack (All Silos + Control Plane)

1. Create env files (required by compose)

- `cp deploy/fire/silo.env.example deploy/fire/silo.env`
- `cp deploy/hospital/silo.env.example deploy/hospital/silo.env`
- `cp deploy/police/silo.env.example deploy/police/silo.env`
- `cp deploy/control-plane/control-plane.env.example deploy/control-plane/control-plane.env`

2. Export internal key (shared)

`export INTERNAL_API_KEY=replace_me`

3. Boot stack

`docker compose -f deploy/docker-compose.stack.yml up -d --build`

4. Validate config (optional)

`docker compose -f deploy/docker-compose.stack.yml config`
