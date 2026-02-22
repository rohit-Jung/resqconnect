import { TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Total Responses', value: '2,847', change: '+12%', color: 'text-green-600' },
    { label: 'Avg Response Time', value: '4.2 min', change: '-8%', color: 'text-green-600' },
    { label: 'Success Rate', value: '99.8%', change: '+2%', color: 'text-green-600' },
    { label: 'User Satisfaction', value: '4.8/5.0', change: '+5%', color: 'text-green-600' },
  ];

  const performance = [
    { metric: 'Response Calls', percentage: 92 },
    { metric: 'System Uptime', percentage: 99.9 },
    { metric: 'Team Availability', percentage: 96 },
    { metric: 'Device Connectivity', percentage: 98 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Detailed analytics and performance metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {metrics.map(metric => (
          <Card key={metric.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className={`text-xs font-medium ${metric.color} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" />
                  {metric.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Key performance indicators over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {performance.map(item => (
              <div key={item.metric}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">{item.metric}</p>
                  <p className="text-primary text-sm font-bold">{item.percentage}%</p>
                </div>
                <div className="bg-secondary h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
