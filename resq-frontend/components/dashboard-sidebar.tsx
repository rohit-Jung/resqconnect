"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	ShieldCheck,
	LayoutDashboard,
	Smartphone,
	Building2,
	AlertTriangle,
	Navigation,
	BarChart3,
	Settings,
	Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Service Providers", href: "/dashboard/service-providers", icon: Users },
	{ name: "Mobile Apps", href: "/dashboard/mobile-apps", icon: Smartphone },
	{ name: "Organizations", href: "/dashboard/organizations", icon: Building2 },
	{
		name: "Emergency Reports",
		href: "/dashboard/emergency-reports",
		icon: AlertTriangle,
	},
	{ name: "Live Tracking", href: "/dashboard/live-tracking", icon: Navigation },
	{ name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
	{ name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
	const pathname = usePathname();

	return (
		<aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
			<div className="flex h-full flex-col">
				{/* Logo */}
				<div className="flex h-16 items-center gap-2 border-b px-6">
					<div className="flex items-center justify-center rounded-lg bg-primary p-1.5 text-primary-foreground">
						<ShieldCheck className="h-5 w-5" />
					</div>
					<span className="text-lg font-bold tracking-tight">
						ResQ <span className="text-primary">Connect</span>
					</span>
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 p-4">
					{navigation.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								)}
							>
								<item.icon className="h-5 w-5" />
								{item.name}
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
