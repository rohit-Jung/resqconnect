'use client';

import { Card, CardContent } from '@repo/ui/card';

export function StatsCards({
  stats,
}: {
  stats: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map(stat => (
        <Card key={stat.label} className="rounded-xl">
          <CardContent className="p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {stat.label}
            </span>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
