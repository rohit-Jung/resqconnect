'use client';

import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/chart';

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  Loader2,
  Smartphone,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { useDashboardAnalytics } from '@/services/super-admin/dashboard.api';
import { IDashboardEntity } from '@/types/auth.types';

type Period = 'weekly' | 'monthly';

const chartConfig = {
  Orgs: { label: 'Orgs', color: 'hsl(221.2 83.2% 53.3%)' },
  Users: { label: 'Users', color: 'hsl(142.1 76.2% 36.3%)' },
  Responders: { label: 'Responders', color: 'hsl(262.1 83.3% 57.8%)' },
} satisfies ChartConfig;

const weeklyChartConfig = {
  thisPeriod: { label: 'This Week', color: 'hsl(221.2 83.2% 53.3%)' },
  lastPeriod: { label: 'Last Week', color: 'hsl(215.4 16.3% 46.9%)' },
} satisfies ChartConfig;

const monthlyChartConfig = {
  thisPeriod: { label: 'This Month', color: 'hsl(221.2 83.2% 53.3%)' },
  lastPeriod: { label: 'Last Month', color: 'hsl(215.4 16.3% 46.9%)' },
} satisfies ChartConfig;

export default function SuperAdminDashboardPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const { data, isLoading, isError, error } = useDashboardAnalytics();
  const analytics = data?.data?.data;

  const isWeekly = period === 'weekly';

  const getCurrent = (
    stat: { thisMonth: number; thisWeek: number } | undefined
  ) => (isWeekly ? (stat?.thisWeek ?? 0) : (stat?.thisMonth ?? 0));
  const getPrevious = (
    stat: { lastMonth: number; lastWeek: number } | undefined
  ) => (isWeekly ? (stat?.lastWeek ?? 0) : (stat?.lastMonth ?? 0));

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const orgsGrowth = calculateGrowth(
    getCurrent(analytics?.orgs),
    getPrevious(analytics?.orgs)
  );
  const usersGrowth = calculateGrowth(
    getCurrent(analytics?.users),
    getPrevious(analytics?.users)
  );
  const providersGrowth = calculateGrowth(
    getCurrent(analytics?.providers),
    getPrevious(analytics?.providers)
  );

  const stats = [
    {
      title: 'Organizations',
      total: analytics?.orgs.total ?? 0,
      current: getCurrent(analytics?.orgs),
      growth: orgsGrowth,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Users',
      total: analytics?.users.total ?? 0,
      current: getCurrent(analytics?.users),
      growth: usersGrowth,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Responders',
      total: analytics?.providers.total ?? 0,
      current: getCurrent(analytics?.providers),
      growth: providersGrowth,
      icon: Smartphone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
  ];

  const barChartConfig = isWeekly ? weeklyChartConfig : monthlyChartConfig;

  const comparisonData = useMemo(
    () => [
      {
        category: 'Orgs',
        thisPeriod: getCurrent(analytics?.orgs),
        lastPeriod: getPrevious(analytics?.orgs),
      },
      {
        category: 'Users',
        thisPeriod: getCurrent(analytics?.users),
        lastPeriod: getPrevious(analytics?.users),
      },
      {
        category: 'Responders',
        thisPeriod: getCurrent(analytics?.providers),
        lastPeriod: getPrevious(analytics?.providers),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, period]
  );

  const distributionData = useMemo(
    () => [
      {
        name: 'Orgs',
        value: analytics?.orgs.total ?? 0,
        fill: 'hsl(221.2 83.2% 53.3%)',
      },
      {
        name: 'Users',
        value: analytics?.users.total ?? 0,
        fill: 'hsl(142.1 76.2% 36.3%)',
      },
      {
        name: 'Responders',
        value: analytics?.providers.total ?? 0,
        fill: 'hsl(262.1 83.3% 57.8%)',
      },
    ],
    [analytics]
  );

  const recentOrgs = analytics?.orgs.info ?? [];
  const recentUsers = analytics?.users.info ?? [];
  const recentProviders = analytics?.providers.info ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
          <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || 'An error occurred'}
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
        <div className="mt-4 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
              System-wide statistics and analytics
            </p>
          </div>
          <div className="flex items-center gap-1 border border-border">
            <Button
              variant={isWeekly ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={!isWeekly ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>
      </div>
      <div className="px-6 pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {stat.title}
                  </span>
                  <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {stat.total.toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <span
                    className={`flex items-center text-xs font-medium ${stat.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {stat.growth >= 0 ? (
                      <ArrowUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <ArrowDown className="mr-0.5 h-3 w-3" />
                    )}
                    {Math.abs(stat.growth)}%
                  </span>
                  <span className="text-muted-foreground text-xs">
                    vs {isWeekly ? 'last week' : 'last month'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* System Health */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  SYSTEM HEALTH
                </span>
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold tracking-tight">99.9%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold">
                {isWeekly ? 'Weekly Comparison' : 'Monthly Comparison'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer
                config={barChartConfig}
                className="h-[300px] w-full"
                style={{ overflow: 'visible' }}
              >
                <BarChart data={comparisonData}>
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
                    dataKey="thisPeriod"
                    fill="var(--color-thisPeriod)"
                    radius={4}
                  />
                  <Bar
                    dataKey="lastPeriod"
                    fill="var(--color-lastPeriod)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold">
                Entity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-visible">
              <ChartContainer
                config={chartConfig}
                className="h-[300px] w-full"
                style={{ overflow: 'visible' }}
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                  />
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
                    {distributionData.map(entry => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tables */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Recent Organizations',
              data: recentOrgs,
              icon: Building2,
              iconColor: 'text-blue-600',
            },
            {
              title: 'Recent Users',
              data: recentUsers,
              icon: Users,
              iconColor: 'text-green-600',
            },
            {
              title: 'Recent Responders',
              data: recentProviders,
              icon: Smartphone,
              iconColor: 'text-purple-600',
            },
          ].map(section => (
            <Card key={section.title}>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <section.icon className={`h-4 w-4 ${section.iconColor}`} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {section.data.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {section.data
                      .slice(0, 5)
                      .map((item: IDashboardEntity, index: number) => (
                        <div
                          key={`${item.email}-${index}`}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {item.email}
                            </p>
                          </div>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
