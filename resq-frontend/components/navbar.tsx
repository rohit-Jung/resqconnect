import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export function Navbar() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-8 lg:px-12">
				<Link
					href="/"
					className="flex items-center gap-2"
				>
					<div className="flex items-center justify-center rounded-lg bg-primary p-1 text-primary-foreground">
						<ShieldCheck className="h-6 w-6" />
					</div>
					<span className="text-xl font-bold tracking-tight">
						ResQ <span className="text-primary">Connect</span>
					</span>
				</Link>
				<nav className="hidden md:flex items-center gap-8">
					<Link
						href="#features"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Features
					</Link>
					<Link
						href="#how-it-works"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						How It Works
					</Link>
					<Link
						href="#testimonials"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Testimonials
					</Link>
					<Link
						href="#download"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Download
					</Link>
				</nav>
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						className="hidden sm:inline-flex"
						asChild
					>
						<Link href="/login">Sign In</Link>
					</Button>
					<Button asChild>
						<Link href="/signup">Get Started</Link>
					</Button>
				</div>
			</div>
		</header>
	);
}
