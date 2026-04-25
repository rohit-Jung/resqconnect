The Fundamental Problem
Civilian user         lives in → platform-backend → platform_db
Responder             lives in → silo backend      → silo tenant_db

They are in different databases on different services.
They cannot have a direct foreign key relationship.

The Incident as the Bridge
The incident record exists in both databases but owns different concerns in each:
platform_db                          police_tenant_db (e.g.)
───────────────────────────────      ─────────────────────────────────
incidents                            incidents
  id: "INC-001"          ←──────────── platform_incident_id: "INC-001"
  civilian_user_id: 123               id: 789 (internal silo id)
  status: "dispatched"                responder_id: 456
  location: {lat, lng}                status: "en_route"
  type: "medical"                     notes: "..."
  silo_incident_id: 789  ──────────→  eta_minutes: 4
Neither DB has a foreign key into the other. They are linked by shared incident ID (INC-001) passed between services.

Full Flow Step by Step
1. Civilian Creates Incident
mobile-user app
      │
      ▼
POST platform-backend/api/incidents
      │
      ├── creates incident in platform_db
      │   { id: "INC-001", civilian_user_id: 123, status: "pending", type: "medical" }
      │
      └── determines which silo to notify based on incident type + location
          medical  → hospital silo
          crime    → police silo
          fire     → fire silo
2. Platform Notifies the Silo
platform-backend
      │
      ▼
POST police-silo.internal/internal/incidents/incoming
{
  platform_incident_id: "INC-001",
  type: "crime",
  location: { lat: 27.7, lng: 85.3 },
  severity: "high",
  civilian_contact: "encrypted_or_omitted"   ← minimal data, privacy
}
      │
      ▼
silo backend
  ├── creates its own incident record in tenant_db
  │   { id: 789, platform_incident_id: "INC-001", status: "received" }
  │
  └── dispatches to available responder
      { responder_id: 456, incident_id: 789 }
3. Silo Acknowledges Back to Platform
silo backend
      │
      ▼
POST platform-backend.internal/internal/incidents/INC-001/update
{
  silo_incident_id: 789,
  responder_id: "RESP-456",          ← silo's internal ID, not DB id
  responder_name: "Officer Johnson",
  eta_minutes: 4,
  status: "dispatched"
}
      │
      ▼
platform-backend
  └── updates platform_db incident record
      { silo_incident_id: 789, status: "dispatched", eta_minutes: 4 }
      └── pushes notification to civilian mobile app
4. Real Time Status Updates
Responder moves → silo backend receives GPS update
      │
      ├── updates silo DB (responder location, eta)
      │
      └── POST platform-backend.internal/internal/incidents/INC-001/update
          { eta_minutes: 2, responder_location: {lat, lng} }
                │
                ▼
          platform-backend pushes to civilian via websocket/FCM

The Data Each Service Owns
platform-backend owns:                 silo backend owns:
──────────────────────────────         ────────────────────────────────
civilian identity                      responder identity
incident creation                      dispatch logic
incident public status                 responder assignment
civilian notifications                 operational notes
location sharing to civilian           CJIS/HIPAA data
ETA display                            internal communications
rating/feedback after incident         evidence, case data
Key rule: silo never stores civilian PII beyond what's operationally necessary. Platform passes the minimum needed (location, incident type) — not name, not phone, not history.

Schema Sketch
javascript// platform_db — platform-backend owns this
const incidents = pgTable('incidents', {
  id: text('id').primaryKey(),               // "INC-001" — generated here
  civilianUserId: integer('civilian_user_id')
    .references(() => users.id),             // FK exists here, not in silo
  type: text('type'),                        // medical/crime/fire
  status: text('status'),                    // pending/dispatched/resolved
  location: jsonb('location'),
  siloSector: text('silo_sector'),           // which silo handles this
  siloIncidentId: text('silo_incident_id'),  // silo's internal ID, set after dispatch
  responderName: text('responder_name'),     // safe to store, display only
  etaMinutes: integer('eta_minutes'),
  createdAt: timestamp('created_at').defaultNow()
})

// tenant_db inside police silo — silo backend owns this
const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),             // silo internal ID
  platformIncidentId: text('platform_incident_id'), // "INC-001" — the shared key
  responderId: integer('responder_id')
    .references(() => responders.id),        // FK exists here
  status: text('status'),
  operationalNotes: text('operational_notes'),  // CJIS protected
  dispatchedAt: timestamp('dispatched_at'),
  resolvedAt: timestamp('resolved_at')
})

The Relationship Map
platform_db                          silo tenant_db
┌────────────────────┐               ┌──────────────────────────┐
│ users (civilians)  │               │ responders               │
│  id: 123           │               │  id: 456                 │
│  name: "Ram"       │               │  name: "Officer Johnson" │
└────────┬───────────┘               └──────────┬───────────────┘
         │                                      │
         │ FK                                   │ FK
         ▼                                      ▼
┌────────────────────┐  shared ID  ┌──────────────────────────┐
│ incidents          │ ←─────────→ │ incidents                │
│  id: "INC-001"     │ "INC-001"   │  platform_incident_id:   │
│  civilian: 123     │             │    "INC-001"             │
│  silo_id: 789      │             │  responder: 456          │
└────────────────────┘             └──────────────────────────┘

No cross-DB foreign key.
Linked only by the shared incident ID string.
Each side owns its own relationships internally.

The Clean Rule
Never share a database primary key as a foreign key across services.
Share a domain ID ("INC-001") that both services store as a plain text field.
Each service resolves its own relationships internally using that shared ID.
This pattern is called a correlation ID — it is the standard way microservices link records across boundaries without coupling their databases.
