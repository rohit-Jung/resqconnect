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
  IServiceProvider,
  useOrgServiceProviders,
} from '@/services/organization/providers.api';
import { ServiceStatus, ServiceType } from '@/types/auth.types';

// Get icon based on service type
function getServiceTypeIcon(serviceType: ServiceType) {
  switch (serviceType) {
    case 'ambulance':
      return <Stethoscope className="h-5 w-5" />;
    case 'police':
      return <Shield className="h-5 w-5" />;
    case 'fire_truck':
      return <Flame className="h-5 w-5" />;
    case 'rescue_team':
      return <Users className="h-5 w-5" />;
    default:
      return <Truck className="h-5 w-5" />;
  }
}

// Get status display info
function getStatusInfo(status: ServiceStatus): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'available':
      return { label: 'Available', color: 'text-green-600' };
    case 'assigned':
      return { label: 'On Duty', color: 'text-orange-600' };
    case 'off_duty':
      return { label: 'Off Duty', color: 'text-gray-500' };
    default:
      return { label: status, color: 'text-gray-500' };
  }
}

// Get human-readable service type name
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

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Units skeleton
function UnitsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LiveTrackingPage() {
  const { data: providersResponse, isLoading: providersLoading } =
    useOrgServiceProviders();
  const { data: analyticsResponse, isLoading: analyticsLoading } =
    useOrgDashboardAnalytics();

  const providers = providersResponse?.data?.data ?? [];
  const analytics = analyticsResponse?.data?.data;

  const isLoading = providersLoading || analyticsLoading;

  // Calculate stats from real data
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

  // Filter to show active providers (not off duty)
  const activeUnits = providers.filter(p => p.serviceStatus !== 'off_duty');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor real-time locations of emergency response teams
        </p>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalProviders}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.providers.thisMonth ?? 0} added this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Active Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeProviders}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {assignedProviders} currently assigned
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Available Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{availableProviders}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.providers.availabilityPercentage?.toFixed(1) ?? 0}%
                availability
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Response Teams</CardTitle>
          <CardDescription>
            Live status of all service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <UnitsSkeleton />
          ) : activeUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Navigation className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active response teams</p>
              <p className="text-sm text-muted-foreground mt-1">
                All service providers are currently off duty
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeUnits.map((provider: IServiceProvider) => {
                const statusInfo = getStatusInfo(provider.serviceStatus);
                const hasLocation =
                  provider.currentLocation?.latitude &&
                  provider.currentLocation?.longitude;

                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div
                        className={`flex items-center justify-center rounded-full p-2 ${
                          provider.serviceStatus === 'available'
                            ? 'bg-green-100 text-green-600'
                            : provider.serviceStatus === 'assigned'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {getServiceTypeIcon(provider.serviceType)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4" />
                          {provider.serviceArea || provider.primaryAddress}
                        </p>
                        {provider.vehicleInformation &&
                          provider.vehicleInformation.number !==
                            'Not filled' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {provider.vehicleInformation.type} -{' '}
                              {provider.vehicleInformation.number}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">
                        {getServiceTypeName(provider.serviceType)}
                      </p>
                      {hasLocation ? (
                        <p className="text-primary flex items-center justify-end gap-1 text-xs mt-1">
                          <Navigation className="h-3 w-3" />
                          Location tracked
                        </p>
                      ) : (
                        <p className="text-muted-foreground flex items-center justify-end gap-1 text-xs mt-1">
                          <Navigation className="h-3 w-3" />
                          No location data
                        </p>
                      )}
                      <span
                        className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}
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

      {/* All providers section */}
      {!isLoading && providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Service Providers</CardTitle>
            <CardDescription>
              Complete list of all registered service providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.map((provider: IServiceProvider) => {
                const statusInfo = getStatusInfo(provider.serviceStatus);

                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div
                        className={`flex items-center justify-center rounded-full p-2 ${
                          provider.isVerified
                            ? 'bg-primary/10 text-primary'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}
                      >
                        {getServiceTypeIcon(provider.serviceType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{provider.name}</p>
                          {!provider.isVerified && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {provider.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">
                        {getServiceTypeName(provider.serviceType)}
                      </p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}
                      >
                        <Activity className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
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
