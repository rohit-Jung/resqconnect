import { eq } from 'drizzle-orm';

import { envConfig, logger } from '@/config';
import db from '@/db';
import {
  organizationSubscriptions,
  payments,
  subscriptionPlans,
} from '@/models';

export interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

export interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: 'Completed' | 'Pending' | 'Initiated' | 'Refunded' | 'Expired';
  transaction_id: string;
  fee: number;
  refunded: boolean;
}

export interface KhaltiErrorResponse {
  error_key?: string;
  detail?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  pidx?: string;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  status?: string;
  transactionId?: string;
  amount?: number;
  error?: string;
}

export interface CallbackParams {
  pidx: string;
  transaction_id?: string;
  tidx?: string;
  amount?: string;
  total_amount?: string;
  mobile?: string;
  status: string;
  purchase_order_id?: string;
  purchase_order_name?: string;
}

export async function initiatePayment(
  organizationId: string,
  planId: string,
  returnUrl?: string
): Promise<InitiatePaymentResult> {
  try {
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      return { success: false, error: 'Subscription plan not found' };
    }

    if (!plan.isActive) {
      return { success: false, error: 'Subscription plan is not active' };
    }

    const [newPayment] = await db
      .insert(payments)
      .values({
        organizationId,
        amount: plan.price,
        status: 'pending',
        paymentMethod: 'khalti',
      })
      .returning();

    if (!newPayment) {
      return { success: false, error: 'Failed to create payment record' };
    }

    // Prepare Khalti initiate request
    const khaltiPayload = {
      return_url: returnUrl || envConfig.khalti_return_url,
      website_url: envConfig.khalti_website_url,
      amount: plan.price, // Amount in paisa
      purchase_order_id: newPayment.id,
      purchase_order_name: `${plan.name} Subscription`,
      customer_info: {
        name: organizationId,
      },
    };

    const response = await fetch(
      `${envConfig.khalti_base_url}/epayment/initiate/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${envConfig.khalti_secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(khaltiPayload),
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as KhaltiErrorResponse;
      logger.error('Khalti initiate error:', errorData);

      // Update payment status to failed
      await db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, newPayment.id));

      return {
        success: false,
        error: errorData.detail || 'Failed to initiate Khalti payment',
      };
    }

    const data = (await response.json()) as KhaltiInitiateResponse;

    await db
      .update(payments)
      .set({ khaltiPidx: data.pidx })
      .where(eq(payments.id, newPayment.id));

    logger.info(`Khalti payment initiated: ${data.pidx}`);

    return {
      success: true,
      pidx: data.pidx,
      paymentUrl: data.payment_url,
      paymentId: newPayment.id,
    };
  } catch (error) {
    logger.error('Error initiating Khalti payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function verifyPayment(
  pidx: string
): Promise<VerifyPaymentResult> {
  try {
    const response = await fetch(
      `${envConfig.khalti_base_url}/epayment/lookup/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${envConfig.khalti_secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as KhaltiErrorResponse;
      logger.error('Khalti lookup error:', errorData);
      return {
        success: false,
        error: errorData.detail || 'Failed to verify Khalti payment',
      };
    }

    const data = (await response.json()) as KhaltiLookupResponse;

    logger.info(`Khalti payment verified: ${pidx}, status: ${data.status}`);

    return {
      success: true,
      status: data.status,
      transactionId: data.transaction_id,
      amount: data.total_amount,
    };
  } catch (error) {
    logger.error('Error verifying Khalti payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function handleCallback(params: CallbackParams): Promise<{
  success: boolean;
  payment?: typeof payments.$inferSelect;
  error?: string;
}> {
  try {
    const { pidx, status, transaction_id } = params;

    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.khaltiPidx, pidx),
    });

    if (!existingPayment) {
      logger.error(`Payment not found for pidx: ${pidx}`);
      return { success: false, error: 'Payment not found' };
    }

    // If payment is already completed, return early
    if (existingPayment.status === 'completed') {
      logger.info(`Payment ${existingPayment.id} already completed`);
      return { success: true, payment: existingPayment };
    }

    const verifyResult = await verifyPayment(pidx);

    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error };
    }

    let paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' =
      'pending';
    if (verifyResult.status === 'Completed') {
      paymentStatus = 'completed';
    } else if (verifyResult.status === 'Refunded') {
      paymentStatus = 'refunded';
    } else if (verifyResult.status === 'Expired') {
      paymentStatus = 'failed';
    }

    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: paymentStatus,
        khaltiTransactionId: verifyResult.transactionId || transaction_id,
        completedAt:
          paymentStatus === 'completed' ? new Date().toISOString() : null,
      })
      .where(eq(payments.id, existingPayment.id))
      .returning();

    // If payment completed, create subscription
    if (paymentStatus === 'completed') {
      // Get the plan from purchase_order_name or find it
      // For now, we'll need to store planId somewhere - let's use a lookup
      const planId = params.purchase_order_id
        ? await getPlanIdFromPayment(existingPayment.id)
        : null;

      if (planId) {
        const plan = await db.query.subscriptionPlans.findFirst({
          where: eq(subscriptionPlans.id, planId),
        });

        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + plan.durationMonths);

          const [newSubscription] = await db
            .insert(organizationSubscriptions)
            .values({
              organizationId: existingPayment.organizationId,
              planId: plan.id,
              status: 'active',
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            })
            .returning();

          if (newSubscription) {
            await db
              .update(payments)
              .set({ subscriptionId: newSubscription.id })
              .where(eq(payments.id, existingPayment.id));
          }

          logger.info(
            `Subscription created for organization ${existingPayment.organizationId}`
          );
        }
      }
    }

    logger.info(`Payment ${existingPayment.id} updated to ${paymentStatus}`);

    return { success: true, payment: updatedPayment };
  } catch (error) {
    logger.error('Error handling Khalti callback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function getPlanIdFromPayment(paymentId: string): Promise<string | null> {
  // For now, return the first active plan
  // In production, store the planId in the payment record or metadata
  const activePlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.isActive, true),
  });
  return activePlan?.id || null;
}

export default {
  initiatePayment,
  verifyPayment,
  handleCallback,
};
