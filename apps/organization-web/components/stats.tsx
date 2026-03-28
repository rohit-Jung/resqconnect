export function Stats() {
  const stats = [
    { label: 'AVG RESPONSE TIME', value: '2.3s' },
    { label: 'ACTIVE USERS', value: '50K+' },
    { label: 'UPTIME RELIABILITY', value: '99.9%' },
    { label: 'EMERGENCY SUPPORT', value: '24/7' },
  ];

  return (
    <div className="border-y border-border bg-secondary py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col gap-1">
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
