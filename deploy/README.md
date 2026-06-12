# Deploy

## Architecture

```
                    ┌──────────────────┐
                    │  Control Plane    │
                    │  (CP API + DB)    │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │ Fire Silo │    │Hospital   │    │ Police    │
    │ (own DB)  │    │(own DB)   │    │(own DB)   │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Shared     │
                    │  Redis +    │
                    │  Kafka      │
                    └─────────────┘
```

**Only the database is per-silo.** Redis and Kafka are **shared** — distributed locks, rate limiting, event dispatch, and real-time communication all depend on shared instances.

## Quick Start

```bash
# 1. Set shared internal API key
export INTERNAL_API_KEY=replace_me

# 2. Start shared infrastructure + control plane
docker compose -f docker-compose.stack.yml up -d --build

# 3. Deploy a silo
./deploy-silo.sh city-fire fire 7401
./deploy-silo.sh hospital-east hospital 7402
./deploy-silo.sh metro-police police 7403
```

## Deploy a Silo

```bash
./deploy-silo.sh <name> <sector> <port> [tenant-id]
```

Each silo gets:
- **Own Postgres database** — fully isolated data
- **Shared Redis** — locks, caching, rate limiting (from stack)
- **Shared Kafka** — event dispatch (from stack)

## Deploy the Control Plane

```bash
export INTERNAL_API_KEY=replace_me
docker compose -f docker-compose.stack.yml up -d --build
```

This starts:
- Control plane API + DB
- Platform API + DB (user-facing)
- Shared Redis
- Shared Kafka

## Port Map

| Service | Port |
|---------|------|
| Control Plane | 7500 |
| Platform | 7000 |
| Fire Silo | 7401 |
| Hospital Silo | 7402 |
| Police Silo | 7403 |

## Template

The parameterized template at `templates/silo.yml` is the recommended way to deploy new silos. It uses shared Redis/Kafka from the stack and creates only an isolated database per silo.
