import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          System-wide analytics and reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analytics dashboard coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
