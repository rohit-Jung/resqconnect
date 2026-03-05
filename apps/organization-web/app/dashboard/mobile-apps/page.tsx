'use client';

import {
  Apple,
  Download,
  ExternalLink,
  Info,
  Monitor,
  Smartphone,
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
import { useOrgServiceProviders } from '@/services/organization/providers.api';

// App configuration - these would typically come from environment variables or a config file
const APP_CONFIG = {
  ios: {
    version: '1.0.0',
    storeUrl: '#', // Replace with actual App Store URL
  },
  android: {
    version: '1.0.0',
    storeUrl: '#', // Replace with actual Play Store URL
  },
  web: {
    version: '1.0.0',
  },
};

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
              <div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MobileAppsPage() {
  const { data: analyticsResponse, isLoading: analyticsLoading } =
    useOrgDashboardAnalytics();
  const { data: providersResponse, isLoading: providersLoading } =
    useOrgServiceProviders();

  const analytics = analyticsResponse?.data?.data;
  const providers = providersResponse?.data?.data ?? [];

  const isLoading = analyticsLoading || providersLoading;

  // Calculate stats from available data
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
      status: 'Active',
      platform: 'Mobile',
      icon: <Smartphone className="h-6 w-6" />,
    },
    {
      name: 'User App',
      version: APP_CONFIG.ios.version,
      description: 'For users to request emergency services',
      users: totalEmergencyRequests,
      userLabel: 'Requests',
      status: 'Active',
      platform: 'Mobile',
      icon: <Smartphone className="h-6 w-6" />,
    },
    {
      name: 'Organization Dashboard',
      version: APP_CONFIG.web.version,
      description: 'For managing service providers and monitoring requests',
      users: verifiedProviders,
      userLabel: 'Verified Providers',
      status: 'Active',
      platform: 'Web',
      icon: <Monitor className="h-6 w-6" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Apps</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor your ResQ Connect mobile applications
        </p>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {apps.map(app => (
            <Card key={app.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 text-primary">
                    {app.icon}
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {app.status}
                  </span>
                </div>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Version</p>
                    <p className="text-sm font-medium">{app.version}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {app.userLabel || 'Registered Users'}
                    </p>
                    <p className="text-2xl font-bold">
                      {app.users.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Downloads</CardTitle>
          <CardDescription>
            Direct links to download ResQ Connect apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Apple className="text-primary h-5 w-5" />
                <div>
                  <span className="font-medium">iOS App Store</span>
                  <p className="text-xs text-muted-foreground">
                    For iPhone and iPad
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  v{APP_CONFIG.ios.version}
                </span>
                {APP_CONFIG.ios.storeUrl !== '#' && (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="text-primary h-5 w-5" />
                <div>
                  <span className="font-medium">Google Play Store</span>
                  <p className="text-xs text-muted-foreground">
                    For Android devices
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  v{APP_CONFIG.android.version}
                </span>
                {APP_CONFIG.android.storeUrl !== '#' && (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800 text-base">
              App Distribution
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            Service providers should download the ResQ Connect mobile app to
            receive emergency requests and update their location in real-time.
            Users can request emergency services through the user app, which
            will automatically find and dispatch the nearest available service
            provider.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
