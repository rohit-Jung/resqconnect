'use client';

import { Badge } from '@repo/ui/badge';
import { Card } from '@repo/ui/card';

import { Loader2, Server } from 'lucide-react';

import { useGetSilos } from '@/services/super-admin/silos.api';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    inactive: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    stale: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export default function SilosPage() {
  const { data, isLoading, isError } = useGetSilos();
  const silos = (data as any)?.data?.silos ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Silos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registered silo instances — {silos.length} total
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <Card className="p-6 text-center">
          <p className="text-sm text-red-500">Failed to load silos</p>
        </Card>
      )}

      {!isLoading && !isError && silos.length === 0 && (
        <Card className="p-12 text-center">
          <Server className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No silos registered yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Silos register automatically when they boot with a TENANT_ID.
          </p>
        </Card>
      )}

      {silos.length > 0 && (
        <div className="space-y-3">
          {silos.map((silo: any) => (
            <Card key={silo.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {silo.siloBaseUrl}
                    </p>
                    <Badge
                      className={`border text-[10px] font-mono uppercase tracking-wider ${statusBadge(silo.status)}`}
                    >
                      {silo.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Sector:{' '}
                      <span className="font-medium text-foreground">
                        {silo.sector}
                      </span>
                    </span>
                    <span>
                      Orgs:{' '}
                      <span className="font-medium text-foreground">
                        {silo.orgCount}
                      </span>
                    </span>
                    <span>
                      Incidents:{' '}
                      <span className="font-medium text-foreground">
                        {silo.incidentSummary?.total ?? 0}
                      </span>
                    </span>
                    <span>
                      Heartbeat:{' '}
                      <span className="font-medium text-foreground">
                        {silo.lastHeartbeat
                          ? new Date(silo.lastHeartbeat).toLocaleString()
                          : 'never'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
