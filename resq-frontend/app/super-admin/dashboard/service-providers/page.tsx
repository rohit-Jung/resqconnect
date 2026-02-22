import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceProvidersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Providers</h1>
        <p className="text-muted-foreground mt-2">
          Manage all service providers across organizations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Service provider management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
