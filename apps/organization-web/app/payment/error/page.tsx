'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Payment could not be processed';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-700 dark:text-red-400">
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">{error}</p>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard/plans">
              <Button className="w-full">Try Again</Button>
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

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <AlertTriangle className="text-muted-foreground h-8 w-8" />
        </div>
      }
    >
      <PaymentErrorContent />
    </Suspense>
  );
}
