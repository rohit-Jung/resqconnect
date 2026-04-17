# ResQConnect — Emergency Response Platform

Real-time emergency response coordination platform for Nepal. Users request help through the mobile app, service providers respond, and organizations manage everything from their web dashboard.

## Platform Overview

```mermaid
flowchart TB
    subgraph Clients
        A["Mobile App\n(Expo / React Native)"]
        C["Organization Web\n(Next.js)"]
        D["Super Admin Panel\n(Next.js)"]
    end

    B["Backend API\n(Express.js)"]

    A --> B
    C --> B
    D --> B
```

### Mobile App (`apps/mobile`)

React Native / Expo — the primary product users interact with.

- **One-tap emergency requests** — ambulance, police, fire, rescue
- **Real-time location sharing** via expo-location
- **Live tracking** of assigned responders on Mapbox maps
- **SMS fallback** — request help even without internet
- **Offline support** for emergency requests
- **Push notifications** via socket.io for status updates
- **User authentication** with OTP verification

### Backend API (`apps/backend`)

Express.js + PostgreSQL + Drizzle ORM.

- JWT authentication with OTP (Twilio)
- Organization and service provider management
- Emergency request lifecycle (create → assign → complete)
- Real-time socket events for live tracking
- Khalti payment integration for subscription billing
- Email notifications (Nodemailer + Mailtrap)
- Mapbox integration for geocoding and routing

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
| Package Manager | Bun                                             |
| Monorepo        | Turborepo                                       |

## Project Structure

```
project/
├── apps/
│   ├── mobile/            # Expo/React Native mobile app
│   ├── backend/           # Express.js API server
│   ├── organization-web/  # Next.js org dashboard
│   └── super-admin-web/   # Next.js admin portal
└── packages/
    ├── eslint-config/     # Shared ESLint rules
    └── typescript-config/ # Shared TS configs
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
DATABASE_URL=postgresql://admin:root@localhost:5432/resq_db
JWT_SECRET=my_jwt_secret
KHALTI_SECRET_KEY=test_secret_key_xxxxxxxxxxxx
KHALTI_BASE_URL=https://dev.khalti.com/api/v2
KHALTI_RETURN_URL=http://localhost:4000/api/v1/payments/callback
KHALTI_WEBSITE_URL=http://localhost:3000
```

### 3. Set up database

```bash
cd apps/backend
bun run db:generate
bun run db:migrate
bun run db:seed
```

### 4. Run all apps

```bash
bun run dev
```

Or run individually:

```bash
bun run dev --filter=backend
bun run dev --filter=organization-web
bun run dev --filter=super-admin-web
bun run dev --filter=mobile       # then press 'a' for Android or 'i' for iOS
```

### Access

| App                    | URL(DEV)              | 
| ---------------------- | --------------------- |
| Organization Dashboard | http://localhost:3000 |
| Super Admin Portal     | http://localhost:3001 |
| Backend API            | http://localhost:4000 |
| Mobile App             | Expo Dev Tools        |

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
