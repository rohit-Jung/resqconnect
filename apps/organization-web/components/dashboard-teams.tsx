'use client';

import { Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IRecentProvider, ServiceStatus } from '@/types/auth.types';

interface DashboardTeamsProps {
  providers?: IRecentProvider[];
  isLoading?: boolean;
}

const statusColors: Record<ServiceStatus, string> = {
  available: 'bg-green-500',
  assigned: 'bg-orange-500',
  off_duty: 'bg-gray-400',
};

const statusLabels: Record<ServiceStatus, string> = {
  available: 'Available',
  assigned: 'On Assignment',
  off_duty: 'Off Duty',
};

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardTeams({ providers, isLoading }: DashboardTeamsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Response Teams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const teams = providers ?? [];

  if (teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Response Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="text-muted-foreground mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No service providers yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Response Teams</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.slice(0, 5).map(team => (
          <div key={team.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={`https://avatar.vercel.sh/${team.id}`}
                  alt={team.name}
                />
                <AvatarFallback>{getInitials(team.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{team.name}</p>
                <p className="text-muted-foreground text-sm">
                  {statusLabels[team.serviceStatus]}
                  {!team.isVerified && ' (Unverified)'}
                </p>
              </div>
            </div>
            <div
              className={`h-2.5 w-2.5 rounded-full ${statusColors[team.serviceStatus]}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
