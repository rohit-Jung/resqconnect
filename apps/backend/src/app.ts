import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { corsOptions, globalLimiter, configureSecurityMiddlewares } from '@/config';
import { notFoundMiddleware } from '@/middlewares/not-found.middleware';
import { v1Router } from '@/routes';

const app = express();

// Configure security middlewares (Helmet, compression, sanitization, etc.)
configureSecurityMiddlewares(app);

// CORS middleware - must be after security middlewares
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply global rate limiting to all routes (baseline DDoS protection)
app.use(globalLimiter);

// API routes
app.use('/api/v1', v1Router);

// Not found middleware (must be last)
app.use(notFoundMiddleware);

export { app };
