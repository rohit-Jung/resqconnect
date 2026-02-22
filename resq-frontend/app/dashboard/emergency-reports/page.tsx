import { AlertTriangle, Clock, MapPin } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmergencyReportsPage() {
  const stats = [
    { label: 'Total Reports', value: '892', color: 'bg-blue-100 text-blue-800' },
    { label: 'This Month', value: '156', color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Resolved', value: '834', color: 'bg-green-100 text-green-800' },
    { label: 'Pending', value: '58', color: 'bg-red-100 text-red-800' },
  ];

  const reports = [
    {
      type: 'Building Fire',
      location: 'Downtown District',
      time: '2 hours ago',
      severity: 'Critical',
      icon: '🔥',
    },
    {
      type: 'Traffic Accident',
      location: 'Highway 101',
      time: '4 hours ago',
      severity: 'High',
      icon: '🚗',
    },
    {
      type: 'Medical Emergency',
      location: 'City Center',
      time: '6 hours ago',
      severity: 'Medium',
      icon: '🏥',
    },
    {
      type: 'Power Outage',
      location: 'Westside',
      time: '8 hours ago',
      severity: 'Medium',
      icon: '⚡',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emergency Reports</h1>
        <p className="text-muted-foreground mt-2">
          View and manage emergency reports from your network
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emergency Reports</CardTitle>
          <CardDescription>Latest emergency incidents reported</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-2xl">{report.icon}</span>
                  <div>
                    <p className="font-medium">{report.type}</p>
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {report.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground flex items-center justify-end gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {report.time}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      report.severity === 'Critical'
                        ? 'bg-red-100 text-red-800'
                        : report.severity === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
