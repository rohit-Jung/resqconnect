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

### 3. NoSQL Injection Prevention (express-mongo-sanitize)
Sanitizes data to prevent MongoDB injection attacks.

**Features:**
- Removes `$` and `.` characters from user inputs
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

| Limit | Value |
|-------|-------|
| Window | 15 minutes |
| Max Requests | 100 |
| Skipped Endpoints | `/health`, `/api/v1/health` |

### Authentication Rate Limiter
Strict limits on authentication endpoints to prevent brute force attacks.

| Limit | Value |
|-------|-------|
| Window | 15 minutes |
| Max Attempts | 5 |
| Applies To | Register, Login |

### OTP Verification Rate Limiter
Prevents brute force OTP attacks.

| Limit | Value |
|-------|-------|
| Window | 30 minutes |
| Max Attempts | 5 |

### Password Reset Rate Limiter
Prevents password reset abuse.

| Limit | Value |
|-------|-------|
| Window | 1 hour |
| Max Attempts | 3 |
| Note | Only counts failed attempts |

### Emergency Request Rate Limiter
Prevents abuse of emergency request creation.

| Limit | Value |
|-------|-------|
| Window | 1 minute |
| Max Requests | 10 |

### Read-Only Endpoints Rate Limiter
More lenient limits for GET requests.

| Limit | Value |
|-------|-------|
| Window | 15 minutes |
| Max Requests | 200 |

### API Endpoints Rate Limiter
Balanced limits for general API endpoints.

| Limit | Value |
|-------|-------|
| Window | 15 minutes |
| Max Requests | 30 |

### File Upload Rate Limiter
Prevents upload abuse.

| Limit | Value |
|-------|-------|
| Window | 1 hour |
| Max Uploads | 10 |

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
   ├── Helmet
   ├── Compression
   ├── NoSQL Sanitization
   ├── HPP Prevention
   └── Security Headers
2. CORS
3. Body Parsing (JSON, URL-encoded)
4. Cookie Parser
5. Global Rate Limiter
6. API Routes
   └── Endpoint-specific rate limiters
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
- NoSQL injection attempts are logged with request details
- Consider integrating with monitoring systems (Datadog, New Relic, etc.)

### Security Incidents
- Set up alerts for:
  - Multiple 429 responses from single IP
  - Repeated NoSQL injection attempts
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
- [x] NoSQL injection prevention enabled
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
