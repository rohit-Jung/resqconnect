import { Activity, AlertTriangle, Building2, Smartphone, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Organizations',
    value: '24',
    change: '+3 this month',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    title: 'Total Users',
    value: '12,847',
    change: '+847 this month',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950',
  },
  {
    title: 'Service Providers',
    value: '1,432',
    change: '+156 this month',
    icon: Smartphone,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
  },
  {
    title: 'Active Emergencies',
    value: '7',
    change: '3 critical',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950',
  },
  {
    title: 'Response Rate',
    value: '98.7%',
    change: '+2.3% from last month',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    title: 'System Health',
    value: '99.9%',
    change: 'All systems operational',
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950',
  },
];

const recentOrganizations = [
  { name: 'City Fire Department', category: 'Fire', status: 'Active', providers: 45 },
  { name: 'Metro Ambulance Services', category: 'Medical', status: 'Active', providers: 78 },
  { name: 'Regional Police Force', category: 'Police', status: 'Pending', providers: 120 },
  { name: 'Disaster Response Unit', category: 'Rescue', status: 'Active', providers: 32 },
];

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">System-wide statistics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{stat.change}</p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="text-muted-foreground pb-3 text-sm font-medium">Organization</th>
                  <th className="text-muted-foreground pb-3 text-sm font-medium">Category</th>
                  <th className="text-muted-foreground pb-3 text-sm font-medium">Status</th>
                  <th className="text-muted-foreground pb-3 text-sm font-medium">Providers</th>
                </tr>
              </thead>
              <tbody>
                {recentOrganizations.map(org => (
                  <tr key={org.name} className="border-b last:border-0">
                    <td className="py-4 font-medium">{org.name}</td>
                    <td className="text-muted-foreground py-4">{org.category}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          org.status === 'Active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground py-4">{org.providers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
