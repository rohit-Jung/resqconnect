'use client';

import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IOrgDashboardAnalytics } from '@/types/auth.types';

interface DashboardStatsProps {
  data?: IOrgDashboardAnalytics;
  isLoading?: boolean;
}

export function DashboardStats({ data, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate percentage changes
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
      title: 'Service Providers',
      value: data?.providers.total.toString() ?? '0',
      change: `${providersChange >= 0 ? '+' : ''}${providersChange}% vs last month`,
      changeType:
        providersChange >= 0 ? ('positive' as const) : ('neutral' as const),
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Emergency Requests',
      value: data?.emergencyRequests.total.toString() ?? '0',
      change: `${data?.emergencyRequests.pending ?? 0} pending`,
      changeType:
        (data?.emergencyRequests.pending ?? 0) > 0
          ? ('warning' as const)
          : ('positive' as const),
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: 'Active Providers',
      value: data?.providers.available.toString() ?? '0',
      change: `${data?.providers.availabilityPercentage ?? 0}% availability`,
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Emergency Responses',
      value: data?.emergencyResponses.total.toString() ?? '0',
      change: `${responsesChange >= 0 ? '+' : ''}${responsesChange}% vs last month`,
      changeType:
        responsesChange >= 0 ? ('positive' as const) : ('neutral' as const),
      icon: Clock,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p
                  className={`mt-2 text-sm ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'warning'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
