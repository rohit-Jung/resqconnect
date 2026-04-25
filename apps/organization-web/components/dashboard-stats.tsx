'use client';

import { Card, CardContent } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';

import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react';

import { IOrgDashboardAnalytics } from '@/types/auth.types';

interface DashboardStatsProps {
  data?: IOrgDashboardAnalytics;
  isLoading?: boolean;
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ data, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const providersChange =
    data?.providers.lastMonth && data.providers.lastMonth > 0
      ? Math.round(
          ((data.providers.thisMonth - data.providers.lastMonth) /
            data.providers.lastMonth) *
            100
        )
      : data?.providers.thisMonth
        ? 100
        : 0;

  const responsesChange =
    data?.emergencyResponses.lastMonth && data.emergencyResponses.lastMonth > 0
      ? Math.round(
          ((data.emergencyResponses.thisMonth -
            data.emergencyResponses.lastMonth) /
            data.emergencyResponses.lastMonth) *
            100
        )
      : data?.emergencyResponses.thisMonth
        ? 100
        : 0;

  const stats = [
    {
      label: 'SERVICE PROVIDERS',
      value: data?.providers.total.toString() ?? '0',
      trend: `${providersChange >= 0 ? '+' : ''}${providersChange}%`,
      trendUp: providersChange >= 0,
      detail: 'vs last month',
      icon: Users,
    },
    {
      label: 'EMERGENCY REQUESTS',
      value: data?.emergencyRequests.total.toString() ?? '0',
      trend: `${data?.emergencyRequests.pending ?? 0}`,
      trendUp: (data?.emergencyRequests.pending ?? 0) === 0,
      detail: 'pending',
      icon: AlertTriangle,
    },
    {
      label: 'ACTIVE PROVIDERS',
      value: data?.providers.available.toString() ?? '0',
      trend: `${data?.providers.availabilityPercentage ?? 0}%`,
      trendUp: true,
      detail: 'availability',
      icon: TrendingUp,
    },
    {
      label: 'EMERGENCY RESPONSES',
      value: data?.emergencyResponses.total.toString() ?? '0',
      trend: `${responsesChange >= 0 ? '+' : ''}${responsesChange}%`,
      trendUp: responsesChange >= 0,
      detail: 'vs last month',
      icon: Clock,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <Card key={stat.label} className="overflow-hidden">
          <CardContent className="">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {stat.value}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-medium tracking-tight ${
                  stat.trendUp
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-primary'
                }`}
              >
                {stat.trend}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {stat.detail}
              </span>
            </div>
            {/* Signal red accent bar on active stat */}
            {stat.label === 'EMERGENCY REQUESTS' &&
              (data?.emergencyRequests.pending ?? 0) > 0 && (
                <div className="mt-3 h-[2px] w-8 bg-primary" />
              )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
