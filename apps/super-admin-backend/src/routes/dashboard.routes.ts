import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import { getDashboard } from '@/controllers/dashboard.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAdminAuth, asyncHandler(getDashboard));
