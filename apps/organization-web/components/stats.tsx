'use client';

import { useInView } from '@/hooks/use-in-view';

const stats = [
  { label: 'AVG RESPONSE TIME', value: '2.3s' },
  { label: 'ACTIVE USERS', value: '50K+' },
  { label: 'UPTIME RELIABILITY', value: '99.9%' },
  { label: 'EMERGENCY SUPPORT', value: '24/7' },
];

export function Stats() {
  const { ref, inView } = useInView(0.2);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="border-y border-border bg-secondary py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-1 transition-all duration-600"
              style={{
                transitionDelay: `${idx * 100}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(20px)',
              }}
            >
              <span className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {stat.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
