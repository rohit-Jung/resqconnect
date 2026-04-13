import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { corsOptions, globalLimiter } from '@/config';
import { notFoundMiddleware } from '@/middlewares/not-found.middleware';
import { v1Router } from '@/routes';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply global rate limiting to all routes
app.use(globalLimiter);

app.use('/api/v1', v1Router);
app.use(notFoundMiddleware);

export { app };
