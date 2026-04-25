import {
  cpOrgEntitlements,
  cpOrganization,
  cpPaymentIntent,
  cpSubscriptionPlan,
} from '@repo/db/control-plane';

import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { db } from '@/db';
import { computeEntitlementsFromPlanFeatures } from '@/services/entitlements.service';
import {
  createCheckoutSchema,
  khaltiVerifySchema,
  khaltiWebhookSchema,
} from '@/validations/billing.validation';

function websiteUrlFromReturnUrl(returnUrl?: string | null) {
  if (!returnUrl) return null;
  try {
    const u = new URL(returnUrl);
    // Khalti expects a website_url base (origin is sufficient).
    return u.origin;
  } catch {
    return null;
  }
}

function coercePaymentStatus(
  s: unknown
): 'pending' | 'completed' | 'failed' | 'refunded' {
  const status = String(s ?? '').toLowerCase();
  if (status === 'completed' || status === 'paid' || status === 'success') {
    return 'completed';
  }
  if (status === 'refunded') return 'refunded';
  if (status === 'expired' || status === 'failed' || status === 'canceled') {
    return 'failed';
  }
  return 'pending';
}

export const initiateCheckout = async (req: Request, res: Response) => {
  const parsed = createCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  const { orgId, planId, returnUrl, websiteUrl } = parsed.data;
  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, orgId),
    columns: { id: true, siloBaseUrl: true, siloOrgId: true },
  });

  if (!org) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  if (!org.siloOrgId) {
    return res
      .status(400)
      .json({ ok: false, error: 'Org not provisioned to silo yet' });
  }

  const plan = await db.query.cpSubscriptionPlan.findFirst({
    where: and(
      eq(cpSubscriptionPlan.id, planId),
      eq(cpSubscriptionPlan.isActive, true)
    ),
    columns: { id: true, price: true },
  });

  if (!plan) {
    return res.status(404).json({ ok: false, error: 'Plan not found' });
  }

  const resolvedReturnUrl = returnUrl ?? envConfig.khalti_return_url;
  const resolvedWebsiteUrl =
    websiteUrl ??
    websiteUrlFromReturnUrl(resolvedReturnUrl) ??
    envConfig.khalti_website_url;

  const payload = {
    return_url: resolvedReturnUrl,
    website_url: resolvedWebsiteUrl,
    amount: plan.price,
    purchase_order_id: org.siloOrgId,
    purchase_order_name: `ResqConnect Subscription`,
    customer_info: { name: orgId },
  };

  const response = await fetch(
    `${envConfig.khalti_base_url}/epayment/initiate/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${envConfig.khalti_secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return res
      .status(400)
      .json({ ok: false, error: text || 'Khalti initiate failed' });
  }

  const data = (await response.json()) as any;
  const pidx = String(data?.pidx ?? '');

  if (pidx) {
    try {
      await db.insert(cpPaymentIntent).values({
        cpOrgId: orgId,
        planId,
        khaltiPidx: pidx,
        khaltiStatus: 'initiated',
        amount: plan.price,
      });
    } catch {
      // Ignore duplicate pidx or retries.
    }
  }

  return res.status(200).json({ ok: true, data });
};

export const initiateCheckoutMy = async (req: Request, res: Response) => {
  const auth = (req as any).auth as { org?: { cpOrgId: string } };
  const orgId = auth?.org?.cpOrgId;
  if (!orgId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Reuse existing schema but omit orgId in request body.
  const parsed = createCheckoutSchema.omit({ orgId: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  // Delegate by calling initiateCheckout logic with computed orgId.
  (req as any).body = {
    ...parsed.data,
    orgId,
  };
  return initiateCheckout(req, res);
};

export const khaltiWebhook = async (req: Request, res: Response) => {
  const parsed = khaltiWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: 'Invalid webhook payload' });
  }

  const { pidx } = parsed.data;

  // Prefer mapping org+plan from our own payment intent record.
  // Don't rely on Khalti lookup to echo back purchase_order_id.
  const intentWithOrg = await db.query.cpPaymentIntent.findFirst({
    where: eq(cpPaymentIntent.khaltiPidx, pidx),
    columns: { planId: true, cpOrgId: true },
    with: {
      org: {
        columns: { id: true, siloBaseUrl: true, siloOrgId: true },
      },
    },
  });

  const lookupRes = await fetch(
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

  if (!lookupRes.ok) {
    const text = await lookupRes.text().catch(() => '');
    return res.status(400).json({ ok: false, error: text || 'Lookup failed' });
  }

  const lookup = (await lookupRes.json()) as any;

  let org = intentWithOrg?.org;
  if (!org?.siloBaseUrl || !org.siloOrgId) {
    // Best-effort fallback for legacy payloads.
    const siloOrgId = String(lookup?.purchase_order_id || '');
    if (siloOrgId) {
      const mapped = await db.query.cpOrganization.findFirst({
        where: eq(cpOrganization.siloOrgId, siloOrgId),
        columns: { id: true, siloBaseUrl: true, siloOrgId: true },
      });
      if (mapped?.siloBaseUrl && mapped.siloOrgId) {
        org = mapped;
      }
    }
  }

  if (!org?.siloBaseUrl || !org.siloOrgId) {
    return res
      .status(404)
      .json({ ok: false, error: 'Org mapping not found for pidx' });
  }

  const normalizedStatus = coercePaymentStatus(lookup?.status);
  const paid = normalizedStatus === 'completed';

  // Always persist latest lookup info if we can.
  // This makes payment history useful even for failed/pending intents.
  try {
    await db
      .update(cpPaymentIntent)
      .set({
        khaltiStatus: normalizedStatus,
        khaltiTransactionId:
          typeof lookup?.transaction_id === 'string'
            ? lookup.transaction_id
            : null,
        amount:
          typeof lookup?.total_amount === 'number'
            ? lookup.total_amount
            : sql`${cpPaymentIntent.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(cpPaymentIntent.khaltiPidx, pidx));
  } catch {
    // Ignore persistence errors; webhook should still respond.
  }

  if (paid) {
    const planId = intentWithOrg?.planId;
    if (!planId) {
      return res.status(400).json({
        ok: false,
        error: 'Unknown payment intent (missing plan mapping)',
      });
    }

    const plan = await db.query.cpSubscriptionPlan.findFirst({
      where: eq(cpSubscriptionPlan.id, planId),
      columns: { id: true, features: true },
    });

    if (!plan) {
      return res.status(400).json({
        ok: false,
        error: 'Plan not found for payment intent',
      });
    }

    const entitlements = computeEntitlementsFromPlanFeatures(
      plan.features ?? []
    );
    const latest = await db.query.cpOrgEntitlements.findFirst({
      where: eq(cpOrgEntitlements.cpOrgId, org.id),
      columns: { version: true },
      orderBy: [desc(cpOrgEntitlements.version)],
    });

    const nextVersion = (latest?.version ?? 0) + 1;

    await db.insert(cpOrgEntitlements).values({
      cpOrgId: org.id,
      version: nextVersion,
      entitlements,
    });

    await db
      .update(cpOrganization)
      .set({ status: 'active' })
      .where(eq(cpOrganization.id, org.id));

    const statusUrl = `${org.siloBaseUrl.replace(/\/$/, '')}/api/v1/internal/orgs/${org.siloOrgId}/status`;
    const siloRes = await fetch(statusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': envConfig.internal_api_key,
      },
      body: JSON.stringify({ lifecycleStatus: 'active' }),
    });

    if (!siloRes.ok) {
      return res.status(502).json({
        ok: false,
        error: 'Payment verified but failed to activate org in silo',
        silo: {
          status: siloRes.status,
          body: await siloRes.text().catch(() => ''),
        },
      });
    }

    const entUrl = `${org.siloBaseUrl.replace(/\/$/, '')}/api/v1/internal/orgs/${org.siloOrgId}/entitlements`;
    const entRes = await fetch(entUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': envConfig.internal_api_key,
      },
      body: JSON.stringify({ version: nextVersion, entitlements }),
    });

    if (!entRes.ok) {
      return res.status(502).json({
        ok: false,
        error: 'Payment verified but failed to push entitlements to silo',
        silo: {
          status: entRes.status,
          body: await entRes.text().catch(() => ''),
        },
      });
    }
  }

  return res.status(200).json({ ok: true, lookup, activated: paid });
};

// Local-dev friendly: frontend calls this on the success page.
// It runs a Khalti lookup and updates cp_payment_intent + entitlements like the webhook.
export const verifyMyPayment = async (req: Request, res: Response) => {
  const auth = (req as any).auth as { org?: { cpOrgId: string } };
  const cpOrgId = auth?.org?.cpOrgId;
  if (!cpOrgId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const parsed = khaltiVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload' });
  }

  const { pidx } = parsed.data;
  const intent = await db.query.cpPaymentIntent.findFirst({
    where: and(
      eq(cpPaymentIntent.cpOrgId, cpOrgId),
      eq(cpPaymentIntent.khaltiPidx, pidx)
    ),
    columns: { id: true },
  });
  if (!intent?.id) {
    return res
      .status(404)
      .json({ ok: false, error: 'Payment intent not found' });
  }

  // Reuse the existing webhook logic by invoking it with the same body.
  (req as any).body = { pidx };
  return khaltiWebhook(req, res);
};

export const listPaymentsAdmin = async (req: Request, res: Response) => {
  const pageRaw = typeof req.query?.page === 'string' ? req.query.page : '';
  const limitRaw = typeof req.query?.limit === 'string' ? req.query.limit : '';
  const status = typeof req.query?.status === 'string' ? req.query.status : '';

  const page = Math.max(1, Number(pageRaw || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitRaw || 20) || 20));
  const offset = (page - 1) * limit;

  const allowed = ['pending', 'completed', 'failed', 'refunded'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status filter' });
  }

  const where = status ? eq(cpPaymentIntent.khaltiStatus, status) : undefined;

  const totalRows = await db
    .select({ total: count() })
    .from(cpPaymentIntent)
    .where(where);
  const total = totalRows[0]?.total ?? 0;

  const rows = await db.query.cpPaymentIntent.findMany({
    where,
    columns: {
      id: true,
      cpOrgId: true,
      planId: true,
      khaltiPidx: true,
      khaltiTransactionId: true,
      khaltiStatus: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      org: {
        columns: { id: true, name: true },
      },
      plan: {
        columns: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
          features: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [desc(cpPaymentIntent.createdAt)],
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(Number(total) / limit));

  return res.status(200).json({
    ok: true,
    payments: rows.map(r => ({
      id: r.id,
      organizationId: r.cpOrgId,
      amount: r.amount,
      khaltiPidx: r.khaltiPidx,
      khaltiTransactionId: r.khaltiTransactionId ?? undefined,
      status: r.khaltiStatus as any,
      paymentMethod: 'khalti' as const,
      createdAt: r.createdAt,
      completedAt: r.khaltiStatus === 'completed' ? r.updatedAt : undefined,
      organization: r.org ? { id: r.org.id, name: r.org.name } : undefined,
      subscription: r.plan ? { id: r.plan.id, plan: r.plan as any } : undefined,
    })),
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages,
    },
  });
};

export const getPaymentByIdAdmin = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

  const row = await db.query.cpPaymentIntent.findFirst({
    where: eq(cpPaymentIntent.id, id),
    columns: {
      id: true,
      cpOrgId: true,
      planId: true,
      khaltiPidx: true,
      khaltiTransactionId: true,
      khaltiStatus: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      org: { columns: { id: true, name: true } },
      plan: {
        columns: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
          features: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });

  return res.status(200).json({
    ok: true,
    payment: {
      id: row.id,
      organizationId: row.cpOrgId,
      amount: row.amount,
      khaltiPidx: row.khaltiPidx,
      khaltiTransactionId: row.khaltiTransactionId ?? undefined,
      status: row.khaltiStatus,
      paymentMethod: 'khalti' as const,
      createdAt: row.createdAt,
      completedAt: row.khaltiStatus === 'completed' ? row.updatedAt : undefined,
      organization: row.org
        ? { id: row.org.id, name: row.org.name }
        : undefined,
      subscription: row.plan
        ? { id: row.plan.id, plan: row.plan as any }
        : undefined,
    },
  });
};

export const listMyPayments = async (req: Request, res: Response) => {
  const pageRaw = typeof req.query?.page === 'string' ? req.query.page : '';
  const limitRaw = typeof req.query?.limit === 'string' ? req.query.limit : '';
  const status = typeof req.query?.status === 'string' ? req.query.status : '';

  const page = Math.max(1, Number(pageRaw || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitRaw || 20) || 20));
  const offset = (page - 1) * limit;

  const allowed = ['pending', 'completed', 'failed', 'refunded'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status filter' });
  }

  const auth = (req as any).auth as { org?: { cpOrgId: string } };
  const cpOrgId = auth?.org?.cpOrgId;
  if (!cpOrgId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const where = status
    ? and(
        eq(cpPaymentIntent.cpOrgId, cpOrgId),
        eq(cpPaymentIntent.khaltiStatus, status)
      )
    : eq(cpPaymentIntent.cpOrgId, cpOrgId);

  const totalRows = await db
    .select({ total: count() })
    .from(cpPaymentIntent)
    .where(where);
  const total = totalRows[0]?.total ?? 0;

  const rows = await db.query.cpPaymentIntent.findMany({
    where,
    columns: {
      id: true,
      cpOrgId: true,
      planId: true,
      khaltiPidx: true,
      khaltiTransactionId: true,
      khaltiStatus: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      plan: {
        columns: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
          features: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [desc(cpPaymentIntent.createdAt)],
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(Number(total) / limit));

  return res.status(200).json({
    ok: true,
    payments: rows.map(r => ({
      id: r.id,
      organizationId: r.cpOrgId,
      amount: r.amount,
      khaltiPidx: r.khaltiPidx,
      khaltiTransactionId: r.khaltiTransactionId ?? undefined,
      status: r.khaltiStatus as any,
      paymentMethod: 'khalti' as const,
      createdAt: r.createdAt,
      completedAt: r.khaltiStatus === 'completed' ? r.updatedAt : undefined,
      subscription: r.plan ? { id: r.plan.id, plan: r.plan as any } : undefined,
    })),
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages,
    },
  });
};

export const getMyPaymentById = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

  const auth = (req as any).auth as { org?: { cpOrgId: string } };
  const cpOrgId = auth?.org?.cpOrgId;
  if (!cpOrgId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const row = await db.query.cpPaymentIntent.findFirst({
    where: and(
      eq(cpPaymentIntent.id, id),
      eq(cpPaymentIntent.cpOrgId, cpOrgId)
    ),
    columns: {
      id: true,
      cpOrgId: true,
      planId: true,
      khaltiPidx: true,
      khaltiTransactionId: true,
      khaltiStatus: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      plan: {
        columns: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
          features: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });

  return res.status(200).json({
    ok: true,
    payment: {
      id: row.id,
      organizationId: row.cpOrgId,
      amount: row.amount,
      khaltiPidx: row.khaltiPidx,
      khaltiTransactionId: row.khaltiTransactionId ?? undefined,
      status: row.khaltiStatus,
      paymentMethod: 'khalti' as const,
      createdAt: row.createdAt,
      completedAt: row.khaltiStatus === 'completed' ? row.updatedAt : undefined,
      subscription: row.plan
        ? { id: row.plan.id, plan: row.plan as any }
        : undefined,
    },
  });
};

export const getMyPaymentByPidx = async (req: Request, res: Response) => {
  const pidx = typeof req.params?.pidx === 'string' ? req.params.pidx : '';
  if (!pidx) return res.status(400).json({ ok: false, error: 'Missing pidx' });

  const auth = (req as any).auth as { org?: { cpOrgId: string } };
  const cpOrgId = auth?.org?.cpOrgId;
  if (!cpOrgId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const row = await db.query.cpPaymentIntent.findFirst({
    where: and(
      eq(cpPaymentIntent.khaltiPidx, pidx),
      eq(cpPaymentIntent.cpOrgId, cpOrgId)
    ),
    columns: {
      id: true,
      cpOrgId: true,
      planId: true,
      khaltiPidx: true,
      khaltiTransactionId: true,
      khaltiStatus: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      plan: {
        columns: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
          features: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });

  return res.status(200).json({
    ok: true,
    payment: {
      id: row.id,
      organizationId: row.cpOrgId,
      amount: row.amount,
      khaltiPidx: row.khaltiPidx,
      khaltiTransactionId: row.khaltiTransactionId ?? undefined,
      status: row.khaltiStatus,
      paymentMethod: 'khalti' as const,
      createdAt: row.createdAt,
      completedAt: row.khaltiStatus === 'completed' ? row.updatedAt : undefined,
      subscription: row.plan
        ? { id: row.plan.id, plan: row.plan as any }
        : undefined,
    },
  });
};

export const getMyActiveSubscription = async (req: Request, res: Response) => {
  const auth = (req as any).auth as { org?: { cpOrgId: string } };
  const cpOrgId = auth?.org?.cpOrgId;
  if (!cpOrgId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Minimal: infer from latest completed payment intent.
  const latestPaid = await db.query.cpPaymentIntent.findFirst({
    where: and(
      eq(cpPaymentIntent.cpOrgId, cpOrgId),
      eq(cpPaymentIntent.khaltiStatus, 'completed')
    ),
    orderBy: [desc(cpPaymentIntent.updatedAt)],
    columns: {
      id: true,
      planId: true,
      updatedAt: true,
    },
    with: {
      plan: {
        columns: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
          features: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!latestPaid?.plan) {
    return res.status(200).json({ ok: true, subscription: null });
  }

  const startDate = latestPaid.updatedAt;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + latestPaid.plan.durationMonths);

  const msLeft = endDate.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return res.status(200).json({
    ok: true,
    subscription: {
      id: latestPaid.id,
      organizationId: cpOrgId,
      planId: latestPaid.planId,
      status: daysRemaining > 0 ? ('active' as const) : ('expired' as const),
      startDate,
      endDate,
      daysRemaining,
      plan: latestPaid.plan,
      createdAt: latestPaid.updatedAt,
      updatedAt: latestPaid.updatedAt,
    },
  });
};
