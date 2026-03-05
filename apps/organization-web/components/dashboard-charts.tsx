'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EmergencyRequestsData {
  total: number;
  thisMonth: number;
  pending: number;
  completed: number;
}

interface DashboardChartsProps {
  emergencyRequests?: EmergencyRequestsData;
  isLoading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background rounded-lg border p-2 shadow-md">
        <p className="text-sm font-medium">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({
  emergencyRequests,
  isLoading,
}: DashboardChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Emergency Requests Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate chart data from emergency requests stats
  const requestsOverviewData = [
    { label: 'Total', count: emergencyRequests?.total ?? 0 },
    { label: 'This Month', count: emergencyRequests?.thisMonth ?? 0 },
    { label: 'Pending', count: emergencyRequests?.pending ?? 0 },
    { label: 'Completed', count: emergencyRequests?.completed ?? 0 },
  ];

  const statusDistributionData = [
    { status: 'Pending', count: emergencyRequests?.pending ?? 0 },
    { status: 'Completed', count: emergencyRequests?.completed ?? 0 },
    {
      status: 'In Progress',
      count: Math.max(
        0,
        (emergencyRequests?.total ?? 0) -
          (emergencyRequests?.pending ?? 0) -
          (emergencyRequests?.completed ?? 0)
      ),
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Emergency Requests Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Requests Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={requestsOverviewData}>
                <defs>
                  <linearGradient
                    id="colorRequests"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#DC2626"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Request Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Request Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="status"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
