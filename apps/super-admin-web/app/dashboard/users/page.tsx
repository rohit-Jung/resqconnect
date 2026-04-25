'use client';

import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

import { AlertTriangle, Loader2, Users } from 'lucide-react';

import { useDashboardAnalytics } from '@/services/super-admin/dashboard.api';

export default function UsersPage() {
  const { data, isLoading, isError, error } = useDashboardAnalytics();

  const analytics = data?.data?.data;
  const totalUsers = analytics?.users?.total ?? 0;
  const thisMonthUsers = analytics?.users?.thisMonth ?? 0;
  const lastMonthUsers = analytics?.users?.lastMonth ?? 0;

  const growthPercentage =
    lastMonthUsers > 0
      ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : thisMonthUsers > 0
        ? 100
        : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-md rounded-xl border border-primary bg-card p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold text-foreground">
            Failed to load users
          </h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'An error occurred while fetching users'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary">.</span>
          </div>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered users ({totalUsers} total)
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  TOTAL USERS
                </span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {totalUsers}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                All registered users
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  THIS MONTH
                </span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {thisMonthUsers}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                New users this month
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  GROWTH
                </span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p
                className={`text-3xl font-bold tracking-tight ${growthPercentage >= 0 ? 'text-green-600 dark:text-green-500' : 'text-primary'}`}
              >
                {growthPercentage >= 0 ? '+' : ''}
                {growthPercentage}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs last month ({lastMonthUsers} users)
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              User Listing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground py-6 text-sm">
              The control plane currently only ingests aggregate user counts
              (via silo metrics). Detailed user lists are not replicated.
            </p>
            <Button variant="outline" disabled>
              Export Users (not implemented)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
