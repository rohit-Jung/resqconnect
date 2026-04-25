# Security Middleware Configuration

## Overview

This document describes the comprehensive security middleware configuration for the ResqConnect backend API. The implementation follows industry best practices and OWASP recommendations for production-grade Express.js applications.

## Security Layers

### 1. Helmet Middleware

Helmet helps secure Express apps by setting various HTTP headers.

**Features:**

- **Content Security Policy (CSP)**: Prevents XSS attacks by restricting resource origins
- **HSTS (HTTP Strict Transport Security)**: Forces HTTPS connections (1 year max-age)
- **X-Frame-Options**: Prevents clickjacking attacks (set to DENY)
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer Policy**: Controls referrer information (strict-origin-when-cross-origin)
- **XSS Filter**: Enables browser XSS filters

### 2. Compression Middleware

Reduces response size for faster transmission and lower bandwidth usage.

**Configuration:**

- Compression level: 6 (balanced performance/compression)
- Threshold: 1KB (only compress responses > 1KB)
- Respects X-No-Compression header

**Benefits:**

- Reduces bandwidth by 60-80% for JSON responses
- Improves API response times
- Better user experience on slow connections

### 3. Input Sanitization (express-mongo-sanitize)

Sanitizes request payloads by stripping MongoDB operator characters from input keys. This is primarily useful for apps that build Mongo-style query objects; this backend uses Postgres/Drizzle, so treat this as a defense-in-depth input hardening step (not SQL injection protection).

**Features:**

- Removes `$` and `.` characters from user inputs (object keys)
- Prevents queries like: `{"email": {"$gt": ""}, "password": {"$ne": ""}}`
- Logs potential injection attempts
- Configurable replacement character (default: `_`)

### 4. HTTP Parameter Pollution (HPP) Prevention

Prevents attacks using multiple parameters with the same name.

**Configuration:**

- Whitelist for parameters that should allow multiple values
- Allowed parameters: sort, fields, filter, page, limit, search

### 5. Additional Security Headers

Custom middleware for additional security measures.

**Headers Set:**

- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Enable XSS filters
- `X-Frame-Options: DENY` - Prevent clickjacking
- `Referrer-Policy` - Privacy protection
- `Permissions-Policy` - Disable unused features (geolocation, microphone, camera)
- Removes `X-Powered-By` header to hide tech stack

### 6. Cache Control for Sensitive Endpoints

Ensures sensitive data isn't cached by browsers or proxies.

**Applied to:**

- Authentication endpoints (`/auth`)
- Password endpoints (`/password`)

**Headers:**

- `Cache-Control: no-store, no-cache, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

## Rate Limiting

### Global Rate Limiter

Applied to all routes for baseline DDoS protection.

| Limit             | Value                       |
| ----------------- | --------------------------- |
| Window            | 15 minutes                  |
| Max Requests      | 100                         |
| Skipped Endpoints | `/health`, `/api/v1/health` |

### Authentication Rate Limiter

Strict limits on authentication endpoints to prevent brute force attacks.

| Limit        | Value           |
| ------------ | --------------- |
| Window       | 15 minutes      |
| Max Attempts | 5               |
| Applies To   | Register, Login |

### OTP Verification Rate Limiter

Prevents brute force OTP attacks.

| Limit        | Value      |
| ------------ | ---------- |
| Window       | 30 minutes |
| Max Attempts | 5          |

### Password Reset Rate Limiter

Prevents password reset abuse.

| Limit        | Value                       |
| ------------ | --------------------------- |
| Window       | 1 hour                      |
| Max Attempts | 3                           |
| Note         | Only counts failed attempts |

### Emergency Request Rate Limiter

Prevents abuse of emergency request creation.

| Limit        | Value    |
| ------------ | -------- |
| Window       | 1 minute |
| Max Requests | 10       |

### Read-Only Endpoints Rate Limiter

More lenient limits for GET requests.

| Limit        | Value      |
| ------------ | ---------- |
| Window       | 15 minutes |
| Max Requests | 200        |

### API Endpoints Rate Limiter

Balanced limits for general API endpoints.

| Limit        | Value      |
| ------------ | ---------- |
| Window       | 15 minutes |
| Max Requests | 30         |

### File Upload Rate Limiter

Prevents upload abuse.

| Limit       | Value  |
| ----------- | ------ |
| Window      | 1 hour |
| Max Uploads | 10     |

## Rate Limit Response

When a rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 300,
  "timestamp": "2024-04-13T07:46:50Z"
}
```

**Response Headers:**

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Unix timestamp when limit resets

## Implementation Details

### Middleware Execution Order

```
1. configureSecurityMiddlewares (Helmet, Compression, Sanitization, etc.)
   |-- Helmet
   |-- Compression
   |-- Input Sanitization
   |-- HPP Prevention
   `-- Security Headers
2. CORS
3. Body Parsing (JSON, URL-encoded)
4. Cookie Parser
5. Global Rate Limiter
6. API Routes
   `-- Endpoint-specific rate limiters
7. Not Found Handler
```

### Client IP Detection

The rate limiter correctly handles:

- Direct connections: Uses socket remote address
- Proxy connections: Uses X-Forwarded-For header
- Multiple proxies: Extracts first IP from X-Forwarded-For

### Storage Backend

**Current (Single Instance):**

- Uses in-memory MemoryStore
- Rate limit data is stored in application memory

**Production (Multiple Instances):**

```typescript
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const redisClient = redis.createClient();

export const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  // ... other options
});
```

## Environment Configuration

Add to `.env`:

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX=100           # Max requests per window
RATE_LIMIT_AUTH_MAX=5        # Auth endpoint max
RATE_LIMIT_OTP_MAX=5         # OTP endpoint max

# Security
HELMET_CSP_ENABLED=true
HSTS_MAX_AGE=31536000        # 1 year in seconds
```

## Testing Rate Limits

### Using curl:

```bash
# Hit an endpoint 101 times to trigger global rate limit
for i in {1..101}; do
  curl http://localhost:3000/api/v1/health
done

# Should see 429 status on 101st request
curl -i http://localhost:3000/api/v1/health
```

### Using Apache Bench:

```bash
# Generate 100 requests with 10 concurrent connections
ab -n 100 -c 10 http://localhost:3000/api/v1/users/register
```

## Monitoring and Logging

### Rate Limit Attempts

- Failed auth attempts are logged automatically
- Input sanitization events (if enabled) may be logged
- Consider integrating with monitoring systems (Datadog, New Relic, etc.)

### Security Incidents

- Set up alerts for:
  - Multiple 429 responses from single IP
  - Repeated suspicious input sanitization events
  - Unusual rate limit patterns

## Best Practices

1. **Keep rate limits conservative**: Start with low limits and increase if needed
2. **Monitor patterns**: Watch for legitimate users hitting limits
3. **Use HTTPS**: Always use HTTPS in production
4. **Rotate secrets**: Regularly rotate API keys and secrets
5. **Update dependencies**: Keep security packages up-to-date
6. **Log securely**: Don't log sensitive data
7. **Test security**: Regularly test with security tools (OWASP ZAP, Burp Suite)
8. **Use Redis for distributed systems**: Multiple instances need shared rate limit store

## Security Checklist

- [x] Helmet middleware enabled
- [x] Global rate limiting applied
- [x] Endpoint-specific rate limits configured
- [x] Input sanitization middleware enabled (see notes; app uses SQL DB)
- [x] HPP prevention enabled
- [x] CORS properly configured
- [x] Sensitive endpoints don't cache responses
- [x] Security headers properly set
- [x] Error handling doesn't leak stack traces
- [x] Rate limit headers returned to clients

## Troubleshooting

### Rate limit too strict

Adjust the `max` value in the rate limiter configuration or implement whitelist for internal IPs.

### X-Forwarded-For not working

Ensure your reverse proxy (Nginx, Apache) is configured to pass this header:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### Rate limits not persisting across instances

Implement Redis store instead of in-memory store for distributed rate limiting.

## References

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [express-rate-limit Documentation](https://github.com/nfriedly/express-rate-limit)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

## Compliance Mapping (Sector-Driven)

This backend has a small set of **sector-driven compliance controls**. These controls are toggled by the `SECTOR` environment variable and are intentionally implemented in middleware so the same codebase can run with different requirements.

Important: this is a **best-effort mapping** of controls implemented in code. It is not a certification and does not cover infrastructure controls (TLS termination, WAF, backups, key management, device policy, etc.).

### Compliance Sources (Links)

- HIPAA Security Rule (45 CFR Part 164 Subpart C): https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C
- CJIS Security Policy (FBI): https://www.fbi.gov/services/cjis/cjis-security-policy-resource-center
- OWASP Top 10 (Web App Risks): https://owasp.org/www-project-top-ten/

### How Sector-Driven Compliance Works

**Why `getSectorConfig()` happens first**

- The backend reads `SECTOR` and builds a `SectorConfig` from defaults + overrides.
- `src/index.ts` calls `getSectorConfig()` on startup to fail fast on misconfiguration.
- Request-time middleware calls `getSectorConfig()` (cached) to decide whether controls are enabled.

Code:

- `packages/config/src/index.ts`: `loadSectorConfig()` + `getSectorConfig()` cache
- `packages/config/src/sectors.ts`: compliance flags and per-sector overrides
- `apps/backend/src/index.ts`: validates sector early (`getSectorConfig()`)
- `apps/backend/src/app.ts`: wires compliance middleware after `populateUserFromToken`

### Sector Defaults (What Changes Per Sector)

Defined in `packages/config/src/sectors.ts`:

- `fire`: baseline (no HIPAA/CJIS toggles, MFA off, 1h session timeout)
- `hospital`: HIPAA toggles on, MFA required, 30m session timeout
- `police`: CJIS toggles on, MFA required, 15m session timeout, failed-login lockout enabled

### Implemented Controls (What's Actually Enforced)

#### 1. Step-Up MFA (Multi-Factor Authentication)

What it is:

- **MFA** requires an additional factor beyond the primary login session.
- In this codebase, MFA is implemented as a **step-up token**: the user requests an email OTP, verifies it, and receives a short-lived token that must be presented on subsequent requests.

Why we do it this way:

- It allows enabling MFA only for regulated sectors without changing every controller.
- It avoids breaking existing clients by keeping the bootstrap endpoints (`/api/v1/mfa/*`) MFA-exempt.

Code:

- Sector toggle: `packages/config/src/sectors.ts` (`compliance.mfaRequired`)
- HTTP enforcement: `apps/backend/src/middlewares/mfa.middleware.ts` (expects `x-mfa-token`)
- MFA endpoints: `apps/backend/src/routes/v1/mfa.routes.ts`
- OTP issuance + verification: `apps/backend/src/controllers/mfa.controller.ts`
- Token issuance/verification (Redis): `apps/backend/src/services/mfa.service.ts`
- Socket enforcement: `apps/backend/src/socket/index.ts` (reads `x-mfa-token` or handshake auth)

Compliance mapping:

- CJIS: supports MFA expectations for access to sensitive systems (exact requirements depend on your CJIS policy baseline).
- HIPAA: supports access control safeguards (implementation detail varies by risk analysis).

#### 2. OTP vs MFA (Quick Clarification)

- **OTP (One-Time Password)** in this app is used in two places:
  - Account verification / password flows in controllers (user/org/provider) using `sendOTP(...)`.
  - MFA bootstrap flow (`/api/v1/mfa/request` + `/api/v1/mfa/verify`).
- **MFA** here is not a TOTP authenticator-app setup; it is an email-OTP-based step-up factor that produces a short-lived token.

Code:

- OTP generation: `apps/backend/src/utils/tokens/otpTokens.ts` (uses `authenticator`)
- Email delivery: `apps/backend/src/utils/services/email.ts`

#### 3. Session Timeout (Compliance Session Max Age)

What it is:

- Enforces a **maximum session age** based on JWT `iat` regardless of JWT `exp`.

Why:

- Some policies require session lock/timeout even if a long-lived token exists.

Code:

- Toggle/values: `packages/config/src/sectors.ts` (`compliance.sessionTimeoutSeconds`)
- HTTP enforcement: `apps/backend/src/middlewares/session-timeout.middleware.ts`
- Socket enforcement: `apps/backend/src/socket/index.ts`

#### 4. Audit Logging (Regulated Sectors)

What it is:

- Writes a minimal request audit log row on response completion.
- Designed to be non-blocking (audit failures do not break the request).

Why:

- Audit trails are commonly required for regulated environments (accountability, incident response, monitoring).

Code:

- Enablement: `apps/backend/src/middlewares/audit-log.middleware.ts` (enabled when HIPAA or CJIS flag is on)
- Storage: `apps/backend/src/services/audit-log.service.ts` (writes to `auditLog` table)
- Sanitized aggregates for ingestion: `apps/backend/src/routes/v1/internal.routes.ts` (`/sanitized-index`)

Compliance mapping:

- HIPAA: Audit Controls (45 CFR 164.312(b))
- CJIS: auditing/accountability expectations

#### 5. PHI/PII Response Masking for Internal Endpoints (HIPAA Mode)

What it is:

- Redacts common PHI/PII-ish fields in JSON responses for `/api/v1/internal/*`.
- Implemented by wrapping `res.json` so controllers do not need to be rewritten.

Why it's scoped to internal endpoints:

- Masking all API responses would likely break client apps expecting full payloads.
- The internal/control-plane endpoints are where cross-silo reporting/ingestion happens.

Code:

- `apps/backend/src/middlewares/phi-mask.middleware.ts`

Compliance mapping:

- HIPAA: supports "minimum necessary" style data exposure controls (policy-dependent; not a replacement for proper data classification).

#### 6. Brute Force Mitigation

Controls:

- Rate limiting on auth/OTP/password reset routes.
- Failed-login lockout (sector-driven; enabled for police/CJIS).

Code:

- Rate limiting configuration: `apps/backend/src/config/rate-limit.config.ts`
- Usage in routes: `apps/backend/src/routes/v1/user.routes.ts`, `apps/backend/src/routes/v1/organization.routes.ts`, `apps/backend/src/routes/v1/service-provider.routes.ts`
- Lockout store: `apps/backend/src/services/failed-login-lockout.service.ts`
- Lockout used by logins:
  - `apps/backend/src/controllers/user.controller.ts`
  - `apps/backend/src/controllers/service-provider.controller.ts`
  - `apps/backend/src/controllers/organization.controller.ts`

Compliance mapping:

- OWASP Top 10: helps mitigate credential stuffing / brute force patterns.
- CJIS: supports account lockout expectations.

#### 7. Authorization Guards (RBAC + Org Lifecycle)

Controls:

- Minimal route-prefix RBAC for admin routes.
- Organization lifecycle status gating (restricted JWTs; block operational endpoints when inactive).

Code:

- RBAC: `apps/backend/src/middlewares/rbac.middleware.ts`
- Org status guards: `apps/backend/src/middlewares/org-status.guard.ts`
- Token claims: `apps/backend/src/utils/tokens/jwtTokens.ts` (restricted/orgStatus)
- Applied in routes:
  - `apps/backend/src/routes/v1/organization.routes.ts`
  - `apps/backend/src/routes/v1/service-provider.routes.ts`
- Also enforced for sockets: `apps/backend/src/socket/index.ts`

#### 8. Entitlements-Driven Limits (Control Plane)

Controls:

- Org-tier rate limiting (Redis-backed, works across instances).
- Feature gating (analytics enabled) and provider count cap.

Code:

- Entitlements snapshot ingestion: `apps/backend/src/routes/v1/internal.routes.ts` (`/orgs/:orgId/entitlements`)
- Rate limiter: `apps/backend/src/middlewares/entitlements-rate-limit.middleware.ts`
- Entitlements helpers: `apps/backend/src/services/entitlements.service.ts`
- Feature guards: `apps/backend/src/middlewares/entitlements.guard.ts`

#### 9. Baseline Web Hardening (Non-Compliance Specific)

Controls:

- Security headers (Helmet + custom headers)
- HPP protection
- Response compression
- Cache-control for auth/password endpoints

Code:

- `apps/backend/src/middlewares/security.middleware.ts`

Note on "NoSQL sanitize":

- The app uses Postgres/Drizzle (`apps/backend/src/db/index.ts`). `express-mongo-sanitize` is primarily for Mongo-style operator injection and is not a substitute for SQL injection prevention.
- SQL injection protection is primarily achieved by parameterized queries through the ORM and avoiding unsafe raw SQL construction.
