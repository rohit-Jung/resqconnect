'use client';

import {
  Activity,
  AlertTriangle,
  Building2,
  Loader2,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardAnalytics } from '@/services/super-admin/dashboard.api';

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isError, error } = useDashboardAnalytics();

  const analytics = data?.data?.data;

  // Build stats array from API data
  const stats = [
    {
      title: 'Total Organizations',
      value: analytics?.orgs.total.toLocaleString() ?? '-',
      change: `+${analytics?.orgs.thisMonth ?? 0} this month`,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Total Users',
      value: analytics?.users.total.toLocaleString() ?? '-',
      change: `+${analytics?.users.thisMonth ?? 0} this month`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Service Providers',
      value: analytics?.providers.total.toLocaleString() ?? '-',
      change: `+${analytics?.providers.thisMonth ?? 0} this month`,
      icon: Smartphone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      title: 'Active Emergencies',
      value: '-',
      change: 'Coming soon',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-950',
    },
    {
      title: 'Response Rate',
      value: '-',
      change: 'Coming soon',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: 'All systems operational',
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-950',
    },
  ];

  // Get recent organizations from API data
  const recentOrganizations = analytics?.orgs.info ?? [];

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
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
          <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message ||
              'An error occurred while fetching dashboard data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          System-wide statistics and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {stat.change}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrganizations.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No organizations found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Organization
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrganizations.map((org, index) => (
                    <tr
                      key={`${org.email}-${index}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-4 font-medium">{org.name}</td>
                      <td className="text-muted-foreground py-4">
                        {org.email}
                      </td>
                      <td className="text-muted-foreground py-4">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          {(analytics?.users.info ?? []).length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No users found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Name
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.users.info.map((user, index) => (
                    <tr
                      key={`${user.email}-${index}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-4 font-medium">{user.name}</td>
                      <td className="text-muted-foreground py-4">
                        {user.email}
                      </td>
                      <td className="text-muted-foreground py-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Service Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Service Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {(analytics?.providers.info ?? []).length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No service providers found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Name
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.providers.info.map((provider, index) => (
                    <tr
                      key={`${provider.email}-${index}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-4 font-medium">{provider.name}</td>
                      <td className="text-muted-foreground py-4">
                        {provider.email}
                      </td>
                      <td className="text-muted-foreground py-4">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
