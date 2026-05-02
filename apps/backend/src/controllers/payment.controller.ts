import {
  organizationSubscriptions,
  payments,
  subscriptionPlans,
} from '@repo/db/schemas';
import {
  initiateSubscriptionSchema,
  khaltiCallbackSchema,
  paymentHistoryQuerySchema,
} from '@repo/types/validations';

import { and, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import db from '@/db';
import {
  type CallbackParams,
  handleCallback,
  initiatePayment,
} from '@/services/khalti.service';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const getSubscriptionPlans = asyncHandler(async (_, res: Response) => {
  const plans = await db.query.subscriptionPlans.findMany({
    where: eq(subscriptionPlans.isActive, true),
    orderBy: [subscriptionPlans.price],
  });

  res
    .status(200)
    .json(new ApiResponse(200, 'Subscription plans retrieved', plans));
});

const initiateSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const parsedBody = initiateSubscriptionSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw ApiError.validationError(parsedBody.error);
    }

    const { planId, returnUrl } = parsedBody.data;

    const existingSubscription =
      await db.query.organizationSubscriptions.findFirst({
        where: and(
          eq(organizationSubscriptions.organizationId, loggedInOrg.id),
          eq(organizationSubscriptions.status, 'active'),
          sql`${organizationSubscriptions.endDate} > NOW()`
        ),
      });

    if (existingSubscription) {
      throw ApiError.badRequest(
        'Organization already has an active subscription'
      );
    }

    // Initiate payment with Khalti
    const result = await initiatePayment(loggedInOrg.id, planId, returnUrl);

    if (!result.success) {
      throw ApiError.badRequest(result.error || 'Failed to initiate payment');
    }

    res.status(200).json(
      new ApiResponse(200, 'Payment initiated successfully', {
        pidx: result.pidx,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId,
      })
    );
  }
);

const paymentCallback = asyncHandler(async (req: Request, res: Response) => {
  const parsedQuery = khaltiCallbackSchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw ApiError.validationError(parsedQuery.error);
  }

  const callbackParams: CallbackParams = parsedQuery.data as CallbackParams;
  const result = await handleCallback(callbackParams);

  if (!result.success) {
    const errorRedirectUrl = `${envConfig.khalti_website_url}/payment/error?error=${encodeURIComponent(result.error || 'Payment failed')}`;
    return res.redirect(errorRedirectUrl);
  }

  const successRedirectUrl = `${envConfig.khalti_website_url}/payment/success?paymentId=${result.payment?.id}`;
  res.redirect(successRedirectUrl);
});

const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const loggedInOrg = req.user;

  if (!loggedInOrg || !loggedInOrg.id) {
    throw ApiError.unauthorized('Unauthorized');
  }

  const { paymentId } = req.params;

  if (!paymentId || typeof paymentId !== 'string') {
    throw ApiError.badRequest('Payment ID is required');
  }

  const payment = await db.query.payments.findFirst({
    where: and(
      eq(payments.id, paymentId),
      eq(payments.organizationId, loggedInOrg.id)
    ),
    with: {
      subscription: {
        with: {
          plan: true,
        },
      },
    },
  });

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Payment status retrieved', payment));
});

const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const loggedInOrg = req.user;

  if (!loggedInOrg || !loggedInOrg.id) {
    throw ApiError.unauthorized('Unauthorized');
  }

  const parsedQuery = paymentHistoryQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw ApiError.validationError(parsedQuery.error);
  }

  const { page, limit, status } = parsedQuery.data;
  const offset = (page - 1) * limit;

  const whereConditions = [eq(payments.organizationId, loggedInOrg.id)];
  if (status) {
    whereConditions.push(eq(payments.status, status));
  }

  const [payment] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(and(...whereConditions));

  const count = payment ? payment.count : 0;

  const paymentHistory = await db.query.payments.findMany({
    where: and(...whereConditions),
    with: {
      subscription: {
        with: {
          plan: true,
        },
      },
    },
    orderBy: [desc(payments.createdAt)],
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(200, 'Payment history retrieved', {
      payments: paymentHistory,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    })
  );
});

const getActiveSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const subscription = await db.query.organizationSubscriptions.findFirst({
      where: and(
        eq(organizationSubscriptions.organizationId, loggedInOrg.id),
        eq(organizationSubscriptions.status, 'active'),
        sql`${organizationSubscriptions.endDate} > NOW()`
      ),
      with: {
        plan: true,
      },
      orderBy: [desc(organizationSubscriptions.createdAt)],
    });

    if (!subscription) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'No active subscription found', null));
    }

    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.status(200).json(
      new ApiResponse(200, 'Active subscription retrieved', {
        ...subscription,
        daysRemaining,
      })
    );
  }
);

const createSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || loggedInUser.role !== 'admin') {
      throw ApiError.unauthorized('Unauthorized to perform this action');
    }

    const { name, price, durationMonths, features } = req.body;

    if (!name || !price || !durationMonths) {
      throw ApiError.badRequest('Name, price, and durationMonths are required');
    }

    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values({
        name,
        price: Number(price),
        durationMonths: Number(durationMonths),
        features: features || [],
        isActive: true,
      })
      .returning();

    res
      .status(201)
      .json(new ApiResponse(201, 'Subscription plan created', newPlan));
  }
);

const updateSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || loggedInUser.role !== 'admin') {
      throw ApiError.unauthorized('Unauthorized to perform this action');
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('ID should be passed and should be string');
    }

    const { name, price, durationMonths, features, isActive } = req.body;

    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, id),
    });

    if (!existingPlan) {
      throw ApiError.notFound('Subscription plan not found');
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (durationMonths !== undefined)
      updateData.durationMonths = Number(durationMonths);
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No data to update');
    }

    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(updateData)
      .where(eq(subscriptionPlans.id, id))
      .returning();

    res
      .status(200)
      .json(new ApiResponse(200, 'Subscription plan updated', updatedPlan));
  }
);

const deleteSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || loggedInUser.role !== 'admin') {
      throw ApiError.unauthorized('Unauthorized to perform this action');
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('ID should be passed and should be string');
    }

    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, id),
    });

    if (!existingPlan) {
      throw ApiError.notFound('Subscription plan not found');
    }

    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));

    res.status(200).json(new ApiResponse(200, 'Subscription plan deleted', {}));
  }
);

export {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  initiateSubscription,
  paymentCallback,
  getPaymentStatus,
  getPaymentHistory,
  getActiveSubscription,
};
