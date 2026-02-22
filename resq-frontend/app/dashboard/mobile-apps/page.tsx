import { Download, Smartphone } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MobileAppsPage() {
  const apps = [
    { name: 'iOS App', version: 'v2.5.1', users: '12,450', status: 'Active', platform: 'iOS' },
    {
      name: 'Android App',
      version: 'v2.5.0',
      users: '15,320',
      status: 'Active',
      platform: 'Android',
    },
    { name: 'Web Dashboard', version: 'v3.1.2', users: '2,340', status: 'Active', platform: 'Web' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Apps</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor your ResQ Connect mobile applications
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {apps.map(app => (
          <Card key={app.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-primary h-6 w-6" />
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {app.status}
                </span>
              </div>
              <CardDescription>{app.platform} Platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs">Version</p>
                  <p className="text-sm font-medium">{app.version}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Active Users</p>
                  <p className="text-2xl font-bold">{app.users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Downloads</CardTitle>
          <CardDescription>Direct links to download ResQ Connect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Download className="text-primary h-5 w-5" />
                <span className="font-medium">iOS App Store</span>
              </div>
              <span className="text-muted-foreground text-xs">v2.5.1</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Download className="text-primary h-5 w-5" />
                <span className="font-medium">Google Play Store</span>
              </div>
              <span className="text-muted-foreground text-xs">v2.5.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
