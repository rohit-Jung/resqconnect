import { Building2, MapPin, Users } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function OrganizationsPage() {
  const organizations = [
    {
      name: 'City Fire Department',
      city: 'Downtown',
      apps: 3,
      teams: 12,
      status: 'Active',
    },
    {
      name: 'Metro Medical Services',
      city: 'Central',
      apps: 2,
      teams: 8,
      status: 'Active',
    },
    {
      name: 'Police Operations',
      city: 'Northside',
      apps: 4,
      teams: 15,
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organizations and their settings
        </p>
      </div>

      <div className="grid gap-6">
        {organizations.map(org => (
          <Card key={org.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="bg-primary/10 flex items-center justify-center rounded-lg p-2">
                    <Building2 className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{org.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {org.city}
                    </CardDescription>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  {org.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">
                    Active Applications
                  </p>
                  <p className="text-2xl font-bold">{org.apps}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4" />
                    Response Teams
                  </p>
                  <p className="text-2xl font-bold">{org.teams}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
