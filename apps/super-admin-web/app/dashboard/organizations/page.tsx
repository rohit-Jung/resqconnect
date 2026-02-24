import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrganizationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2">
          Manage all registered organizations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Organization management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
