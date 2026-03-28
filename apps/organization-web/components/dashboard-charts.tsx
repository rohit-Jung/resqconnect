'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyTrendItem {
  month: string;
  count: number;
}

interface EmergencyRequestsData {
  total: number;
  thisMonth: number;
  pending: number;
  completed: number;
  monthlyTrend?: MonthlyTrendItem[];
}

interface DashboardChartsProps {
  emergencyRequests?: EmergencyRequestsData;
  isLoading?: boolean;
}

const COLORS = [
  'hsl(221.2 83.2% 53.3%)',
  'hsl(142.1 76.2% 36.3%)',
  'hsl(38 92% 50%)',
  'hsl(262.1 83.3% 57.8%)',
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div>
        <p style={{ fontSize: 11, color: '#737373', margin: 0 }}>{label}</p>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '2px 0 0 0',
            color: '#171717',
          }}
        >
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export function DashboardCharts({
  emergencyRequests,
  isLoading,
}: DashboardChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Requests Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyTrend = emergencyRequests?.monthlyTrend ?? [];
  const pending = emergencyRequests?.pending ?? 0;
  const completed = emergencyRequests?.completed ?? 0;
  const total = emergencyRequests?.total ?? 0;

  // Use monthlyTrend if available, otherwise fall back to summary
  const trendData =
    monthlyTrend.length > 0
      ? monthlyTrend
      : [
          { month: 'Pending', count: pending },
          { month: 'Completed', count: completed },
          { month: 'Total', count: total },
        ];

  const statusData = [
    { status: 'Pending', count: pending },
    { status: 'Completed', count: completed },
    { status: 'Other', count: Math.max(0, total - pending - completed) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Area Chart - Monthly Trend */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">
            Requests Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient
                    id="colorRequests"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(221.2 83.2% 53.3%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(221.2 83.2% 53.3%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={TOOLTIP_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(221.2 83.2% 53.3%)"
                  strokeWidth={2}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Status Distribution */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
