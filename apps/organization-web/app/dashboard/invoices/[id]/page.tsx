'use client';

import { Button } from '@repo/ui/button';

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  Printer,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

import { useGetPaymentById } from '@/services/organization/payments.api';

const statusMeta: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  completed: {
    label: 'PAID',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
  },
  pending: {
    label: 'PENDING',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  failed: {
    label: 'FAILED',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
  },
  refunded: {
    label: 'REFUNDED',
    icon: CreditCard,
    color: 'text-muted-foreground',
  },
};

function formatAmount(paisa: number) {
  return `NPR ${(paisa / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useGetPaymentById(id);
  const payment = data?.data?.payment;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <AlertTriangle className="h-10 w-10 text-primary" />
        <p className="text-muted-foreground">
          {(error as any)?.message ?? 'Invoice not found'}
        </p>
        <Link href="/dashboard/invoices">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const meta = statusMeta[payment.status] ?? statusMeta.pending;
  const StatusIcon = meta.icon;
  const plan = payment.subscription?.plan;
  const paidAt = payment.completedAt ?? payment.createdAt;

  return (
    <div className="min-h-screen bg-background">
      {/* Action bar — hidden in print */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 print:hidden">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Invoice document */}
      <div className="mx-auto max-w-2xl px-6 py-10 print:px-0 print:py-0">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                RESQ
              </span>
              <span className="text-2xl font-bold text-primary">.</span>
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                CONNECT
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Emergency Response Management Platform
            </p>
          </div>

          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Invoice
            </p>
            <p className="mt-0.5 font-mono text-lg font-bold text-foreground">
              {payment.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued {formatDate(payment.createdAt)}
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-6 flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${meta.color}`} />
          <span
            className={`font-mono text-sm font-bold uppercase tracking-[0.2em] ${meta.color}`}
          >
            {meta.label}
          </span>
          {payment.status === 'completed' && paidAt && (
            <span className="text-xs text-muted-foreground">
              · paid on {formatDate(paidAt)}
            </span>
          )}
        </div>

        {/* Billed to */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Billed To
            </p>
            <div className="mt-2 flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Your Organization
                </p>
                <p className="text-xs text-muted-foreground">
                  Org ID: {payment.organizationId}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Payment Method
            </p>
            <div className="mt-2 flex items-start gap-2">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold capitalize text-foreground">
                  {payment.paymentMethod}
                </p>
                {payment.khaltiTransactionId && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Txn: {payment.khaltiTransactionId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Items
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 text-sm font-medium text-foreground">
                    {plan?.name ?? 'Subscription Plan'}
                    {plan?.features && plan.features.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground before:content-['·_']"
                          >
                            {f}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            + {plan.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {plan
                      ? `${plan.durationMonths} month${plan.durationMonths > 1 ? 's' : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                    {formatAmount(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="w-48 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatAmount(payment.amount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
              <span>Total</span>
              <span>{formatAmount(payment.amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            ResqConnect Emergency Response Management Platform
          </p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
            Payment ID: {payment.id}
            {payment.khaltiPidx && ` · PIDX: ${payment.khaltiPidx}`}
          </p>
        </div>
      </div>
    </div>
  );
}
