import compression from 'compression';
import { Express } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

/**
 * Configure and apply comprehensive security middlewares to the Express app
 * Includes: Helmet, compression, NoSQL injection prevention, parameter pollution prevention
 */
export const configureSecurityMiddlewares = (app: Express): void => {
  // Helmet middleware - sets various HTTP headers to secure the app
  // Includes protections against XSS, Clickjacking, MIME type sniffing, etc.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      referrerPolicy: {
        policy: 'no-referrer',
      },
      xssFilter: true,
      noSniff: true,
      ieNoOpen: true,
    })
  );

  // Compression middleware - compresses response bodies for faster transmission
  // Reduces bandwidth usage especially for large JSON responses
  app.use(
    compression({
      level: 6, // Compression level (0-9, 6 is a good balance)
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        // Don't compress if request has 'no-transform' header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression filter from the compression library
        return compression.filter(req, res);
      },
    })
  );

  // Data sanitization against NoSQL injection attacks
  // Removes $ and . from user inputs to prevent MongoDB query injection
  app.use(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Potential NoSQL injection attempt in ${key}:`, req.body?.[key]);
      },
    })
  );

  // HTTP Parameter Pollution (HPP) prevention
  // Prevents attacks where multiple parameters with same name are sent
  app.use(
    hpp({
      whitelist: [
        // Add query parameters that should be allowed to have multiple values
        'sort',
        'fields',
        'filter',
        'page',
        'limit',
        'search',
      ],
    })
  );

  // Security headers middleware - additional security headers
  app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection in older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Clickjacking protection
    res.setHeader('X-Frame-Options', 'DENY');

    // Referrer policy for privacy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Feature policy / Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove powered by header to not reveal tech stack
    res.removeHeader('X-Powered-By');

    next();
  });

  // Additional security headers for API responses
  app.use((req, res, next) => {
    // Cache control for sensitive endpoints
    if (req.path.includes('auth') || req.path.includes('password')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  });
};
