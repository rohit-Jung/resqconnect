# ResQConnect — Emergency Response Platform

Real-time emergency response coordination platform for Nepal. Users request help through the mobile app, service providers respond, and organizations manage everything from their web dashboard.

## Platform Overview

```mermaid
flowchart TB
    subgraph Clients
        A["Mobile App\n(Expo / React Native)"]
        B["Responder App\n(Expo / React Native)"]
        C["Organization Web\n(Next.js)"]
        D["Super Admin Panel\n(Next.js)"]
    end

    subgraph Platform["Platform Backend"]
        P["REST API\n+ User Socket"]
    end

    subgraph Silos
        S1["Fire Silo"]
        S2["Ambulance Silo"]
        S3["Police Silo"]
    end

    A --> P
    B --> S1
    B --> S2
    B --> S3
    C --> P
    D --> P

    P <-->|"HTTP dispatch"| S1
    P <-->|"HTTP dispatch"| S2
    P <-->|"HTTP dispatch"| S3
```

### Mobile Apps

Two separate React Native / Expo apps:

#### User App (`apps/mobile-user`)
- **One-tap emergency requests** — ambulance, police, fire, rescue
- **Real-time location sharing** via expo-location
- **Live tracking** of assigned responders on Mapbox maps
- **SMS fallback** — request help even without internet
- **Push notifications** via socket.io for status updates
- **User authentication** with OTP verification

#### Responder App (`apps/mobile-responder`)
- **Receive emergency alerts** with vibration
- **Accept/reject requests** from nearby users
- **Navigation** to emergency location with route
- **Real-time location broadcast** to user
- **Confirm arrival** to complete emergency

### Backend API (`apps/backend`) — Platform + Silo Architecture

**Two running modes** (controlled via `MODE` flag):
- `MODE=platform` — User-facing REST API + user WebSocket
- `MODE=silo` — Provider management + provider WebSocket

```mermaid
flowchart LR
    subgraph Platform["PLATFORM (MODE=platform)"]
        API1[REST API]
        WS1[User WebSocket]
    end

    subgraph Silo["SILO (MODE=silo)"]
        API2[REST API]
        WS2[Provider WebSocket]
        Kafka[Kafka Consumer]
    end

    subgraph Dispatch["Internal HTTP"]
        H[HTTP Bridge]
    end

    API1 -->|"dispatch"| H
    H -->|"incoming"| API2
    WS2 -->|"notify"| H
    H -->|"update"| WS1
```

**Key design decisions:**
1. **Internal HTTP over Kafka** for immediate events (accept, location, completion)
   - Lower latency, better ACK, simpler than Kafka for socket events
2. **Redis for route caching** — shared across Platform + Silo
   - Cache includes emergency type for sector-wise routing
3. **Platform notifies user** when provider accepts/updates/completes
4. **Socket event forwarding** via HTTP POST to `/internal/incidents/:id/update`

### Organization Web (`apps/organization-web`)

Next.js dashboard for emergency service organizations.

- **Dashboard** — KPI cards, area charts, status distribution
- **Service Providers** — register, verify, manage teams
- **Live Tracking** — Leaflet map showing all provider locations
- **Emergency Reports** — view and manage incidents
- **Plans & Billing** — subscribe via Khalti, view payment history
- **Settings** — update organization profile

### Super Admin Web (`apps/super-admin-web`)

Next.js portal for platform-wide administration.

- **Dashboard** — system stats, monthly comparison, entity distribution
- **Organizations** — manage and verify organizations
- **Users & Providers** — cross-org listings with pagination
- **Payments** — plan management (CRUD), payment history
- **Settings** — admin profile management

## Tech Stack

| Layer           | Technology                                      |
| --------------- | ----------------------------------------------- |
| Mobile          | React Native, Expo, NativeWind, Zustand         |
| Backend         | Express.js, TypeScript, PostgreSQL, Drizzle ORM |
| Web Frontends   | Next.js 15, React 19, Tailwind CSS, Shadcn/ui   |
| Real-time       | Socket.io                                       |
| Maps            | Mapbox (mobile), Leaflet + OpenStreetMap (web)  |
| Payments        | Khalti (Sandbox)                                |
| Auth            | JWT + OTP (Twilio) + Email (Nodemailer)         |
| Cache           | Redis (Valkey)                                 |
| Message Queue  | Kafka                                          |
| Package Manager | Bun                                             |
| Monorepo        | Turborepo                                       |

## Project Structure

```
project/
├── apps/
│   ├── mobile-user/          # Expo/React Native - user mobile app
│   ├── mobile-responder/     # Expo/React Native - responder mobile app
│   ├── backend/             # Express.js API server (platform + silo)
│   ├── organization-web/    # Next.js org dashboard
│   └── super-admin-web/       # Next.js admin portal
├── packages/
│   ├── db/                 # Drizzle schemas
│   ├── types/              # Shared types
│   ├── config/             # Shared config
│   └── utils/              # Shared utilities
├── deploy/                  # Docker Compose configs
└── docs/                   # Architecture docs
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Bun (`npm install -g bun`)
- PostgreSQL (port 5432)
- Expo CLI (for mobile app)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp apps/backend/.env.sample apps/backend/.env
```

Edit `apps/backend/.env`:

```env
PORT=4000
MODE=platform                               # platform | silo
SECTOR=fire                               # fire | hospital | police (for silo)
DATABASE_URL=postgresql://admin:root@localhost:5432/resq_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=my_jwt_secret
MAPBOX_ACCESS_TOKEN=pk.xxxxx
PLATFORM_BASE_URL=http://localhost:4001          # for silo to notify platform
INTERNAL_API_KEY=your_internal_api_key
```

### 3. Set up database

```bash
cd apps/backend
bun run db:generate
bun run db:migrate
bun run db:seed
```

### 4. Run Backend

**Platform mode** (user-facing):
```bash
bun run dev:platform
# or: MODE=platform PORT=4001 bun run dev:backend
```

**Silo mode** (provider-facing):
```bash
bun run dev:silo
# or: MODE=silo SECTOR=fire bun run dev:backend
```

### 5. Run Mobile Apps

```bash
bun run dev --filter=mobile-user
bun run dev --filter=mobile-responder
```

Or run web dashboards:
```bash
bun run dev --filter=organization-web
bun run dev --filter=super-admin-web
```

### Access

| App                    | URL(DEV)              | 
| ---------------------- | --------------------- |
| User App              | Expo Dev Tools (LAN IP) |
| Responder App        | Expo Dev Tools (LAN IP) |
| Organization Dashboard | http://localhost:3000 |
| Super Admin Portal     | http://localhost:3001 |
| Platform API         | http://localhost:4001 |
| Silo API             | http://localhost:4000 |

## Internal API Endpoints

Platform ↔ Silo communication via internal HTTP:

| Endpoint | From | Description |
| -------- |------|------------|
| `POST /api/v1/internal/incidents/incoming` | Platform | Dispatch request to silo |
| `POST /api/v1/internal/incidents/:id/update` | Silo | Notify platform of status update |

**Headers required:** `x-internal-api-key: your_internal_api_key`

## Some of the API Overview

### Auth

- `POST /api/v1/organization/register` — Register organization
- `POST /api/v1/organization/login` — Login
- `POST /api/v1/organization/verify` — Verify OTP
- `GET/PATCH /api/v1/organization/profile` — Get/Update profile

### Service Providers

- `GET/POST /api/v1/organization/providers` — List/Create
- `PUT/DELETE /api/v1/organization/providers/:id` — Update/Delete
- `PATCH /api/v1/organization/providers/:id/verify` — Verify

### Emergency Requests

- `POST /api/v1/emergency-requests` — Create request (from mobile)
- `GET /api/v1/emergency-requests` — List user's requests
- `PATCH /api/v1/emergency-requests/:id/status` — Update status

### Payments (Khalti)

- `GET /api/v1/payments/plans` — List subscription plans
- `POST /api/v1/payments/subscribe` — Initiate payment
- `GET /api/v1/payments/callback` — Khalti callback
- `GET /api/v1/payments/history` — Payment history
- `GET /api/v1/payments/subscription` — Active subscription

## Design Decisions

### Why Platform + Silo Architecture?

1. **Separation of concerns** — User-facing and provider-facing scaled independently
2. **Fault isolation** — Silo issues don't affect platform users
3. **Sector-specific logic** — Fire, ambulance, police have different workflows
4. **Scalability** — Each silo can be deployed to separate servers

### Internal HTTP vs Kafka

| Event Type | Transport | Reason |
|-----------|----------|--------|
| Request dispatch | HTTP | Fast ACK, creates request row in Silo DB |
| Provider matching | Kafka | Async queue, broadcasts to all providers in area |
| Location updates | HTTP | Fire-and-forget, high frequency |
| Accept/Complete | HTTP | Immediate ACK required |

**Note:** HTTP dispatch endpoints do minimal work (insert row + ACK) and won't block other calls. Kafka is still used for provider matching (finding nearby providers asynchronously).

### Route Caching

- Routes cached in Redis with key: `route:{emergencyType}:{origin}:{dest}:{profile}`
- Emergency type included for sector-specific routes
- Both Platform and Silo share same Redis for cache hits

### Socket Event Flow

1. User creates request → Platform → dispatches to Silo via HTTP
2. Provider accepts → Silo socket → notifies Platform via HTTP
3. Provider location → Silo socket → forwards to Platform → emits to User
4. Provider completes → Silo socket → forwards completion to Platform

The web dashboards follow a Swiss-inspired editorial design:

- Monospace uppercase labels (`font-mono text-[10px] uppercase tracking-[0.15em]`)
- No rounded corners — sharp, architectural precision
- Hairline borders (`border-b border-border`) for structural division
- Signal red primary accent used sparingly
- Left-aligned hierarchy, generous whitespace
- Geist font family

## Design System

The web dashboards follow a Swiss-inspired editorial design:

- Monospace uppercase labels (`font-mono text-[10px] uppercase tracking-[0.15em]`)
- No rounded corners — sharp, architectural precision
- Hairline borders (`border-b border-border`) for structural division
- Signal red primary accent used sparingly
- Left-aligned hierarchy, generous whitespace
- Geist font family

## Scripts

```bash
bun run dev          # Start all apps
bun run build        # Production build
bun run lint         # Lint all apps
bun run check-types  # TypeScript checks
bun run format       # Prettier formatting
```
