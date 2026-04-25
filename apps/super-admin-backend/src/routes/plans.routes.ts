import { Router } from 'express';

import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from '@/controllers/plans.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const plansRouter = Router();

plansRouter.get('/', listPlans);

// Minimal admin endpoint (no auth yet in this app) to seed plans.
plansRouter.post('/', requireAdminAuth, createPlan);
plansRouter.put('/:id', requireAdminAuth, updatePlan);
plansRouter.delete('/:id', requireAdminAuth, deletePlan);
