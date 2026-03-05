'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';

// Calculate percentage change
function calculateChange(
  current: number,
  previous: number
): { value: string; isPositive: boolean | null } {
  if (previous === 0) {
    if (current > 0) return { value: '+100%', isPositive: true };
    return { value: '0%', isPositive: null };
  }
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0 ? true : change < 0 ? false : null;
  const prefix = change > 0 ? '+' : '';
  return { value: `${prefix}${change.toFixed(1)}%`, isPositive };
}

// Metrics skeleton
function MetricsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {[...Array(4)].map((_, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Performance skeleton
function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, idx) => (
        <div key={idx}>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: analyticsResponse, isLoading } = useOrgDashboardAnalytics();
  const analytics = analyticsResponse?.data?.data;

  // Calculate metrics from real data
  const totalResponses = analytics?.emergencyResponses.total ?? 0;
  const responsesThisMonth = analytics?.emergencyResponses.thisMonth ?? 0;
  const responsesLastMonth = analytics?.emergencyResponses.lastMonth ?? 0;
  const responsesChange = calculateChange(
    responsesThisMonth,
    responsesLastMonth
  );

  const totalRequests = analytics?.emergencyRequests.total ?? 0;
  const completedRequests = analytics?.emergencyRequests.completed ?? 0;
  const successRate =
    totalRequests > 0
      ? ((completedRequests / totalRequests) * 100).toFixed(1)
      : '0.0';

  const totalProviders = analytics?.providers.total ?? 0;
  const providersThisMonth = analytics?.providers.thisMonth ?? 0;
  const providersLastMonth = analytics?.providers.lastMonth ?? 0;
  const providersChange = calculateChange(
    providersThisMonth,
    providersLastMonth
  );

  const requestsThisMonth = analytics?.emergencyRequests.thisMonth ?? 0;
  const pendingRequests = analytics?.emergencyRequests.pending ?? 0;

  const metrics = [
    {
      label: 'Total Responses',
      value: totalResponses.toLocaleString(),
      change: responsesChange.value,
      isPositive: responsesChange.isPositive,
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      change: completedRequests > 0 ? 'Completed' : 'No data',
      isPositive: completedRequests > 0 ? true : null,
    },
    {
      label: 'Total Providers',
      value: totalProviders.toLocaleString(),
      change: providersChange.value,
      isPositive: providersChange.isPositive,
    },
    {
      label: 'Requests This Month',
      value: requestsThisMonth.toLocaleString(),
      change: `${pendingRequests} pending`,
      isPositive:
        pendingRequests === 0 ? true : pendingRequests < 5 ? null : false,
    },
  ];

  // Calculate performance metrics
  const teamAvailability = analytics?.providers.availabilityPercentage ?? 0;
  const responseRate =
    totalRequests > 0 ? (totalResponses / totalRequests) * 100 : 0;
  const completionRate =
    totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
  const providerUtilization =
    totalProviders > 0
      ? ((totalProviders - (analytics?.providers.available ?? 0)) /
          totalProviders) *
        100
      : 0;

  const performance = [
    {
      metric: 'Response Rate',
      percentage: Math.min(responseRate, 100),
      description: 'Responses per request',
    },
    {
      metric: 'Completion Rate',
      percentage: Math.min(completionRate, 100),
      description: 'Successfully completed requests',
    },
    {
      metric: 'Team Availability',
      percentage: teamAvailability,
      description: 'Available service providers',
    },
    {
      metric: 'Provider Utilization',
      percentage: Math.min(providerUtilization, 100),
      description: 'Providers currently assigned',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed analytics and performance metrics
        </p>
      </div>

      {isLoading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {metrics.map(metric => (
            <Card key={metric.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p
                    className={`text-xs font-medium flex items-center gap-1 ${
                      metric.isPositive === true
                        ? 'text-green-600'
                        : metric.isPositive === false
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {metric.isPositive === true ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : metric.isPositive === false ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {metric.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Key performance indicators based on your organization data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PerformanceSkeleton />
          ) : (
            <div className="space-y-6">
              {performance.map(item => (
                <div key={item.metric}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.metric}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <p className="text-primary text-sm font-bold">
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-secondary h-2 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.percentage >= 80
                          ? 'bg-green-500'
                          : item.percentage >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
