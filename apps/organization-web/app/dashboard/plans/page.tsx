'use client';

import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  Loader2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetActiveSubscription,
  useGetPaymentHistory,
  useGetSubscriptionPlans,
  useSubscribeToPlan,
} from '@/services/organization/payments.api';

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
  refunded: CreditCard,
};

const planIcons: Record<number, React.ElementType> = {
  0: Zap,
  1: Crown,
  2: CreditCard,
};

export default function PlansPage() {
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(
    null
  );
  const [paymentPage, setPaymentPage] = useState(1);

  const {
    data: plansData,
    isLoading: plansLoading,
    isError: plansError,
  } = useGetSubscriptionPlans();
  const { data: subscriptionData, isLoading: subscriptionLoading } =
    useGetActiveSubscription();
  const { data: historyData, isLoading: historyLoading } = useGetPaymentHistory(
    { page: paymentPage, limit: 5 }
  );
  const subscribeMutation = useSubscribeToPlan();

  const plans = plansData?.data?.data ?? [];
  const activeSubscription = subscriptionData?.data?.data ?? null;
  const history = historyData?.data?.data;
  const payments = history?.payments ?? [];
  const pagination = history?.pagination;

  const formatAmount = (paisa: number) => {
    return `NPR ${(paisa / 100).toFixed(2)}`;
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribingPlanId(planId);
    try {
      const response = await subscribeMutation.mutateAsync({
        planId,
      });
      const { paymentUrl } = response.data.data;
      window.location.href = paymentUrl;
    } catch {
      setSubscribingPlanId(null);
    }
  };

  const isPlanActive = (planId: string) => {
    return activeSubscription?.planId === planId;
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin dark:text-primary" />
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="max-w-md bg-card dark:bg-card rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
          <h3 className="mb-2 font-semibold text-foreground dark:text-foreground">
            Failed to load plans
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            An error occurred while fetching subscription plans
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Swiss Style Header */}
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
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Plans & Billing
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Manage your subscription and view payment history
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Active Subscription */}
        {subscriptionLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ) : activeSubscription ? (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="text-primary h-5 w-5" />
                Active Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {activeSubscription.plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {formatAmount(activeSubscription.plan.price)} /{' '}
                    {activeSubscription.plan.durationMonths} month
                    {activeSubscription.plan.durationMonths > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">
                      Days Remaining
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {activeSubscription.daysRemaining}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Expires On</p>
                    <p className="text-sm font-medium">
                      {new Date(
                        activeSubscription.endDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {activeSubscription.plan.features?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeSubscription.plan.features.map((feature, i) => (
                    <span
                      key={i}
                      className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      <Check className="h-3 w-3" />
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  No Active Subscription
                </h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Subscribe to a plan below to access all features
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CreditCard className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 font-semibold">No Plans Available</h3>
                <p className="text-muted-foreground text-sm">
                  Subscription plans will appear here once created by the admin
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, index) => {
                const PlanIcon = planIcons[index % 3] || CreditCard;
                const isActive = isPlanActive(plan.id);
                const isSubscribing = subscribingPlanId === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all ${
                      isActive
                        ? 'border-primary shadow-lg ring-2 ring-primary/20'
                        : 'hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    {isActive && (
                      <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-xs font-medium">
                        Current Plan
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                          <PlanIcon className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {plan.durationMonths} month
                            {plan.durationMonths > 1 ? 's' : ''} duration
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-3xl font-bold">
                          {formatAmount(plan.price)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          /{plan.durationMonths} mo
                        </span>
                      </div>

                      {plan.features?.length > 0 && (
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 shrink-0 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button
                        className="w-full"
                        disabled={
                          isActive ||
                          isSubscribing ||
                          !!activeSubscription ||
                          subscribeMutation.isPending
                        }
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {isSubscribing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isActive ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Current Plan
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Subscribe via Khalti
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No payment history yet
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
                          Amount
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Plan
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Status
                        </th>
                        <th className="text-muted-foreground pb-3 text-sm font-medium">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => {
                        const StatusIcon =
                          paymentStatusIcons[payment.status] || Clock;
                        return (
                          <tr
                            key={payment.id}
                            className="border-b last:border-0"
                          >
                            <td className="text-muted-foreground py-4 text-sm">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 font-medium">
                              {formatAmount(payment.amount)}
                            </td>
                            <td className="text-muted-foreground py-4 text-sm">
                              {payment.subscription?.plan?.name ?? '-'}
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
                            <td className="text-muted-foreground py-4 text-sm capitalize">
                              {payment.paymentMethod}
                            </td>
                          </tr>
                        );
                      })}
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
      </div>
    </div>
  );
}
