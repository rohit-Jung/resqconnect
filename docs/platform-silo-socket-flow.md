# Platform + Silo Socket Communication

## Overview

The system uses two separate backend processes:
- **Platform** (`MODE=platform`): User-facing REST API + user WebSocket
- **Silo** (`MODE=silo`): Provider management + provider WebSocket

Since users and providers connect to different socket servers, we need to forward events between them via HTTP.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Platform                              │
│  ┌─────────────┐    ┌────────────────────────────────┐  │
│  │   REST API   │    │     User WebSocket              │  │
│  │  (Port 4001)│    │  - Create request              │  │
│  │             │    │  - Join room                   │  │
│  └─────────────┘    │  - Listen for acceptance      │  │
│         │           │  - Track provider location   │  │
│         │           └────────────────────────────────┘  │
│         │                    │                          │
│    HTTP │                  │ Socket                   │
│         ▼                  ▼                          │
├─────────────────────────────────────────────────────────────┤
│                         Silo                               │
│  ┌─────────────┐    ┌────────────────────────────────┐  │
│  │   REST API   │    │   Provider WebSocket           │  │
│  │  (Port 4000)│    │  - Receive emergencies        │  │
│  │             │    │  - Accept request            │  │
│  └─────────────┘    │  - Update location          │  │
│         │           │  - Confirm arrival          │  │
│         │           └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow

### 1. User Creates Emergency Request

```
User App ──POST /emergency-request──▶ Platform API
                                    │
                                    ▼
                               Create in DB
                                    │
                                    ▼
                               Dispatch to Silo via HTTP
                               POST /api/v1/internal/incidents/incoming
                                    │
                                    ▼
                               Silo receives, broadcasts to providers
                               (via Kafka consumer)
```

### 2. Provider Accepts Request

```
Provider ──Socket: ACCEPT_REQUEST──▶ Silo WebSocket
                                   │
                                   ▼
                              Acquire Redis lock
                              Update DB status to 'accepted'
                                   │
                                   ▼
                              1. Emit ACCEPT_CONFIRMED to provider (local)
                              2. Emit REQUEST_ACCEPTED to platform
                                 POST /api/v1/internal/incidents/:id/update
                                            │
                                            ▼
                                      Platform WebSocket
                                      io.to(`user:${userId}`).emit(REQUEST_ACCEPTED, {...})
                                            │
                                            ▼
                                      User App receives event
```

### 3. Provider Location Updates

```
Provider ──Socket: LOCATION_UPDATE──▶ Silo WebSocket
                                      │
                                      ▼
                              Emit to EMERGENCY room (local)
                              io.to(`emergency:${requestId}`).emit(PROVIDER_LOCATION_UPDATED)
                                      │
                                      ▼
                              Forward to Platform via HTTP
                              POST /api/v1/internal/incidents/:id/update
                                      │
                                      ▼
                              Platform WebSocket
                              io.to(`user:${userId}`).emit(PROVIDER_LOCATION_UPDATED)
                                      │
                                      ▼
                              User App receives location
```

### 4. Provider Confirms Arrival

```
Provider ──Socket: CONFIRM_ARRIVAL──▶ Silo WebSocket
                                      │
                                      ▼
                              Update DB status to 'completed'
                              Mark provider as available
                                      │
                                      ▼
                              Emit REQUEST_COMPLETED to emergency room (local)
                                      │
                                      ▼
                              Forward to Platform via HTTP
                              POST /api/v1/internal/incidents/:id/update
                                      │
                                      ▼
                              Platform WebSocket
                              io.to(`user:${userId}`).emit(REQUEST_COMPLETED)
                                      │
                                      ▼
                              User App receives completion
```

## Configuration

The platform URL is configured via environment variable:

```env
# In Silo's .env
PLATFORM_BASE_URL=http://localhost:4001
INTERNAL_API_KEY=something
```

The internal API key is used to authenticate HTTP calls between platform and silo.

## Internal Endpoints

### Silo Receives Dispatch (Platform → Silo)

```
POST /api/v1/internal/incidents/incoming
Headers:
  x-internal-api-key: something
Body:
{
  requestId: "uuid",
  userId: "uuid",
  emergencyType: "ambulance",
  emergencyLocation: { latitude, longitude },
  emergencyDescription: "..."
}
```

### Silo Notifies Platform (Silo → Platform)

```
POST /api/v1/internal/incidents/:requestId/update
Headers:
  x-internal-api-key: something
Body:
{
  userId: "uuid",
  eventType: "request-accepted", // or "provider-location-updated", "request-completed"
  requestStatus: "accepted",
  provider: { id, name, phone, serviceType, vehicleNumber, location },
  route: { coordinates, distance, duration },
  message: "..."
}
```

## Socket Rooms

Both platform and silo use the same room naming:

- `emergency:${requestId}` - Room for tracking an emergency
- `user:${userId}` - User's personal room
- `provider:${providerId}` - Provider's personal room

## Why HTTP Instead of Kafka?

The original design used Kafka for platform-silo communication, but:

1. **Latency**: HTTP is faster for immediate events (accept, location)
2. **Simplicity**: No Kafka message schema versioning for socket events
3. **ACK**: HTTP gives immediate acknowledgment of delivery

Kafka is still used for the initial dispatch (find providers) where async processing is acceptable.

## Route Caching

Routes are cached in Redis using the `mapbox.service.ts` `cacheRoute` function. 

**Limitation**: Platform and Silo have separate Redis instances, so:
- When provider fetches route → cached in Silo's Redis only
- When user fetches same route → Platform fetches from Mapbox (cache miss)

**Solution options**:
1. Use shared Redis for both Platform and Silo (recommended for production)
2. Include route in acceptance response (already done - provider receives route on accept)
3. Platform re-fetches route on accept event (additional Mapbox call)