'use client';

import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  useGetAllPayments,
  useGetSubscriptionPlans,
} from '@/services/super-admin/payments.api';
import type { CpPlansListResponse } from '@/types/control-plane.types';

export default function PaymentsPage() {
  const [paymentPage, setPaymentPage] = useState(1);

  const {
    data: plansData,
    isLoading,
    isError,
    error,
  } = useGetSubscriptionPlans();

  const { data: paymentsData } = useGetAllPayments({
    page: paymentPage,
    limit: 10,
  });

  const plans = plansData?.data?.plans ?? [];
  const typedPlans: CpPlansListResponse['plans'] = plans;

  const payments = paymentsData?.data?.payments ?? [];
  const pagination = paymentsData?.data?.pagination;

  const stats = payments.reduce(
    (acc, p) => {
      acc.total += 1;
      if (p.status === 'completed') acc.completedRevenue += p.amount;
      if (p.status === 'pending') acc.pending += 1;
      if (p.status === 'failed') acc.failed += 1;
      return acc;
    },
    { total: 0, completedRevenue: 0, pending: 0, failed: 0 }
  );

  const formatAmount = (paisa: number) => {
    return `NPR ${(paisa / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
          <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
            Failed to load payments
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || 'An error occurred while fetching payments'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="bg-background dark:bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground dark:text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary dark:text-primary">
              .
            </span>
          </div>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
              Payments
            </h1>
            <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
              Manage organization subscriptions and payment history
            </p>
          </div>
          <Link href="/dashboard/payments/plans">
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Plans
            </Button>
          </Link>
        </div>
      </div>
      <div className="px-6 pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payments
              </CardTitle>
              <CreditCard className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Revenue
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(stats.completedRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No payments yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Date
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Org
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Amount
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Plan
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="text-muted-foreground py-4 text-sm">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-sm">
                            {p.organization?.name ??
                              p.organizationId.slice(0, 8)}
                          </td>
                          <td className="py-4 font-medium">
                            {formatAmount(p.amount)}
                          </td>
                          <td className="text-muted-foreground py-4 text-sm">
                            {p.subscription?.plan?.name ?? '-'}
                          </td>
                          <td className="py-4 text-sm capitalize">
                            {p.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-muted-foreground text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                        disabled={paymentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPaymentPage(p =>
                            Math.min(pagination.totalPages, p + 1)
                          )
                        }
                        disabled={paymentPage === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans Summary */}
        {typedPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {typedPlans.map(plan => (
                  <div key={plan.id} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-muted-foreground text-2xl font-bold">
                      {formatAmount(plan.price)}
                      <span className="text-sm font-normal">
                        /{plan.durationMonths} mo
                      </span>
                    </p>
                    {plan.features?.length > 0 && (
                      <ul className="text-muted-foreground mt-2 text-sm">
                        {plan.features
                          .slice(0, 3)
                          .map((feature: string, i: number) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
