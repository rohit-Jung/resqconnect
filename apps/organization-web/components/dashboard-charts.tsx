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

const emergencyData = [
  { month: 'Jan', reports: 65 },
  { month: 'Feb', reports: 72 },
  { month: 'Mar', reports: 78 },
  { month: 'Apr', reports: 88 },
  { month: 'May', reports: 85 },
  { month: 'Jun', reports: 92 },
];

const responseTimeData = [
  { range: '<2m', count: 25 },
  { range: '2-4m', count: 45 },
  { range: '4-6m', count: 20 },
  { range: '6-8m', count: 8 },
  { range: '>8m', count: 2 },
];

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

export function DashboardCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Emergency Reports Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Reports Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emergencyData}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#DC2626"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReports)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Response Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="range"
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
