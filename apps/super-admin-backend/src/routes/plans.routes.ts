import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from '@/controllers/plans.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const plansRouter = Router();

plansRouter.get('/', asyncHandler(listPlans));

plansRouter.post('/', requireAdminAuth, asyncHandler(createPlan));
plansRouter.put('/:id', requireAdminAuth, asyncHandler(updatePlan));
plansRouter.delete('/:id', requireAdminAuth, asyncHandler(deletePlan));
