'use client';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  Loader2,
  MoreHorizontal,
  Search,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetAllPayments,
  useGetSubscriptionPlans,
} from '@/services/super-admin/payments.api';

const paymentStatusColors: Record<string, string> = {
  pending:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  completed:
    'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
};

const paymentStatusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  completed: CheckCircle,
  failed: XCircle,
  refunded: DollarSign,
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const {
    data: paymentsData,
    isLoading,
    isError,
    error,
  } = useGetAllPayments({
    page,
    limit: 10,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: plansData } = useGetSubscriptionPlans();

  const payments = paymentsData?.data?.payments ?? [];
  const pagination = paymentsData?.data?.pagination;
  const plans = plansData?.data ?? [];

  // Calculate stats
  const stats = {
    totalPayments: pagination?.total ?? 0,
    completedAmount: payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0),
    pendingCount: payments.filter((p: any) => p.status === 'pending').length,
    failedCount: payments.filter((p: any) => p.status === 'failed').length,
  };

  // Filter payments by search query
  const filteredPayments = payments.filter(
    (payment: any) =>
      payment.organization?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase())
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
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
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
                {formatAmount(stats.completedAmount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by organization or payment ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
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
            {filteredPayments.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {searchQuery
                  ? 'No payments match your search'
                  : 'No payments found'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Payment ID
                      </th>
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Organization
                      </th>
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Amount
                      </th>
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Status
                      </th>
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Method
                      </th>
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Date
                      </th>
                      <th className="text-muted-foreground pb-3 text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment: any) => {
                      const StatusIcon =
                        paymentStatusIcons[payment.status] || Clock;
                      return (
                        <tr key={payment.id} className="border-b last:border-0">
                          <td className="py-4 font-mono text-sm">
                            {payment.id.slice(0, 8)}...
                          </td>
                          <td className="py-4 font-medium">
                            {payment.organization?.name || 'Unknown'}
                          </td>
                          <td className="py-4">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                paymentStatusColors[payment.status] ||
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {payment.status.charAt(0).toUpperCase() +
                                payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="text-muted-foreground py-4 capitalize">
                            {payment.paymentMethod || 'khalti'}
                          </td>
                          <td className="text-muted-foreground py-4">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/payments/${payment.id}`}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-muted-foreground text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage(p => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans Summary */}
        {plans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan: any) => (
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
