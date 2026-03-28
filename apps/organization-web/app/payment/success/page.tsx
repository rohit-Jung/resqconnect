'use client';

import { CheckCircle, CreditCard, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetPaymentById } from '@/services/organization/payments.api';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');

  const {
    data: paymentData,
    isLoading,
    isError,
  } = useGetPaymentById(paymentId || '', !!paymentId);

  const payment = paymentData?.data?.data;

  const formatAmount = (paisa: number) => {
    return `NPR ${(paisa / 100).toFixed(2)}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-700 dark:text-green-400">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : isError || !payment ? (
            <p className="text-muted-foreground text-sm">
              Payment processed successfully. You can view details in your
              billing history.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="font-semibold">
                  {formatAmount(payment.amount)}
                </span>
              </div>
              {payment.subscription?.plan && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground text-sm">Plan</span>
                  <span className="font-semibold">
                    {payment.subscription.plan.name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground text-sm">
                  Transaction ID
                </span>
                <span className="font-mono text-xs">
                  {payment.khaltiTransactionId || payment.id.slice(0, 12)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-muted-foreground text-sm">Method</span>
                <span className="flex items-center gap-1 text-sm font-medium capitalize">
                  <CreditCard className="h-4 w-4" />
                  {payment.paymentMethod}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard/plans">
              <Button className="w-full">View Plans & Billing</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
