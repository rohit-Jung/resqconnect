export function Stats() {
  const stats = [
    { label: 'Average Response Time', value: '2.3s' },
    { label: 'Active Users', value: '50K+' },
    { label: 'Uptime Reliability', value: '99.9%' },
    { label: 'Emergency Support', value: '24/7' },
  ];

  return (
    <div className="border-y border-border bg-background py-12">
      <div className="container mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
