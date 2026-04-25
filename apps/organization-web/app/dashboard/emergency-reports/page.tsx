'use client';

import { Skeleton } from '@repo/ui/skeleton';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame,
  MapPin,
  Phone,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import {
  IRecentEmergencyRequest,
  RequestStatus,
  ServiceCategory,
} from '@/types/auth.types';

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
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>(
    'completed'
  );

  const stats = [
    { label: 'TOTAL', value: analytics?.emergencyRequests.total ?? 0 },
    { label: 'THIS MONTH', value: analytics?.emergencyRequests.thisMonth ?? 0 },
    { label: 'RESOLVED', value: analytics?.emergencyRequests.completed ?? 0 },
    { label: 'PENDING', value: analytics?.emergencyRequests.pending ?? 0 },
  ];

  const allReports = useMemo(
    () => analytics?.emergencyRequests.recent ?? [],
    [analytics?.emergencyRequests.recent]
  );

  // Filter reports based on selected status
  const reports = useMemo(() => {
    if (selectedStatus === 'all') {
      return allReports;
    }
    return allReports.filter(report => report.requestStatus === selectedStatus);
  }, [allReports, selectedStatus]);

  const statusOptions: {
    value: RequestStatus | 'all';
    label: string;
    color: string;
  }[] = [
    {
      value: 'all',
      label: 'All Requests',
      color: 'bg-slate-100 dark:bg-slate-800',
    },
    { value: 'pending', label: 'Pending', color: 'bg-red-100 dark:bg-red-950' },
    {
      value: 'assigned',
      label: 'Assigned',
      color: 'bg-amber-100 dark:bg-amber-950',
    },
    {
      value: 'in_progress',
      label: 'In Progress',
      color: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      value: 'completed',
      label: 'Completed',
      color: 'bg-green-100 dark:bg-green-950',
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      color: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      value: 'no_providers_available',
      label: 'No Responders',
      color: 'bg-orange-100 dark:bg-orange-950',
    },
  ];

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
            {stats.map(stat => (
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
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-foreground">
              Recent Activity
            </h2>
            <div className="flex-1 h-px bg-foreground dark:bg-foreground opacity-20" />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 pb-4">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() =>
                  setSelectedStatus(option.value as RequestStatus | 'all')
                }
                className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-[0.12em] transition-all duration-200 border ${
                  selectedStatus === option.value
                    ? `${option.color} border-foreground dark:border-foreground border-opacity-50 dark:border-opacity-50 font-semibold`
                    : 'border-foreground dark:border-foreground border-opacity-20 dark:border-opacity-20 hover:border-opacity-40 dark:hover:border-opacity-40'
                }`}
              >
                {option.label}
              </button>
            ))}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report: IRecentEmergencyRequest) => (
                <div
                  key={report.id}
                  className="group relative p-5 border border-foreground dark:border-foreground border-opacity-20 dark:border-opacity-20 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 hover:border-opacity-40 dark:hover:border-opacity-40 hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden"
                >
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />

                  {/* Service Type Icon & Code */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center bg-red-100 dark:bg-red-950 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900 transition-colors">
                        {getServiceIcon(report.serviceType)}
                      </div>
                      <div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-600 dark:text-red-400 font-semibold">
                          {getServiceTypeCode(report.serviceType)}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground">
                          REQUEST
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`inline-flex items-center justify-center px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] rounded border ${
                        report.requestStatus === 'pending' ||
                        report.requestStatus === 'no_providers_available'
                          ? 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 dark:bg-opacity-40'
                          : report.requestStatus === 'completed'
                            ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 dark:bg-opacity-40'
                            : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 dark:bg-opacity-40'
                      }`}
                    >
                      {report.requestStatus.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-3">
                    <div className="flex items-start gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground mb-1">
                          Location
                        </div>
                        <div className="text-sm font-medium text-foreground dark:text-foreground line-clamp-2">
                          {report.location?.address ||
                            `${Number(report.location?.latitude).toFixed(4)}, ${Number(report.location?.longitude).toFixed(4)}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <div className="mb-4 pb-4 border-b border-foreground dark:border-foreground border-opacity-10 dark:border-opacity-10">
                      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground mb-1">
                        Description
                      </div>
                      <div className="text-xs text-foreground dark:text-foreground line-clamp-3">
                        {report.description}
                      </div>
                    </div>
                  )}

                  {/* Requester and Responder Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-foreground dark:border-foreground border-opacity-10 dark:border-opacity-10">
                    {/* Requester */}
                    {report.requester && (
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Requester
                        </div>
                        <div className="text-xs font-medium text-foreground dark:text-foreground mb-1">
                          {report.requester.name}
                        </div>
                        {report.requester.phoneNumber && (
                          <div className="text-[11px] text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {report.requester.phoneNumber}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Responder */}
                    {report.provider && (
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground mb-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Responder
                        </div>
                        <div className="text-xs font-medium text-foreground dark:text-foreground mb-1">
                          {report.provider.name}
                        </div>
                        {report.provider.phoneNumber && (
                          <div className="text-[11px] text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {report.provider.phoneNumber}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time Information */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground">
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: false,
                          }).toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                          AGO
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[9px] text-muted-foreground dark:text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </div>
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
