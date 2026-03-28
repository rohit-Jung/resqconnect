'use client';

import {
  Activity,
  Clock,
  Flame,
  MapPin,
  Navigation,
  Shield,
  Stethoscope,
  Truck,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
      return { label: 'Off Duty', color: 'text-muted-foreground' };
    default:
      return { label: status, color: 'text-muted-foreground' };
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

  const providers = providersResponse?.data?.data ?? [];
  const analytics = analyticsResponse?.data?.data;
  const isLoading = providersLoading || analyticsLoading;

  const totalProviders = providers.length;
  const activeProviders = providers.filter(
    p => p.serviceStatus !== 'off_duty'
  ).length;
  const availableProviders = providers.filter(
    p => p.serviceStatus === 'available'
  ).length;
  const assignedProviders = providers.filter(
    p => p.serviceStatus === 'assigned'
  ).length;
  const activeUnits = providers.filter(p => p.serviceStatus !== 'off_duty');

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor real-time locations of emergency response teams
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {stat.label}
                </span>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Map */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">
            Provider Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ProviderMap
            providers={providers}
            selectedProviderId={selectedProviderId}
            onSelectProvider={setSelectedProviderId}
          />
        </CardContent>
      </Card>

      {/* Active Units List */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">
            Active Response Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-8 w-8" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Navigation className="text-muted-foreground mb-4 h-10 w-10" />
              <p className="font-medium">No active response teams</p>
              <p className="mt-1 text-sm text-muted-foreground">
                All providers are currently off duty
              </p>
            </div>
          ) : (
            <div>
              {activeUnits.map((provider: IServiceProvider) => {
                const statusInfo = getStatusInfo(provider.serviceStatus);
                const hasLocation =
                  provider.currentLocation?.latitude &&
                  provider.currentLocation?.longitude;
                const isSelected = selectedProviderId === provider.id;

                return (
                  <div
                    key={provider.id}
                    onClick={() =>
                      setSelectedProviderId(isSelected ? null : provider.id)
                    }
                    className={`flex cursor-pointer items-center gap-4 border-b border-border p-4 transition-colors last:border-0 ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                        provider.serviceStatus === 'available'
                          ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950'
                          : provider.serviceStatus === 'assigned'
                            ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950'
                            : 'border-border bg-muted text-muted-foreground'
                      }`}
                    >
                      {getServiceTypeIcon(provider.serviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{provider.name}</p>
                      <p className="text-muted-foreground flex items-center gap-1 text-sm truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {provider.serviceArea || provider.primaryAddress}
                      </p>
                      {provider.vehicleInformation &&
                        provider.vehicleInformation.number !== 'Not filled' && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {provider.vehicleInformation.type} —{' '}
                            {provider.vehicleInformation.number}
                          </p>
                        )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {getServiceTypeName(provider.serviceType)}
                      </span>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        {hasLocation ? (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Navigation className="h-3 w-3" />
                            Tracked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
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

      {/* All Providers */}
      {!isLoading && providers.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold">
              All Service Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div>
              {providers.map((provider: IServiceProvider) => {
                const statusInfo = getStatusInfo(provider.serviceStatus);
                return (
                  <div
                    key={provider.id}
                    className="flex items-center gap-4 border-b border-border p-4 last:border-0"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                        provider.isVerified
                          ? 'border-primary/30 bg-primary/5 text-primary'
                          : 'border-yellow-200 bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {getServiceTypeIcon(provider.serviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{provider.name}</p>
                        {!provider.isVerified && (
                          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-yellow-600">
                            Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm truncate">
                        {provider.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {getServiceTypeName(provider.serviceType)}
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
  );
}
