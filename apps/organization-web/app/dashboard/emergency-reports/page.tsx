'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Clock,
  Flame,
  MapPin,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import { IRecentEmergencyRequest, ServiceCategory } from '@/types/auth.types';

function getServiceIcon(serviceType: ServiceCategory) {
  switch (serviceType) {
    case 'fire_truck':
      return <Flame className="h-5 w-5 text-black dark:text-white" />;
    case 'ambulance':
      return <Stethoscope className="h-5 w-5 text-black dark:text-white" />;
    case 'police':
      return <Shield className="h-5 w-5 text-black dark:text-white" />;
    case 'rescue_team':
      return <Users className="h-5 w-5 text-black dark:text-white" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-black dark:text-white" />;
  }
}

function getServiceTypeCode(serviceType: ServiceCategory): string {
  switch (serviceType) {
    case 'fire_truck':
      return 'FIR';
    case 'ambulance':
      return 'AMB';
    case 'police':
      return 'POL';
    case 'rescue_team':
      return 'RES';
    default:
      return 'EMR';
  }
}

export default function EmergencyReportsPage() {
  const { data: analyticsResponse, isLoading } = useOrgDashboardAnalytics();
  const analytics = analyticsResponse?.data?.data;

  const stats = [
    { label: 'TOTAL', value: analytics?.emergencyRequests.total ?? 0 },
    { label: 'THIS MONTH', value: analytics?.emergencyRequests.thisMonth ?? 0 },
    { label: 'RESOLVED', value: analytics?.emergencyRequests.completed ?? 0 },
    { label: 'PENDING', value: analytics?.emergencyRequests.pending ?? 0 },
  ];

  const reports = analytics?.emergencyRequests.recent ?? [];

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header — Swiss Style with Structural Annotation */}
      <div className="bg-background dark:bg-background px-8 pt-8">
        <div className="mb-8">
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-lg font-black tracking-tight text-foreground dark:text-foreground">
              RESQ
            </span>
            <span className="text-lg font-black text-red-600 dark:text-red-500">
              .
            </span>
          </div>
          <div className="mb-6">
            <h1 className="text-6xl font-black tracking-tight text-foreground dark:text-foreground leading-none mb-2">
              EMERGENCY
            </h1>
            <h1 className="text-6xl font-black tracking-tight text-foreground dark:text-foreground leading-none">
              REPORTS
            </h1>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-px flex-1 bg-red-600 dark:bg-red-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-muted-foreground whitespace-nowrap">
              NETWORK MONITORING
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="px-8 pb-12 space-y-12">
        {/* Stats Section — Extreme Size Contrast */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="border-l-2 border-foreground dark:border-foreground pl-4"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground dark:text-muted-foreground mb-3">
                  {stat.label}
                </div>
                <div className="text-7xl font-black leading-none text-foreground dark:text-foreground mb-2">
                  {stat.value.toLocaleString()}
                </div>
                <div className="h-px bg-foreground dark:bg-foreground opacity-20" />
              </div>
            ))}
          </div>
        )}

        {/* Recent Reports Section */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-foreground">
              Recent Activity
            </h2>
            <div className="flex-1 h-px bg-foreground dark:bg-foreground opacity-20" />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted dark:bg-muted rounded" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center">
              <AlertTriangle className="text-muted-foreground mx-auto mb-4 h-12 w-12 dark:text-muted-foreground opacity-40" />
              <p className="font-mono text-[12px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground">
                No Reports Found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: IRecentEmergencyRequest) => (
                <div
                  key={report.id}
                  className="grid grid-cols-12 gap-4 items-start p-4 border border-foreground dark:border-foreground opacity-20 hover:opacity-100 transition-opacity duration-150 bg-muted dark:bg-muted bg-opacity-30 dark:bg-opacity-30"
                >
                  {/* Service Type Code */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center bg-foreground dark:bg-foreground text-background dark:text-background">
                      {getServiceIcon(report.serviceType)}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="col-span-5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-muted-foreground mb-2">
                      {getServiceTypeCode(report.serviceType)}
                    </div>
                    <div className="text-sm font-medium text-foreground dark:text-foreground mb-2">
                      {report.location?.address ||
                        `${Number(report.location?.latitude).toFixed(4)}, ${Number(report.location?.longitude).toFixed(4)}`}
                    </div>
                    {report.description && (
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground line-clamp-2">
                        {report.description}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="col-span-3 text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground mb-1">
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: false,
                      }).toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                      AGO
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-3">
                    <div
                      className={`inline-flex items-center justify-center h-8 px-3 font-mono text-[10px] uppercase tracking-[0.12em] border-l-2 ${
                        report.requestStatus === 'pending' ||
                        report.requestStatus === 'no_providers_available'
                          ? 'border-l-red-600 dark:border-l-red-500 text-red-600 dark:text-red-500 bg-red-50 dark:bg-opacity-10'
                          : report.requestStatus === 'completed'
                            ? 'border-l-black dark:border-l-white text-foreground dark:text-foreground bg-muted dark:bg-muted'
                            : 'border-l-muted-foreground dark:border-l-muted-foreground text-muted-foreground dark:text-muted-foreground'
                      }`}
                    >
                      {report.requestStatus.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
