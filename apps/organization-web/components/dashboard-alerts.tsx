'use client';

import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';

import { AlertTriangle, Car, Clock, Flame, Heart } from 'lucide-react';

import {
  IRecentEmergencyRequest,
  RequestStatus,
  ServiceCategory,
} from '@/types/auth.types';

interface DashboardAlertsProps {
  emergencyRequests?: IRecentEmergencyRequest[];
  isLoading?: boolean;
}

// Map service category to icon
const categoryIcons: Record<
  ServiceCategory,
  { icon: typeof Flame; iconBg: string; iconColor: string }
> = {
  fire_truck: { icon: Flame, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ambulance: { icon: Heart, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  police: { icon: Car, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  rescue_team: {
    icon: AlertTriangle,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
};

// Map status to severity
const statusSeverity: Record<RequestStatus, 'Critical' | 'High' | 'Medium'> = {
  pending: 'Critical',
  accepted: 'High',
  assigned: 'High',
  in_progress: 'Medium',
  rejected: 'Medium',
  completed: 'Medium',
  cancelled: 'Medium',
  no_providers_available: 'Critical',
};

const severityColors = {
  Critical: 'bg-red-600 hover:bg-red-600',
  High: 'bg-orange-500 hover:bg-orange-500',
  Medium: 'bg-blue-600 hover:bg-blue-600',
};

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Reported just now';
  if (diffMins < 60)
    return `Reported ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `Reported ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `Reported ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function DashboardAlerts({
  emergencyRequests,
  isLoading,
}: DashboardAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Emergency Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const alerts = emergencyRequests ?? [];

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Emergency Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="text-muted-foreground mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No recent emergency alerts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Emergency Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.slice(0, 5).map(alert => {
          const iconConfig = categoryIcons[alert.serviceType] ?? {
            icon: AlertTriangle,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
          };
          const severity = statusSeverity[alert.requestStatus] ?? 'Medium';
          const IconComponent = iconConfig.icon;

          return (
            <div
              key={alert.id}
              className="bg-card hover:bg-accent flex items-center justify-between rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${iconConfig.iconBg}`}>
                  <IconComponent
                    className={`h-5 w-5 ${iconConfig.iconColor}`}
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {alert.description ||
                      `${alert.serviceType.charAt(0).toUpperCase() + alert.serviceType.slice(1).replace('_', ' ')} Emergency`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatTimeAgo(alert.createdAt)}
                    {alert.location?.address && ` - ${alert.location.address}`}
                  </p>
                </div>
              </div>
              <Badge className={severityColors[severity]}>{severity}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
