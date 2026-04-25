# RESQ Emergency Response System - Architecture

## Overview

The system uses a **Platform + Silo** architecture with two runtimes:

- **Platform Runtime** (`MODE=platform`): User-facing REST API, user WebSocket, incident creation
- **Silo Runtime** (`MODE=silo`): Provider management, dispatch/matching, provider WebSocket

Both runtimes share the same backend codebase, distinguished by the `MODE` environment variable.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           USER (Mobile App)                                  │
│                  ┌──────────────────────────────┐                            │
│                  │  1. Sign Up/Login      │                            │
│                  │  2. Create Request  │                            │
│                  │  3. Track Status   │                            │
│                  └──────────────────────────────┘                            │
└──────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    │ HTTPS + WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       PLATFORM BACKEND (MODE=platform)                             │
│                    ┌─────────────────────────────────┐                         │
│                    │  REST API                       │                         │
│                    │  - POST /emergency-request    │                         │
│                    │  - GET  /emergency-request│                         │
│                    │  - POST /auth/...        │                         │
│                    └─────────────────────────────────┘                         │
│                                                                              │
│                    ┌─────────────────────────────────┐                         │
│                    │  WebSocket                     │                         │
│                    │  - REQUEST_ACCEPTED             │                         │
│                    │  - JOINEd_EMERGENCY_ROOM        │                         │
│                    │  - PROVIDER_LOCATION_UPDATED │                         │
│                    │  - REQUEST_COMPLETED        │                         │
│                    └─────────────────────────────────┘                         │
│                                                                              │
│                    ┌─────────────────────────────────┐                         │
│                    │  Internal Bridge              │                         │
│                    │  POST /internal/incidents/:id/update  │ ←── Receives silo updates          │
│                    └─────────────────────────────────┘                         │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                         │
│  │ Platform  │    │  User    │    │ Emergency│                         │
│  │   DB     │    │  Table   │    │ Request  │                         │
│  │(PostGIS) │    │         │    │  Table   │                         │
│  └─────────────┘    └─────────────┘    └─────────────┘                         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    │ HTTP POST (2s timeout, 2 retries)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    ┌─────────────┬─────────────┬─────────────┐                     │
│                    │  Silo:    │  Silo:    │  Silo:    │                     │
│                    │  FIRE    │ HOSPITAL  │ POLICE   │                     │
│                    │ (rescue)  │(ambulance)│(police) │                     │
│                    └─────────────┴─────────────┴─────────────┘                     │
│                                                                              │
│  HTTP Dispatch Route Mapping:                                                    │
│  - ambulance → SILO_HOSPITAL_BASE_URL                                       │
│  - fire_truck → SILO_FIRE_BASE_URL                                         │
│  - rescue_team → SILO_FIRE_BASE_URL (fire silo handles rescue)           │
│  - police → SILO_POLICE_BASE_URL                                         │
│                                                                              │
│                    ┌─────────────────────────────────┐                         │
│                    │  Kafka Consumer               │                         │
│                    │  (internal to silo)         │                         │
│                    └─────────────────────────────────┘                         │
│                                                                              │
│                    ┌─────────────────────────────────┐                         │
│                    │  Matching Service              │                         │
│                    │  - H3 spatial lookup        │                         │
│                    │  - Distance calculation   │                         │
│                    └─────────────────────────────────┘                         │
│                                                                              │
│                    ┌─────────────────────────────────┐                         │
│                    │  WebSocket                     │                         │
│                    │  - NEW_EMERGENCY              │ (broadcast to providers) │
│                    │  - PROVIDER_DECISION         │                         │
│                    └─────────────────────────────────┘                         │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                         │
│  │ Silo DB   │    │Provider  │    │Emergency│                         │
│  │(PostGIS) │    │ Table   │    │Request  │                         │
│  └─────────────┘    └─────────────┘    └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Flow (Detailed)

### 1. User Signs Up

```
User App                              Platform Backend
─────────────────────────────────────────────────────
1. POST /api/v1/auth/register
   Body: {
     name: "John Doe",
     email: "john@example.com",
     password: "SecurePass@123",
     phoneNumber: "+9779812345678",
     age: 25,
     primaryAddress: "Kathmandu, Nepal"
   }

                                    2. Create user in DB
                                       - Hash password
                                       - Generate verification token
                                       - Return user + JWT token

3. User clicks email verification link
4. GET /api/v1/auth/verify?token=xxx
   → Mark user as isVerified: true
```

**Key Points:**
- Sign up is **platform-only** (silos don't have user data)
- JWT contains `userId` and `role: "user"`

---

### 2. User Creates Emergency Request

```
User App                              Platform Backend
─────────────────────────────────────────────────────
1. POST /api/v1/emergency-request
   Headers: Authorization: Bearer <jwt>
   Body: {
     emergencyType: "fire_truck",  // | "ambulance" | "police" | "rescue_team"
     emergencyDescription: "Kitchen fire",
     userLocation: {
       latitude: 27.7172,
       longitude: 85.3240
     }
   }

   ┌─────────────────────────────────────────────────────────┐
   │ PLATFORM createEmergencyRequest handler:            │
   │                                                         │
   │ 1. Validate JWT + userId                              │
   │ 2. Create emergency_request row in platform DB  │
   │ 3. Update user's currentLocation              │
   │ 4. Route to silo:                         │
   │    - platform mode: HTTP POST to silo    │
   │    - silo mode: Kafka publish (legacy)   │
   └─────────────────────────────────────────────────────────┘

   HTTP Dispatch to Silo:
   POST http://fire_backend:3000/api/v1/internal/incidents/incoming
   Headers: x-internal-api-key: <key>
   Body: {
     requestId: "uuid-generated",
     userId: "user-uuid",
     emergencyType: "fire_truck",
     emergencyLocation: { latitude, longitude },
     status: "pending",
     h3Index: "...",
     searchRadius: 1,
     expiresAt: "..."
   }

   ┌─────────────────────────────────────────────────────────┐
   │ SILO incoming handler:                        │
   │                                                         │
   │ 1. Insert emergency_request (no FK to user)  │
   │ 2. ACK fast (200 OK)                  │
   │ 3. Later: Kafka consumer picks up        │
   └─────────────────────────────────────────────────────────┘

   Platform receives ACK:
   → Return 201 to user with requestId

4. User receives WebSocket event:
   - Initially: waits for provider assignment
   - Later: REQUEST_ACCEPTED with provider info
```

**Request ID Flow:**
- Platform generates UUID → sends to silo → **both use same ID**
- This is the `platformIncidentId` that ties the two DBs together

---

### 3. Silo Processes Request (Matching)

```
Silo Kafka Consumer                    Silo Backend
─────────────────────────────────────────────────────
1. Kafka message from medical_events/fire_events/etc.

   ┌─────────────────────────────────────────────────────────┐
   │ Silo request.worker.ts:                        │
   │                                                         │
   │ 1. Parse Kafka message                        │
   │ 2. Check request status (must be 'pending') │
   │ 3. Update status → 'in_progress'          │
   │                                                         │
   │ 4. Find nearby providers:                     │
   │    - H3 index lookup (k-ring radius 1)     │
   │    - Expand to k-ring 3 if <3 found        │
   │                                                         │
   │ 5. Calculate distances (Mapbox API)        │
   │                                                         │
   │ 6. Broadcast to top 10 providers:          │
   │    - Emit NEW_EMERGENCY to provider rooms   │
   │    - NO PII sent (privacy by design)       │
   └─────────────────────────────────────────────────────────┘

2. Provider receives WebSocket:
   {
     requestId: "uuid",
     emergencyType: "fire_truck",
     emergencyLocation: { latitude: 27.7172, longitude: 85.3240 },
     emergencyDescription: "Kitchen fire",
     h3Index: "..."
   }
```

**Matching Algorithm:**
- Uses **H3 spatial index** for fast proximity search
- Starting radius: k-ring 1 (~1km)
- Expands to k-ring 3 (~7km) if <3 providers found
- Sorts by **distance** from incident location
- Broadcasts to top 10 providers

---

### 4. Provider Accepts Request

```
Provider App (Mobile)                  Silo Backend
──────────────────────────────────────────────────���─���
1. Provider taps "Accept"
2. POST /api/v1/emergency-response/accept/:requestId

   ┌─────────────────────────────────────────────────────────┐
   │ Silo accept handler:                         │
   │                                                         │
   │ 1. Acquire Redis lock (distributed)     │
   │ 2. Check request still pending        │
   │ 3. Update:                      │
   │    - request_status → 'assigned'    │
   │    - provider.serviceStatus → 'assigned'│
   │ 4. Insert emergency_response row      │
   │ 5. Notify other providers:            │
   │    - REQUEST_ALREADY_TAKEN          │
   │                                                         │
   │ 6. Notify platform:                 │
   │    - HTTP POST to platform         │
   │      /internal/incidents/:id/update │
   │      eventType: REQUEST_ACCEPTED    │
   └─────────────────────────────────────────────────────────┘
```

---

### 5. Platform Forwards to User

```
Platform Backend                  User App
─────────────────────────────────────────────────────
1. POST /internal/incidents/:id/update
   Body: {
     userId: "...",
     eventType: "request-accepted",
     provider: { id, name, phone, vehicleNumber, location },
     route: { distance, duration, coordinates }
   }

2. Platform WebSocket:
   io.to(`user:${userId}`).emit("request-accepted", {
     requestId,
     provider: { ... },
     route: { ... },
     message: "Help is on the way!"
   })

3. User App receives:
   - Shows provider info
   - Opens tracking map
   - Shows ETA
```

---

### 6. Request Completion

```
Provider App                       Silo → Platform → User
─────────────────────────────────────────────────────
1. Provider marks "Complete"
2. POST /api/v1/emergency-response/complete/:requestId
3. Silo: status → 'completed'
4. Silo → Platform: REQUEST_COMPLETED
5. Platform WS: REQUEST_COMPLETED
6. User sees "Request Completed" screen
```

---

## Database Schema

### Platform DB (PostgreSQL + PostGIS)

```sql
-- User table (platform only)
CREATE TABLE "user" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phoneNumber BIGINT UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  isVerified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  location GEOMETRY(Point, 4326),
  currentLocation JSONB,
  createdAt TIMESTAMP DEFAULT now()
  -- ... more fields
);

-- Emergency Request (platform)
CREATE TABLE "emergency_request" (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES "user"(id),  -- FK to platform user
  serviceType service_type NOT NULL,
  requestStatus request_status DEFAULT 'pending',
  location JSONB NOT NULL,
  geoLocation GEOMETRY(Point, 4326),
  h3Index BIGINT,
  createdAt TIMESTAMP DEFAULT now()
);
```

### Silo DB (PostgreSQL + PostGIS)

```sql
-- Service Provider (silo only)
CREATE TABLE "service_provider" (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organization(id),
  name VARCHAR(255) NOT NULL,
  phoneNumber BIGINT,
  serviceType service_type NOT NULL,
  serviceStatus service_status DEFAULT 'available',
  lastLocation GEOMETRY(Point, 4326),
  h3Index BIGINT,
  currentLocation JSONB,
  createdAt TIMESTAMP DEFAULT now()
);

-- Emergency Request (silo, no user FK)
-- Note: requestId matches platform's requestId
CREATE TABLE "emergency_request" (
  id UUID PRIMARY KEY,
  userId UUID,  -- Platform user ID (no FK)
  serviceType service_type NOT NULL,
  requestStatus request_status DEFAULT 'pending',
  location JSONB NOT NULL,
  -- No geoLocation/h3Index for matching (uses provider.lastLocation)
  createdAt TIMESTAMP DEFAULT now()
);

-- Emergency Response (silo)
CREATE TABLE "emergency_response" (
  id UUID PRIMARY KEY,
  emergencyRequestId UUID REFERENCES emergency_request(id),
  serviceProviderId UUID REFERENCES service_provider(id),
  statusUpdate status_update DEFAULT 'accepted',
  assignedAt TIMESTAMP,
  respondedAt TIMESTAMP DEFAULT now()
);
```

---

## Configuration

### Environment Variables

**Platform Backend:**
```bash
MODE=platform
PORT=3000
DATABASE_URL=postgresql://root:admin123@platform_db:5432/resq_platform

# Internal API
INTERNAL_API_KEY=your-secret-key

# Silo URLs
SILO_FIRE_BASE_URL=http://fire_backend:3000
SILO_HOSPITAL_BASE_URL=http://hospital_backend:3000
SILO_POLICE_BASE_URL=http://police_backend:3000

# Dispatch config
DISPATCH_TIMEOUT_MS=2000    # 2 seconds
DISPATCH_RETRIES=2         # 2 retries
DISPATCH_BACKOFF_MS=500     # 500ms backoff
```

**Silo Backend:**
```bash
MODE=silo
SECTOR=fire  # or hospital, police
PORT=3000
DATABASE_URL=postgresql://root:admin123@fire_db:5432/resq_fire

# Internal API
INTERNAL_API_KEY=your-secret-key

# Platform URL (for sending user updates)
PLATFORM_BASE_URL=http://platform_backend:3000

# Infra
REDIS_HOST=fire_redis
KAFKA_BROKERS=fire_kafka:29092
```

---

## Socket Events

### Platform → User (Client)

| Event | Description | Payload |
|-------|------------|--------|
| `request-accepted` | Provider accepted | `{ requestId, provider, route, message }` |
| `emergency:room_joined` | Room joined | `{ requestId, emergencyLocation, emergencyType, providerId }` |
| `provider-location-updated` | Provider moving | `{ requestId, providerId, location, timestamp }` |
| `request-completed` | Done | `{ requestId, completedAt }` |
| `request-cancelled` | User cancelled | `{ requestId, message }` |
| `emergency-failed` | No providers | `{ requestId, message }` |

### Silo → Provider (Mobile)

| Event | Description | Payload |
|-------|------------|--------|
| `emergency:new` | New request | `{ requestId, emergencyType, emergencyLocation, ... }` |
| `request-already-taken` | Someone else took | `{ requestId, takenBy }` |
| `accept-confirmed` | Accept ack | `{ requestId, request, route }` |
| `connection-established` | User connected | `{ requestId, provider, requestor }` |
| `cancel-request-socket` | User cancelled | `{ requestId }` |

---

## Error Handling

### Dispatch Failure (Platform → Silo)

If HTTP to silo fails (timeout, error):
1. Keep `requestStatus` as **pending**
2. Insert `request_events` row with `eventType: 'dispatch_failed'`
3. Return **503** to user: "Service temporarily unavailable"

### Provider Timeout

If no provider accepts within 120 seconds:
1. Update status to `no_providers_available`
2. Notify platform → `EMERGENCY_FAILED` event
3. User gets push notification: "No providers available"

---

## Security Considerations

1. **No PII to Providers**: Silo worker strips username/phone/email before broadcasting
2. **Internal API Key**: All `/internal/*` endpoints require `x-internal-api-key`
3. **Session Timeout**: Silo enforces sector-specific session expiry
4. **MFA**: Silo enforces MFA for sensitive operations
5. **Provider Org Lifecycle**: Only active orgs can respond to requests

---

## Docker Compose Services

```yaml
# Platform
platform_db:
  image: postgis/postgis:16-3.4

platform_backend:
  environment:
    MODE: platform
    SILO_FIRE_BASE_URL: http://fire_backend:3000
    # ...

# Fire Silo
fire_db:
  image: postgis/postgis:16-3.4

fire_kafka:
  image: confluentinc/cp-kafka:7.4.0

fire_backend:
  environment:
    MODE: silo
    SECTOR: fire
    PLATFORM_BASE_URL: http://platform_backend:3000
    # ...
```

---

## Migration Notes

### Before (Monolithic)
- Single backend with both user + provider sockets
- Kafka for all dispatch
- PII exposed to providers

### After (Platform + Silo)
- Platform: user REST + user WebSocket + incident creation
- Silo: Kafka consumer + matching + provider WebSocket
- HTTP bridge replaces Kafka for platform→silo
- No PII sent to providers
- Shared `requestId` ties the two DBs together