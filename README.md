# ResQConnect — Emergency Response Platform

Real-time emergency response coordination platform for Nepal. Users request help through the mobile app, service providers respond, and organizations manage everything from their web dashboard.

---

## Multi-Tenant Architecture

```
                    ┌───────────────────────────────────┐
                    │        Super Admin Web             │
                    │     (control-plane UI)             │
                    └──────────────┬────────────────────┘
                                   │
                    ┌──────────────▼────────────────────┐
                    │     super-admin-backend             │
                    │     (control-plane API)             │
                    │                                    │
                    │  cp_organization  ── per-tenant     │
                    │  cp_silo_registry ── tracks silos   │
                    │  cp_compliance    ── per-org rules  │
                    │  cp_entitlements  ── plan→features  │
                    │  cp_subscription_plan               │
                    └──────┬──────┬──────┬───────────────┘
                           │      │      │
                    internal HTTP (x-internal-api-key)
                           │      │      │
              ┌────────────┘      │      └────────────┐
              ▼                   ▼                   ▼
      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
      │  Silo A      │   │  Silo B      │   │  Silo C      │
      │  TENANT_ID   │   │  TENANT_ID   │   │  TENANT_ID   │
      │  Sector:fire │   │  Sector:hosp │   │  Sector:pol  │
      │  Own DB      │   │  Own DB      │   │  Own DB      │
      │  Comp:basic  │   │  Comp:HIPAA  │   │  Comp:CJIS   │
      └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
             │                  │                   │
             └──────────────────┼───────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Shared Infrastructure │
                    │  Redis (locks, cache)  │
                    │  Kafka (event bus)     │
                    └───────────────────────┘

                    ┌───────────────────────┐
                    │  Platform API         │
                    │  (MODE=platform)       │
                    │  User-facing REST + WS │
                    └───────────────────────┘
```

Each **tenant (organization)** gets its own silo — an isolated backend instance with its own database, compliance rules, and feature entitlements. Silos register with the control plane on boot and are auto-discovered.

---

## Apps

| App | Directory | Purpose |
|---|---|---|
| **Mobile User** | `apps/mobile-user` | One-tap emergency requests, live tracking, SMS fallback |
| **Mobile Responder** | `apps/mobile-responder` | Receive alerts, accept/reject, navigate, broadcast location |
| **Backend** | `apps/backend` | Express API — runs as `platform` or `silo` mode |
| **Organization Web** | `apps/organization-web` | Next.js dashboard for org admins |
| **Super Admin Web** | `apps/super-admin-web` | Next.js portal for platform-wide administration |
| **Super Admin Backend** | `apps/super-admin-backend` | Control-plane API (org registry, entitlements, plans) |
| **Landing Page** | `apps/landing-web` | Public marketing site (resqconnect.com) |

## Packages

| Package | Purpose |
|---|---|
| `@repo/db` | Drizzle ORM schemas + control-plane models |
| `@repo/types` | Shared TypeScript types, Zod validations, API contracts |
| `@repo/config` | Shared env & tenant config (Zod-validated) |
| `@repo/ui` | Shared shadcn/ui components |
| `@repo/utils` | Shared utilities (ApiError, ApiResponse, asyncHandler) |
| `@repo/typescript-config` | Shared TS configs |
| `@repo/eslint-config` | Shared ESLint config |

---

## Communication Patterns

| Flow | Protocol | Why |
|---|---|---|
| User → Platform (create request) | **HTTP** | One-shot, no real-time needed |
| Platform → Silo (dispatch) | **Kafka** (outbox) | Async, reliable, persistent |
| Silo → Providers (broadcast) | **Socket.IO** | Real-time push to many |
| Provider → Silo (accept/reject) | **Socket.IO + Redis Lock** | Real-time + race prevention |
| Provider ↔ Silo (location) | **Socket.IO** | High-frequency streaming |
| Silo → Platform (status updates) | **Kafka** | Async bridge between runtimes |
| Platform → User (status) | **Socket.IO** | Real-time push |
| Control Plane ↔ Silo | **Internal HTTP** | Admin/config operations |
| Request acceptance race prevention | **Redis** (SET NX EX) | Distributed lock |

---

## Provisioning Flow (New Tenant)

```
Super Admin (UI)
  │
  ├─ 1. Create Organization
  │     → POST /orgs/provision
  │     → cp_organization created (status: pending_approval)
  │     → Silo called → org created in silo DB
  │     → Entitlements auto-resolved from plan
  │     → Compliance defaults set from sector
  │     → Success screen shows Tenant ID + deploy command
  │
  ├─ 2. Deploy silo (from the command shown in UI)
  │     ./deploy/deploy-silo.sh "org-name" hospital 7402 <tenant-uuid>
  │     → Silo boots with TENANT_ID env var
  │     → Fetches config from CP: GET /internal/tenants/:id/config
  │     → Returns sector, compliance rules, database URL
  │     → Registers itself: POST /internal/silos/register
  │     → CP upserts cp_silo_registry, stores heartbeat
  │
  ├─ 3. Approve → POST /orgs/:id/status { status: 'active' }
  │     → Silo starts accepting traffic
  │
  └─ 4. Monitor → Dashboard / Silos
        → Shows heartbeat, sector, org count, incident counts
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, NativeWind, Zustand |
| Backend | Express.js, TypeScript, PostgreSQL, Drizzle ORM |
| Web Frontends | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Real-time | Socket.IO |
| Maps | Mapbox (mobile), Leaflet + OpenStreetMap (web) |
| Payments | Khalti (Sandbox) |
| Auth | JWT + OTP (Twilio) + Email (Nodemailer) |
| Cache / Locks | Redis (Valkey) |
| Message Queue | Kafka |
| Package Manager | Bun |
| Monorepo | Turborepo |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Bun (`npm install -g bun`)
- PostgreSQL 16
- Redis (Valkey)
- Kafka

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

**Backend (platform mode):**
```bash
cp apps/backend/.env.sample apps/backend/.env
```

Key env vars:
```env
MODE=platform
PORT=4001
DATABASE_URL=postgresql://admin:root@localhost:5432/resq_platform
CONTROL_PANE_URL=http://localhost:4080
INTERNAL_API_KEY=your_internal_api_key
```

**Backend (silo mode):**
```env
MODE=silo
TENANT_ID=<uuid>        # From control plane, or use SECTOR=fire for legacy
SILO_BASE_URL=http://localhost:4000
DATABASE_URL=postgresql://admin:root@localhost:5432/resq_silo
CONTROL_PANE_URL=http://localhost:4080
INTERNAL_API_KEY=your_internal_api_key
```

**Super admin backend:**
```bash
cp apps/super-admin-backend/.env.sample apps/super-admin-backend/.env
```

### 3. Set up databases

```bash
# Platform database
cd apps/backend && DATABASE_URL=<platform-db-url> bun run db:migrate

# Super admin database
cd apps/super-admin-backend && DATABASE_URL=<cp-db-url> bun run db:migrate

# Seed subscription plans
curl -X POST http://localhost:4080/plans/seed
```

### 4. Run

```bash
# Terminal 1: Control plane
cd apps/super-admin-backend && bun run dev

# Terminal 2: Platform
cd apps/backend && bun run dev:platform

# Terminal 3: Silo
cd apps/backend && bun run dev:silo          # uses SECTOR=fire or TENANT_ID

# Terminal 4: Super admin web
cd apps/super-admin-web && bun run dev

# Terminal 5: Organization web
cd apps/organization-web && bun run dev

# Terminal 6: Landing page
cd apps/landing-web && bun run dev
```

### Access

| App | URL |
|---|---|
| Landing Page | http://localhost:3001 |
| Organization Dashboard | http://localhost:3002 |
| Super Admin Portal | http://localhost:3000 |
| Platform API | http://localhost:4001 |
| Silo API | http://localhost:4000 |
| Control Plane API | http://localhost:4080 |

---

## Design System

Swiss-inspired editorial design:

- Monospace uppercase labels (`font-mono text-[10px] uppercase tracking-[0.15em]`)
- Hairline borders (`border-b border-border`) for structural division
- Signal red primary accent used sparingly
- Left-aligned hierarchy, generous whitespace
- Geist font family (via `next/font/google`)

---

## Deployment

See `deploy/README.md` for Docker Compose deployment:

```bash
# Deploy shared infra + control plane
docker compose -f deploy/docker-compose.stack.yml up -d --build

# Deploy a silo
./deploy/deploy-silo.sh "org-name" hospital 7402 <tenant-uuid>
```

---

## Scripts

```bash
bun run dev          # Start all apps (turbo)
bun run build        # Production build
bun run lint         # Lint all apps
bun run check-types  # TypeScript checks
bun run format       # Prettier formatting
```
