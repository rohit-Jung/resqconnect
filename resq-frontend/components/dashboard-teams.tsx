import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const teams = [
  {
    id: 1,
    name: "Fire Dept. Unit 12",
    status: "En route" as const,
    avatar: "https://avatar.vercel.sh/fire12",
    fallback: "FD",
  },
  {
    id: 2,
    name: "Paramedic Team A",
    status: "On scene" as const,
    avatar: "https://avatar.vercel.sh/paramedic-a",
    fallback: "PA",
  },
  {
    id: 3,
    name: "Police Unit 7",
    status: "Available" as const,
    avatar: "https://avatar.vercel.sh/police7",
    fallback: "PU",
  },
]

const statusColors = {
  "En route": "bg-green-500",
  "On scene": "bg-orange-500",
  Available: "bg-green-500",
}

export function DashboardTeams() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Response Teams</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={team.avatar || "/placeholder.svg"} alt={team.name} />
                <AvatarFallback>{team.fallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{team.name}</p>
                <p className="text-sm text-muted-foreground">{team.status}</p>
              </div>
            </div>
            <div className={`h-2.5 w-2.5 rounded-full ${statusColors[team.status]}`} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
