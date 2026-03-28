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
import {
  IRecentEmergencyRequest,
  RequestStatus,
  ServiceCategory,
} from '@/types/auth.types';

function getServiceIcon(serviceType: ServiceCategory) {
  switch (serviceType) {
    case 'fire_truck':
      return <Flame className="h-4 w-4 text-orange-500" />;
    case 'ambulance':
      return <Stethoscope className="h-4 w-4 text-red-500" />;
    case 'police':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'rescue_team':
      return <Users className="h-4 w-4 text-green-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

function getServiceTypeName(serviceType: ServiceCategory): string {
  switch (serviceType) {
    case 'fire_truck':
      return 'Fire Emergency';
    case 'ambulance':
      return 'Ambulance';
    case 'police':
      return 'Police';
    case 'rescue_team':
      return 'Rescue';
    default:
      return 'Emergency';
  }
}

export default function EmergencyReportsPage() {
  const { data: analyticsResponse, isLoading } = useOrgDashboardAnalytics();
  const analytics = analyticsResponse?.data?.data;

  const stats = [
    { label: 'TOTAL REPORTS', value: analytics?.emergencyRequests.total ?? 0 },
    { label: 'THIS MONTH', value: analytics?.emergencyRequests.thisMonth ?? 0 },
    { label: 'RESOLVED', value: analytics?.emergencyRequests.completed ?? 0 },
    { label: 'PENDING', value: analytics?.emergencyRequests.pending ?? 0 },
  ];

  const reports = analytics?.emergencyRequests.recent ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emergency Reports</h1>
        <p className="text-muted-foreground mt-2">
          View and manage emergency reports from your network
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {stat.label}
                </span>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {stat.value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Reports */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Emergency Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-8 w-8" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="font-medium">No emergency reports found</p>
            </div>
          ) : (
            <div>
              {reports.map((report: IRecentEmergencyRequest) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 border-b border-border p-4 last:border-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-muted/50">
                    {getServiceIcon(report.serviceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {getServiceTypeName(report.serviceType)}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1 text-sm truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {report.location?.address ||
                        `${report.location?.latitude}, ${report.location?.longitude}`}
                    </p>
                    {report.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs truncate">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center font-mono text-[9px] uppercase tracking-[0.1em] ${
                        report.requestStatus === 'pending' ||
                        report.requestStatus === 'no_providers_available'
                          ? 'text-red-600 dark:text-red-400'
                          : report.requestStatus === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {report.requestStatus.replace(/_/g, ' ')}
                    </span>
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
