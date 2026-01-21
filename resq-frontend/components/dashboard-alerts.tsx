import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Car, Heart } from "lucide-react"

const alerts = [
  {
    id: 1,
    title: "Building Fire - Downtown",
    time: "Reported 5 minutes ago",
    severity: "Critical" as const,
    icon: Flame,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    id: 2,
    title: "Traffic Accident - Highway 101",
    time: "Reported 12 minutes ago",
    severity: "High" as const,
    icon: Car,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: 3,
    title: "Medical Emergency - City Center",
    time: "Reported 18 minutes ago",
    severity: "Medium" as const,
    icon: Heart,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
]

const severityColors = {
  Critical: "bg-red-600 hover:bg-red-600",
  High: "bg-orange-500 hover:bg-orange-500",
  Medium: "bg-blue-600 hover:bg-blue-600",
}

export function DashboardAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Emergency Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${alert.iconBg}`}>
                <alert.icon className={`h-5 w-5 ${alert.iconColor}`} />
              </div>
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.time}</p>
              </div>
            </div>
            <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
