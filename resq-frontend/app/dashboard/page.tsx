import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard-charts"
import { DashboardAlerts } from "@/components/dashboard-alerts"
import { DashboardTeams } from "@/components/dashboard-teams"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardStats />
      <DashboardCharts />
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardAlerts />
        <DashboardTeams />
      </div>
    </div>
  )
}
