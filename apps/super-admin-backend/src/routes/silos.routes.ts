import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import {
  listActiveSilos,
  listSilos,
  registerSilo,
} from '@/controllers/silos.controller';
import { requireInternalAuth } from '@/middlewares/internal-auth.middleware';

export const silosRouter = Router();

// Internal (silo → CP) endpoints.
silosRouter.post('/register', requireInternalAuth, asyncHandler(registerSilo));

// Admin-facing endpoints.
silosRouter.get('/active', requireInternalAuth, asyncHandler(listActiveSilos));
silosRouter.get('/', requireInternalAuth, asyncHandler(listSilos));
