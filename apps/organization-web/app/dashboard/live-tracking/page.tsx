import { Activity, Clock, MapPin, Navigation } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LiveTrackingPage() {
  const units = [
    {
      team: 'Fire Dept - Unit 12',
      location: 'Downtown District',
      distance: '2.5 km',
      eta: '8 minutes',
      status: 'En Route',
    },
    {
      team: 'Paramedic Team A',
      location: 'Main Street',
      distance: '1.2 km',
      eta: '3 minutes',
      status: 'On Scene',
    },
    {
      team: 'Police Unit 7',
      location: 'Central Park',
      distance: '3.8 km',
      eta: '12 minutes',
      status: 'En Route',
    },
    {
      team: 'Fire Dept - Unit 5',
      location: 'Westside',
      distance: '5.1 km',
      eta: '15 minutes',
      status: 'Dispatched',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor real-time locations of emergency response teams
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Units Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Average Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4.2m</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Coverage Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">98.5%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Response Teams</CardTitle>
          <CardDescription>
            Live location tracking of all active units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {units.map((unit, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="bg-primary/10 flex items-center justify-center rounded-full p-2">
                    <Navigation className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{unit.team}</p>
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {unit.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm font-medium">
                    {unit.distance}
                  </p>
                  <p className="text-primary flex items-center justify-end gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {unit.eta}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 text-xs font-medium`}
                  >
                    <Activity className="h-3 w-3" />
                    {unit.status}
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
