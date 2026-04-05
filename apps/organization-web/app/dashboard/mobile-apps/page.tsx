'use client';

import { Apple, Info, Loader2, Monitor, Smartphone } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import { useOrgServiceProviders } from '@/services/organization/providers.api';

const APP_CONFIG = {
  ios: { version: '1.0.0', storeUrl: '#' },
  android: { version: '1.0.0', storeUrl: '#' },
  web: { version: '1.0.0' },
};

export default function MobileAppsPage() {
  const { data: analyticsResponse, isLoading: analyticsLoading } =
    useOrgDashboardAnalytics();
  const { data: providersResponse, isLoading: providersLoading } =
    useOrgServiceProviders();

  const analytics = analyticsResponse?.data?.data;
  const providers = providersResponse?.data?.data ?? [];
  const isLoading = analyticsLoading || providersLoading;

  const totalProviders = analytics?.providers.total ?? 0;
  const verifiedProviders = providers.filter(p => p.isVerified).length;
  const totalEmergencyRequests = analytics?.emergencyRequests.total ?? 0;

  const apps = [
    {
      name: 'Service Provider App',
      version: APP_CONFIG.android.version,
      description:
        'For service providers to receive and respond to emergencies',
      users: totalProviders,
      userLabel: 'Registered Providers',
      status: 'ACTIVE',
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      name: 'User App',
      version: APP_CONFIG.ios.version,
      description: 'For users to request emergency services',
      users: totalEmergencyRequests,
      userLabel: 'Total Requests',
      status: 'ACTIVE',
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      name: 'Organization Dashboard',
      version: APP_CONFIG.web.version,
      description: 'For managing service providers and monitoring requests',
      users: verifiedProviders,
      userLabel: 'Verified Providers',
      status: 'ACTIVE',
      icon: <Monitor className="h-4 w-4" />,
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
            Mobile Apps
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Manage and monitor your ResQ Connect mobile applications
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* App Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {apps.map(app => (
              <Card key={app.name}>
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{app.icon}</span>
                      <CardTitle className="text-sm font-semibold">
                        {app.name}
                      </CardTitle>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-green-600">
                      {app.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs mb-4">
                    {app.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        Version
                      </span>
                      <p className="mt-1 text-sm font-medium">v{app.version}</p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        {app.userLabel}
                      </span>
                      <p className="mt-1 text-2xl font-bold tracking-tight">
                        {app.users.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Downloads */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold">
              Available Downloads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <Apple className="text-primary h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">iOS App Store</p>
                  <p className="text-muted-foreground text-xs">
                    For iPhone and iPad
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                v{APP_CONFIG.ios.version}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="text-primary h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Google Play Store</p>
                  <p className="text-muted-foreground text-xs">
                    For Android devices
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                v{APP_CONFIG.android.version}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Service providers should download the ResQ Connect mobile app to
                receive emergency requests and update their location in
                real-time. Users can request emergency services through the user
                app, which will automatically find and dispatch the nearest
                available service provider.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
