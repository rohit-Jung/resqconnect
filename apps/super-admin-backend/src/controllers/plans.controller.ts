import { cpSubscriptionPlan } from '@repo/db/control-plane';
import { ApiResponse } from '@repo/utils/api';

import { asc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';
import {
  createPlanSchema,
  updatePlanSchema,
} from '@/validations/plans.validation';

export const listPlans = async (_req: Request, res: Response) => {
  const plans = await db.query.cpSubscriptionPlan.findMany({
    where: eq(cpSubscriptionPlan.isActive, true),
    orderBy: [asc(cpSubscriptionPlan.price)],
  });
  return res.status(200).json(new ApiResponse(200, 'OK', { plans }));
};

export const createPlan = async (req: Request, res: Response) => {
  const parsed = createPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  const [created] = await db
    .insert(cpSubscriptionPlan)
    .values({
      name: parsed.data.name,
      price: parsed.data.price,
      durationMonths: parsed.data.durationMonths,
      features: parsed.data.features,
      isActive: parsed.data.isActive ?? true,
    })
    .returning({ id: cpSubscriptionPlan.id });

  return res.status(201).json(new ApiResponse(201, 'OK', { plan: created }));
};

export const updatePlan = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id)
    return res.status(400).json(new ApiResponse(400, 'Missing plan id', null));

  const parsed = updatePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  const [updated] = await db
    .update(cpSubscriptionPlan)
    .set({
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
      ...(parsed.data.durationMonths !== undefined
        ? { durationMonths: parsed.data.durationMonths }
        : {}),
      ...(parsed.data.features !== undefined
        ? { features: parsed.data.features }
        : {}),
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(cpSubscriptionPlan.id, id as any))
    .returning({ id: cpSubscriptionPlan.id });

  if (!updated)
    return res.status(404).json(new ApiResponse(404, 'Plan not found', null));
  return res.status(200).json(new ApiResponse(200, 'OK', { plan: updated }));
};

export const deletePlan = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id)
    return res.status(400).json(new ApiResponse(400, 'Missing plan id', null));

  // Soft-delete by deactivating the plan.
  const [updated] = await db
    .update(cpSubscriptionPlan)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(cpSubscriptionPlan.id, id as any))
    .returning({ id: cpSubscriptionPlan.id });

  if (!updated)
    return res.status(404).json(new ApiResponse(404, 'Plan not found', null));
  return res.status(200).json({ ok: true });
};
