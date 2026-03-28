'use client';

import { DashboardAlerts } from '@/components/dashboard-alerts';
import { DashboardCharts } from '@/components/dashboard-charts';
import { DashboardStats } from '@/components/dashboard-stats';
import { DashboardTeams } from '@/components/dashboard-teams';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';

export default function DashboardPage() {
  const { data: analyticsResponse, isLoading } = useOrgDashboardAnalytics();
  const analytics = analyticsResponse?.data?.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your organization activity
        </p>
      </div>
      <DashboardStats data={analytics} isLoading={isLoading} />
      <DashboardCharts
        emergencyRequests={analytics?.emergencyRequests}
        isLoading={isLoading}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardAlerts
          emergencyRequests={analytics?.emergencyRequests?.recent}
          isLoading={isLoading}
        />
        <DashboardTeams
          providers={analytics?.providers?.recent}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
