import { Router } from 'express';

import { getDashboard } from '@/controllers/dashboard.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const adminRouter = Router();

// Mirrors the silo backend route shape: GET /admin/dashboard-analytics
adminRouter.get('/dashboard-analytics', requireAdminAuth, getDashboard);
