'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

import { AlertTriangle, Info, Loader2, UserCog } from 'lucide-react';

import { useDashboardAnalytics } from '@/services/super-admin/dashboard.api';

export default function ServiceProvidersPage() {
  const { data, isLoading, isError, error } = useDashboardAnalytics();

  const analytics = data?.data?.data;
  const totalProviders = analytics?.providers?.total ?? 0;
  const thisMonthProviders = analytics?.providers?.thisMonth ?? 0;
  const lastMonthProviders = analytics?.providers?.lastMonth ?? 0;

  // Calculate growth percentage
  const growthPercentage =
    lastMonthProviders > 0
      ? Math.round(
          ((thisMonthProviders - lastMonthProviders) / lastMonthProviders) * 100
        )
      : thisMonthProviders > 0
        ? 100
        : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading responders...</p>
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
            Failed to load responders
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || 'An error occurred while fetching responders'}
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
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Responders
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Manage all responders across organizations ({totalProviders} total)
          </p>
        </div>
      </div>
      <div className="px-6 pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  TOTAL PROVIDERS
                </span>
                <UserCog className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {totalProviders}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                All registered responders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  THIS MONTH
                </span>
                <UserCog className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {thisMonthProviders}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                New responders this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  GROWTH
                </span>
                <UserCog className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p
                className={`text-3xl font-bold tracking-tight ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {growthPercentage >= 0 ? '+' : ''}
                {growthPercentage}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs last month ({lastMonthProviders} responders)
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Info className="h-4 w-4 text-muted-foreground" />
              Why individual responder details are not shown here
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Resqconnect uses a{' '}
                <span className="font-semibold text-foreground">
                  silo architecture
                </span>{' '}
                where each organization&apos;s operational data (including
                responder profiles, credentials, documents, and location data)
                lives exclusively inside that organization&apos;s silo backend.
                The control plane (this interface) is a lightweight registry
                that coordinates provisioning; it deliberately does{' '}
                <span className="font-semibold text-foreground">not</span>{' '}
                replicate or store PII from any silo.
              </p>
              <p>
                This is by design: silo isolation means a breach of the control
                plane cannot expose responder PII from any organization. Each
                silo enforces its own authentication boundary; the control plane
                can only reach a silo via a shared internal API key for
                aggregate metrics collection, not for individual record access.
              </p>
              <p>
                The aggregate counts shown above (total, this month, growth)
                come from periodic silo metrics snapshots ingested by the
                control plane. Individual responder records (name, contact,
                service status, documents) remain inside each silo and are only
                accessible through that organization&apos;s own portal.
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                To view or manage individual responders, log in to the relevant
                organization&apos;s portal and navigate to{' '}
                <span className="font-mono font-medium">
                  Team &rarr; Service Providers
                </span>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
