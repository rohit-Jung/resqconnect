import compression from 'compression';
import type { Express, Request, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';

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
  // reduces bandwidth usage especially for large JSON responses
  app.use(
    compression({
      level: 6, // compression level (0-9)
      threshold: 1024, // only compress responses larger than 1KB
      filter: (req: Request, res: Response) => {
        // don't compress if request has 'no-transform' header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // use compression filter from the compression library
        return compression.filter(req, res);
      },
    })
  );

  // Input sanitization (Mongo-style operator injection hardening).
  // This backend uses Postgres/Drizzle, so this is defense-in-depth against
  // malicious payload keys (e.g. "$gt", dotted paths) rather than SQL injection.
  // app.use(
  //   mongoSanitize({
  //     replaceWith: '_',
  //     onSanitize: ({ req, key }) => {
  //       console.warn(
  //         `Potential NoSQL injection attempt in ${key}:`,
  //         req.body?.[key]
  //       );
  //     },
  //   })
  // );

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

  // security headers middleware - additional security headers
  app.use((_, res, next) => {
    // prevent mime type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // enable xss protection in older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // clickjacking protection
    res.setHeader('X-Frame-Options', 'DENY');

    // referrer policy for privacy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // feature policy / permissions policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );

    // remove powered by header to not reveal tech stack
    res.removeHeader('X-Powered-By');

    next();
  });

  // additional security headers for API responses
  app.use((req, res, next) => {
    // cache control for sensitive endpoints
    if (req.path.includes('auth') || req.path.includes('password')) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  });
};
