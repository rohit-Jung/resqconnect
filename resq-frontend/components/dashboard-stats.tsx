import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, AlertTriangle, Users, Clock } from "lucide-react"

const stats = [
  {
    title: "Active Apps",
    value: "1,247",
    change: "+12% vs last month",
    changeType: "positive" as const,
    icon: Smartphone,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Emergency Reports",
    value: "89",
    change: "+5 today",
    changeType: "warning" as const,
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    title: "Response Teams",
    value: "156",
    change: "98% availability",
    changeType: "positive" as const,
    icon: Users,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Avg Response Time",
    value: "4.2m",
    change: "-15s improvement",
    changeType: "positive" as const,
    icon: Clock,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p
                  className={`mt-2 text-sm ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "warning"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
