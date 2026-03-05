'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Car,
  Clock,
  Flame,
  MapPin,
  Shield,
  Stethoscope,
  Users,
  Zap,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import {
  IRecentEmergencyRequest,
  RequestStatus,
  ServiceCategory,
} from '@/types/auth.types';

// Get icon based on service type
function getServiceIcon(serviceType: ServiceCategory) {
  switch (serviceType) {
    case 'fire_truck':
      return <Flame className="h-6 w-6 text-orange-500" />;
    case 'ambulance':
      return <Stethoscope className="h-6 w-6 text-red-500" />;
    case 'police':
      return <Shield className="h-6 w-6 text-blue-500" />;
    case 'rescue_team':
      return <Users className="h-6 w-6 text-green-500" />;
    default:
      return <AlertTriangle className="h-6 w-6 text-gray-500" />;
  }
}

// Get severity based on request status
function getSeverityFromStatus(
  status: RequestStatus
): 'Critical' | 'High' | 'Medium' | 'Low' {
  switch (status) {
    case 'pending':
    case 'no_providers_available':
      return 'Critical';
    case 'accepted':
    case 'assigned':
    case 'in_progress':
      return 'High';
    case 'completed':
      return 'Low';
    case 'rejected':
    case 'cancelled':
      return 'Medium';
    default:
      return 'Medium';
  }
}

// Get human-readable service type name
function getServiceTypeName(serviceType: ServiceCategory): string {
  switch (serviceType) {
    case 'fire_truck':
      return 'Fire Emergency';
    case 'ambulance':
      return 'Ambulance Request';
    case 'police':
      return 'Police Request';
    case 'rescue_team':
      return 'Rescue Operation';
    default:
      return 'Emergency Request';
  }
}

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {[...Array(4)].map((_, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Reports list skeleton
function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between border-b pb-4 last:border-0"
        >
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-6 w-16 ml-auto rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmergencyReportsPage() {
  const { data: analyticsResponse, isLoading } = useOrgDashboardAnalytics();
  const analytics = analyticsResponse?.data?.data;

  const stats = [
    {
      label: 'Total Reports',
      value: analytics?.emergencyRequests.total ?? 0,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'This Month',
      value: analytics?.emergencyRequests.thisMonth ?? 0,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      label: 'Resolved',
      value: analytics?.emergencyRequests.completed ?? 0,
      color: 'bg-green-100 text-green-800',
    },
    {
      label: 'Pending',
      value: analytics?.emergencyRequests.pending ?? 0,
      color: 'bg-red-100 text-red-800',
    },
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

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {stat.value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Emergency Reports</CardTitle>
          <CardDescription>Latest emergency incidents reported</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ReportsSkeleton />
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No emergency reports found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report: IRecentEmergencyRequest) => {
                const severity = getSeverityFromStatus(report.requestStatus);
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getServiceIcon(report.serviceType)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getServiceTypeName(report.serviceType)}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4" />
                          {report.location?.address ||
                            `${report.location?.latitude}, ${report.location?.longitude}`}
                        </p>
                        {report.description && (
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground flex items-center justify-end gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <span
                        className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          severity === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : severity === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : severity === 'Low'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {report.requestStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
