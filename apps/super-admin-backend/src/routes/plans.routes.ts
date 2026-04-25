import { Router } from 'express';

import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from '@/controllers/plans.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';
import { asyncHandler } from '@/utils/async-handler';

export const plansRouter = Router();

plansRouter.get('/', asyncHandler(listPlans));

plansRouter.post('/', requireAdminAuth, asyncHandler(createPlan));
plansRouter.put('/:id', requireAdminAuth, asyncHandler(updatePlan));
plansRouter.delete('/:id', requireAdminAuth, asyncHandler(deletePlan));
