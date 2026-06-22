import {
  Activity,
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Map,
  Users,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Incidents', icon: Activity, active: false },
  { label: 'Responders', icon: Users, active: false },
  { label: 'Analytics', icon: BarChart3, active: false },
  { label: 'Map View', icon: Map, active: false },
];

const KPIS = [
  { label: 'Active Incidents', value: '3', color: 'text-foreground' },
  { label: 'Avg Response', value: '2.3s', color: 'text-green-600' },
  { label: "Today's Calls", value: '47', color: 'text-foreground' },
  { label: 'Coverage', value: '94%', color: 'text-foreground' },
];

const INCIDENTS = [
  { type: 'Cardiac', time: '2 min ago', color: 'bg-red-500' },
  { type: 'Accident', time: '8 min ago', color: 'bg-amber-500' },
  { type: 'Fall', time: '15 min ago', color: 'bg-amber-500' },
];

export function DashboardMockup() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex h-8 items-center gap-1.5 border-b border-border px-4">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-4 flex h-5 flex-1 items-center justify-center rounded bg-secondary px-3">
            <span className="text-[9px] font-mono text-muted-foreground">
              dashboard.hospital1.resqconnect.com
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-px bg-border">
          <aside className="col-span-3 bg-card p-3">
            <div className="mb-6 flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-primary" />
              <span className="text-[10px] font-bold text-foreground">
                RESQ<span className="text-primary">.</span>
              </span>
            </div>
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href="#"
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[9px] transition-all duration-200 ${
                      item.active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </aside>

          <main className="col-span-9 bg-background p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Dashboard
                </p>
                <h2 className="text-sm font-bold text-foreground">
                  Good morning, City Hospital
                </h2>
              </div>
              <div className="flex h-7 items-center gap-2 rounded-md border border-border px-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-mono text-muted-foreground">
                  12 responders online
                </span>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-4 gap-3">
              {KPIS.map(kpi => (
                <div
                  key={kpi.label}
                  className="rounded border border-border bg-card p-3"
                >
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className={`mt-0.5 text-lg font-bold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded border border-border bg-secondary p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    Live Map
                  </span>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                </div>
                <svg viewBox="0 0 240 120" className="w-full">
                  <rect
                    width="240"
                    height="120"
                    rx="4"
                    className="fill-background"
                  />
                  {[0, 1, 2, 3].map(i => (
                    <line
                      key={`h${i}`}
                      x1="0"
                      y1={i * 30}
                      x2="240"
                      y2={i * 30}
                      className="stroke-border"
                      strokeWidth="0.5"
                    />
                  ))}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    <line
                      key={`v${i}`}
                      x1={i * 30}
                      y1="0"
                      x2={i * 30}
                      y2="120"
                      className="stroke-border"
                      strokeWidth="0.5"
                    />
                  ))}
                  <circle
                    cx="80"
                    cy="50"
                    r="5"
                    className="fill-red-500"
                    opacity="0.9"
                  />
                  <circle cx="80" cy="50" r="10" className="fill-red-500/20" />
                  <circle
                    cx="160"
                    cy="70"
                    r="4"
                    className="fill-amber-500"
                    opacity="0.9"
                  />
                  <circle
                    cx="120"
                    cy="40"
                    r="4"
                    className="fill-amber-500"
                    opacity="0.9"
                  />
                  <circle
                    cx="180"
                    cy="30"
                    r="3"
                    className="fill-green-500"
                    opacity="0.9"
                  />
                  <circle cx="70" cy="55" r="2.5" className="fill-primary" />
                  <circle cx="90" cy="45" r="2.5" className="fill-primary" />
                  <circle cx="150" cy="75" r="2.5" className="fill-primary" />
                  <circle cx="130" cy="35" r="2.5" className="fill-primary" />
                  <line
                    x1="70"
                    y1="55"
                    x2="80"
                    y2="50"
                    className="stroke-primary/40"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1="90"
                    y1="45"
                    x2="80"
                    y2="50"
                    className="stroke-primary/40"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1="150"
                    y1="75"
                    x2="160"
                    y2="70"
                    className="stroke-primary/40"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </svg>
              </div>

              <div className="rounded border border-border bg-card p-3">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  Active
                </span>
                <div className="mt-2 space-y-2">
                  {INCIDENTS.map(inc => (
                    <div
                      key={inc.type}
                      className="flex items-center gap-2 rounded border border-border bg-background p-2 transition-colors hover:bg-secondary/50"
                    >
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${inc.color}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[10px] font-medium text-foreground">
                          {inc.type}
                        </p>
                        <p className="text-[8px] text-muted-foreground">
                          {inc.time}
                        </p>
                      </div>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary transition-colors hover:bg-secondary/80">
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
