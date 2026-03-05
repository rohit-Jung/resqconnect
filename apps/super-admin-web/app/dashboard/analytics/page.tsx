'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  Loader2,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useDashboardAnalytics } from '@/services/super-admin/dashboard.api';
import { IDashboardEntity } from '@/types/auth.types';

const chartConfig = {
  orgs: {
    label: 'Organizations',
    color: 'hsl(221.2 83.2% 53.3%)',
  },
  users: {
    label: 'Users',
    color: 'hsl(142.1 76.2% 36.3%)',
  },
  providers: {
    label: 'Service Providers',
    color: 'hsl(262.1 83.3% 57.8%)',
  },
} satisfies ChartConfig;

const pieChartConfig = {
  total: {
    label: 'Total',
  },
  orgs: {
    label: 'Organizations',
    color: 'hsl(221.2 83.2% 53.3%)',
  },
  users: {
    label: 'Users',
    color: 'hsl(142.1 76.2% 36.3%)',
  },
  providers: {
    label: 'Service Providers',
    color: 'hsl(262.1 83.3% 57.8%)',
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { data, isLoading, isError, error } = useDashboardAnalytics();

  const analytics = data?.data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
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
            Failed to load analytics
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || 'An error occurred while fetching analytics'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate growth percentages
  const calculateGrowth = (thisMonth: number, lastMonth: number) => {
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  };

  const orgsGrowth = calculateGrowth(
    analytics?.orgs.thisMonth ?? 0,
    analytics?.orgs.lastMonth ?? 0
  );
  const usersGrowth = calculateGrowth(
    analytics?.users.thisMonth ?? 0,
    analytics?.users.lastMonth ?? 0
  );
  const providersGrowth = calculateGrowth(
    analytics?.providers.thisMonth ?? 0,
    analytics?.providers.lastMonth ?? 0
  );

  // Data for bar chart - Monthly comparison
  const monthlyComparisonData = [
    {
      category: 'Organizations',
      thisMonth: analytics?.orgs.thisMonth ?? 0,
      lastMonth: analytics?.orgs.lastMonth ?? 0,
    },
    {
      category: 'Users',
      thisMonth: analytics?.users.thisMonth ?? 0,
      lastMonth: analytics?.users.lastMonth ?? 0,
    },
    {
      category: 'Providers',
      thisMonth: analytics?.providers.thisMonth ?? 0,
      lastMonth: analytics?.providers.lastMonth ?? 0,
    },
  ];

  // Data for pie chart - Total distribution
  const distributionData = [
    {
      name: 'orgs',
      value: analytics?.orgs.total ?? 0,
      fill: 'hsl(221.2 83.2% 53.3%)',
    },
    {
      name: 'users',
      value: analytics?.users.total ?? 0,
      fill: 'hsl(142.1 76.2% 36.3%)',
    },
    {
      name: 'providers',
      value: analytics?.providers.total ?? 0,
      fill: 'hsl(262.1 83.3% 57.8%)',
    },
  ];

  // Stats cards data
  const stats = [
    {
      title: 'Organizations',
      total: analytics?.orgs.total ?? 0,
      thisMonth: analytics?.orgs.thisMonth ?? 0,
      lastMonth: analytics?.orgs.lastMonth ?? 0,
      growth: orgsGrowth,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Users',
      total: analytics?.users.total ?? 0,
      thisMonth: analytics?.users.thisMonth ?? 0,
      lastMonth: analytics?.users.lastMonth ?? 0,
      growth: usersGrowth,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Service Providers',
      total: analytics?.providers.total ?? 0,
      thisMonth: analytics?.providers.thisMonth ?? 0,
      lastMonth: analytics?.providers.lastMonth ?? 0,
      growth: providersGrowth,
      icon: Smartphone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
  ];

  const barChartConfig = {
    thisMonth: {
      label: 'This Month',
      color: 'hsl(221.2 83.2% 53.3%)',
    },
    lastMonth: {
      label: 'Last Month',
      color: 'hsl(215.4 16.3% 46.9%)',
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          System-wide analytics and growth metrics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">
                    {stat.total.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center text-sm font-medium ${
                        stat.growth >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {stat.growth >= 0 ? (
                        <ArrowUp className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(stat.growth)}%
                    </span>
                    <span className="text-muted-foreground text-sm">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={barChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart data={monthlyComparisonData} accessibilityLayer>
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="thisMonth"
                  fill="var(--color-thisMonth)"
                  radius={4}
                />
                <Bar
                  dataKey="lastMonth"
                  fill="var(--color-lastMonth)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Entity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={pieChartConfig}
              className="h-[300px] w-full"
            >
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-blue-600" />
              Recent Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(analytics?.orgs.info ?? []).length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No organizations yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics?.orgs.info
                  .slice(0, 5)
                  .map((org: IDashboardEntity, index: number) => (
                    <div
                      key={`${org.email}-${index}`}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {org.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {org.email}
                        </p>
                      </div>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-green-600" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(analytics?.users.info ?? []).length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No users yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics?.users.info
                  .slice(0, 5)
                  .map((user: IDashboardEntity, index: number) => (
                    <div
                      key={`${user.email}-${index}`}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </div>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Service Providers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-purple-600" />
              Recent Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(analytics?.providers.info ?? []).length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No providers yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics?.providers.info
                  .slice(0, 5)
                  .map((provider: IDashboardEntity, index: number) => (
                    <div
                      key={`${provider.email}-${index}`}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {provider.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {provider.email}
                        </p>
                      </div>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
