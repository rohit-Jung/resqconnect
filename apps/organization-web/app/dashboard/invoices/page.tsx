'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  type IPaymentQueryParams,
  useGetPaymentHistory,
} from '@/services/organization/payments.api';

const PAGE_SIZE = 10;

const statusMeta: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  completed: { label: 'Paid', icon: CheckCircle, variant: 'default' },
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' },
  failed: { label: 'Failed', icon: XCircle, variant: 'destructive' },
  refunded: { label: 'Refunded', icon: CreditCard, variant: 'outline' },
};

function formatAmount(paisa: number) {
  return `NPR ${(paisa / 100).toFixed(2)}`;
}

function invoiceNumber(id: string, index: number) {
  return `INV-${String(index + 1).padStart(4, '0')}`;
}

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const params: IPaymentQueryParams = {
    page,
    limit: PAGE_SIZE,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error } = useGetPaymentHistory(params);

  const payload = data?.data;
  const payments = payload?.payments ?? [];
  const pagination = payload?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-foreground">
            RESQ
          </span>
          <span className="text-xl font-bold text-primary">.</span>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 text-muted-foreground">
            Payment history and invoice documents ({total} total)
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {(['', 'completed', 'pending', 'failed', 'refunded'] as const).map(
              s => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`rounded px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s === '' ? 'All' : s}
                </button>
              )
            )}
          </div>
        </div>

        {/* Table card */}
        <Card className="rounded-xl">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              All Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <AlertTriangle className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {(error as any)?.message ?? 'Failed to load invoices'}
                </p>
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {statusFilter
                    ? `No ${statusFilter} invoices`
                    : 'No invoices yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {[
                        'Invoice #',
                        'Date',
                        'Plan',
                        'Amount',
                        'Status',
                        'Transaction ID',
                        '',
                      ].map(col => (
                        <th
                          key={col}
                          className="px-6 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, i) => {
                      const meta =
                        statusMeta[payment.status] ?? statusMeta.pending;
                      const StatusIcon = meta.icon;
                      const globalIndex = (page - 1) * PAGE_SIZE + i;

                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-border last:border-0 hover:bg-muted/50"
                        >
                          <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                            {invoiceNumber(payment.id, globalIndex)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {payment.subscription?.plan?.name ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                  : payment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                                    : payment.status === 'failed'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                      : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {payment.khaltiTransactionId ?? (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/dashboard/invoices/${payment.id}`}>
                              <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                View
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40 hover:bg-muted"
            >
              Previous
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40 hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
