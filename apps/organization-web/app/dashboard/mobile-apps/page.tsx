'use client';

import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

import { Download, Info, Loader2, Monitor, Smartphone } from 'lucide-react';
import { FaAndroid, FaApple } from 'react-icons/fa';

import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import {
  type IServiceProvider,
  useOrgServiceProviders,
} from '@/services/organization/providers.api';

const APP_CONFIG = {
  ios: { version: '1.0.0', storeUrl: '#' },
  android: { version: '1.0.0', apkUrl: '#' },
  web: { version: '1.0.0' },
};

export default function MobileAppsPage() {
  const { data: analyticsResponse, isLoading: analyticsLoading } =
    useOrgDashboardAnalytics();
  const { data: providersResponse, isLoading: providersLoading } =
    useOrgServiceProviders();

  const analytics = analyticsResponse?.data?.data;
  const responders: IServiceProvider[] = providersResponse?.data?.data ?? [];
  const isLoading = analyticsLoading || providersLoading;

  const totalProviders = analytics?.providers.total ?? 0;
  const verifiedProviders = responders.filter(p => p.isVerified).length;
  const totalEmergencyRequests = analytics?.emergencyRequests.total ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-foreground">
            RESQ
          </span>
          <span className="text-xl font-bold text-primary">.</span>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mobile Apps
          </h1>
          <p className="text-muted-foreground mt-1">
            Distribute and monitor ResQConnect mobile apps
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-px bg-border border border-border md:grid-cols-3">
          <div className="bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Responder App
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {totalProviders.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Registered responders
            </p>
          </div>
          <div className="bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                User App
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {totalEmergencyRequests.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total requests made
            </p>
          </div>
          <div className="bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Dashboard
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {verifiedProviders.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Verified responders
            </p>
          </div>
        </div>

        {/* Downloads */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Downloads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* iOS */}
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-muted">
                  <FaApple className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">iOS App</p>
                  <p className="text-xs text-muted-foreground">
                    iPhone &amp; iPad · v{APP_CONFIG.ios.version}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none gap-2"
                asChild
              >
                <a
                  href={APP_CONFIG.ios.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-3.5 w-3.5" />
                  App Store
                </a>
              </Button>
            </div>

            {/* Android APK */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-muted">
                  <FaAndroid className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Android App</p>
                  <p className="text-xs text-muted-foreground">
                    Direct APK · v{APP_CONFIG.android.version}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="rounded-none gap-2 bg-primary hover:bg-primary/90"
                asChild
              >
                <a href={APP_CONFIG.android.apkUrl} download>
                  <Download className="h-3.5 w-3.5" />
                  Download APK
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex gap-3 border border-border bg-card p-4">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Responders should install the ResQConnect app to receive emergency
            requests and share real-time location. Users request services via
            the user app, which dispatches the nearest available responder
            automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
