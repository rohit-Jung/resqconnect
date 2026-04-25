'use client';

import { Loader2 } from 'lucide-react';

import { DashboardAlerts } from '@/components/dashboard-alerts';
import { DashboardCharts } from '@/components/dashboard-charts';
import { DashboardStats } from '@/components/dashboard-stats';
import { DashboardTeams } from '@/components/dashboard-teams';
import { useOrgProfile } from '@/services/organization/auth.api';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';

export default function DashboardPage() {
  const { data: analyticsResponse, isLoading } = useOrgDashboardAnalytics();
  const { data: profileResponse } = useOrgProfile();
  const analytics = analyticsResponse?.data?.data;
  const profileData = profileResponse?.data?.data;
  const entitlements = profileData?.entitlements;
  const analyticsEnabled = entitlements?.analytics_enabled ?? true;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin dark:text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Swiss Style Header */}
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
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Overview of your organization activity
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        <DashboardStats data={analytics} isLoading={isLoading} />
        <div className={analyticsEnabled ? '' : 'blur-sm select-none'}>
          <DashboardCharts
            emergencyRequests={analytics?.emergencyRequests}
            isLoading={isLoading}
          />
        </div>
        {!analyticsEnabled && (
          <p className="text-center text-sm text-muted-foreground">
            Analytics are disabled for your organization. Contact super admin to
            enable.
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <DashboardAlerts
            emergencyRequests={analytics?.emergencyRequests?.recent}
            isLoading={isLoading}
          />
          <DashboardTeams
            responders={analytics?.providers?.recent}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
