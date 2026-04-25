'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';

import {
  Activity,
  Flame,
  Loader2,
  MapPin,
  Navigation,
  Shield,
  Stethoscope,
  Truck,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import {
  IServiceProvider,
  useOrgServiceProviders,
} from '@/services/organization/providers.api';
import { ServiceStatus, ServiceType } from '@/types/auth.types';

const ProviderMap = dynamic(() => import('@/components/provider-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full" />,
});

function getServiceTypeIcon(serviceType: ServiceType) {
  switch (serviceType) {
    case 'ambulance':
      return <Stethoscope className="h-4 w-4" />;
    case 'police':
      return <Shield className="h-4 w-4" />;
    case 'fire_truck':
      return <Flame className="h-4 w-4" />;
    case 'rescue_team':
      return <Users className="h-4 w-4" />;
    default:
      return <Truck className="h-4 w-4" />;
  }
}

function getStatusInfo(status: ServiceStatus): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'available':
      return {
        label: 'Available',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'assigned':
      return {
        label: 'On Duty',
        color: 'text-orange-600 dark:text-orange-400',
      };
    case 'off_duty':
      return { label: 'Off Duty', color: 'text-[#888888] dark:text-gray-400' };
    default:
      return { label: status, color: 'text-[#888888] dark:text-gray-400' };
  }
}

function getServiceTypeName(serviceType: ServiceType): string {
  switch (serviceType) {
    case 'ambulance':
      return 'Ambulance';
    case 'police':
      return 'Police';
    case 'fire_truck':
      return 'Fire Truck';
    case 'rescue_team':
      return 'Rescue Team';
    default:
      return serviceType;
  }
}

export default function LiveTrackingPage() {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );
  const { data: providersResponse, isLoading: providersLoading } =
    useOrgServiceProviders();
  const { data: analyticsResponse, isLoading: analyticsLoading } =
    useOrgDashboardAnalytics();

  const responders = providersResponse?.data?.data ?? [];
  const analytics = analyticsResponse?.data?.data;
  const isLoading = providersLoading || analyticsLoading;

  const totalProviders = responders.length;
  const activeProviders = responders.filter(
    p => p.serviceStatus !== 'off_duty'
  ).length;
  const availableProviders = responders.filter(
    p => p.serviceStatus === 'available'
  ).length;
  const assignedProviders = responders.filter(
    p => p.serviceStatus === 'assigned'
  ).length;
  const activeUnits = responders.filter(p => p.serviceStatus !== 'off_duty');

  const stats = [
    {
      label: 'TOTAL PROVIDERS',
      value: totalProviders,
      detail: `${analytics?.providers.thisMonth ?? 0} added this month`,
    },
    {
      label: 'ACTIVE UNITS',
      value: activeProviders,
      detail: `${assignedProviders} currently assigned`,
    },
    {
      label: 'AVAILABLE NOW',
      value: availableProviders,
      detail: `${analytics?.providers.availabilityPercentage?.toFixed(1) ?? 0}% availability`,
    },
  ];

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
            Live Tracking
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Monitor real-time locations of emergency response teams
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(stat => (
            <Card key={stat.label} className="bg-card dark:bg-card">
              <CardContent className="p-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground">
                  {stat.label}
                </span>
                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map */}
        <Card className="bg-card dark:bg-card">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              Responder Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProviderMap
              responders={responders}
              selectedProviderId={selectedProviderId}
              onSelectProvider={setSelectedProviderId}
            />
          </CardContent>
        </Card>

        {/* Active Units List */}
        <Card className="bg-card dark:bg-card">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              Active Response Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Navigation className="text-muted-foreground mb-4 h-10 w-10 dark:text-muted-foreground" />
                <p className="font-medium text-foreground dark:text-foreground">
                  No active response teams
                </p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                  All responders are currently off duty
                </p>
              </div>
            ) : (
              <div>
                {activeUnits.map((responder: IServiceProvider) => {
                  const statusInfo = getStatusInfo(responder.serviceStatus);
                  const hasLocation =
                    responder.currentLocation?.latitude &&
                    responder.currentLocation?.longitude;
                  const isSelected = selectedProviderId === responder.id;

                  return (
                    <div
                      key={responder.id}
                      onClick={() =>
                        setSelectedProviderId(isSelected ? null : responder.id)
                      }
                      className={`flex cursor-pointer items-center gap-4 border-b border-border p-4 transition-colors last:border-0 ${
                        isSelected
                          ? 'bg-primary/5 dark:bg-primary/10'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                          responder.serviceStatus === 'available'
                            ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                            : responder.serviceStatus === 'assigned'
                              ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400'
                              : 'border-border bg-muted text-muted-foreground dark:text-muted-foreground'
                        }`}
                      >
                        {getServiceTypeIcon(responder.serviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-foreground dark:text-foreground">
                          {responder.name}
                        </p>
                        <p className="text-muted-foreground dark:text-muted-foreground flex items-center gap-1 text-sm truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {responder.serviceArea || responder.primaryAddress}
                        </p>
                        {responder.vehicleInformation &&
                          responder.vehicleInformation.number !==
                            'Not filled' && (
                            <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">
                              {responder.vehicleInformation.type} —{' '}
                              {responder.vehicleInformation.number}
                            </p>
                          )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground dark:text-muted-foreground">
                          {getServiceTypeName(responder.serviceType)}
                        </span>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          {hasLocation ? (
                            <span className="flex items-center gap-1 text-xs text-primary dark:text-primary">
                              <Navigation className="h-3 w-3" />
                              Tracked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground">
                              <Navigation className="h-3 w-3" />
                              No data
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-1 flex items-center justify-end gap-1 text-xs font-medium ${statusInfo.color}`}
                        >
                          <Activity className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Responders */}
        {responders.length > 0 && (
          <Card className="bg-card dark:bg-card">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
                All Responders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div>
                {responders.map((responder: IServiceProvider) => {
                  const statusInfo = getStatusInfo(responder.serviceStatus);
                  return (
                    <div
                      key={responder.id}
                      className="flex items-center gap-4 border-b border-border p-4 last:border-0"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                          responder.isVerified
                            ? 'border-primary/30 bg-primary/5 text-primary dark:border-primary/50 dark:bg-primary/10'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-600 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400'
                        }`}
                      >
                        {getServiceTypeIcon(responder.serviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate text-foreground dark:text-foreground">
                            {responder.name}
                          </p>
                          {!responder.isVerified && (
                            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-yellow-600 dark:text-yellow-400">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground dark:text-muted-foreground text-sm truncate">
                          {responder.email}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground dark:text-muted-foreground">
                          {getServiceTypeName(responder.serviceType)}
                        </span>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-xs font-medium ${statusInfo.color}`}
                        >
                          <Activity className="h-3 w-3" />
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
