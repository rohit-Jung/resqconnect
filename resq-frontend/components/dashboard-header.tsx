"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
	const router = useRouter();

	const handleLogout = () => {
		// Clear auth token from localStorage
		localStorage.removeItem("token");
		// Redirect to login page
		router.push("/login");
	};

	return (
		<header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="flex h-24 items-center justify-between px-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
					<p className="text-muted-foreground mt-1">
						Monitor and control ResqConnect applications across your network
					</p>
				</div>

				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						className="relative"
					>
						<Bell className="h-5 w-5" />
						<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
					</Button>

					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarImage
								src="https://avatar.vercel.sh/admin"
								alt="Admin User"
							/>
							<AvatarFallback>AU</AvatarFallback>
						</Avatar>
						<span className="text-sm font-medium">Admin User</span>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="text-muted-foreground hover:text-destructive"
					>
						<LogOut className="h-4 w-4 mr-2" />
						Logout
					</Button>
				</div>
			</div>
		</header>
	);
}
