import { Button } from "@/components/ui/button";
import { Apple, Play, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DeviceMockup from "@/assets/images/mobile-cta.png";
import Image from "next/image";

export function Hero() {
	return (
		<section className="relative overflow-hidden bg-secondary py-12 md:py-24">
			<div className="container mx-auto px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32">
				<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
					<div className="flex flex-col gap-6">
						<div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							Emergency Response in Seconds
						</div>
						<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
							Connect to Help When Every <span className="text-primary">Second</span>{" "}
							Counts
						</h1>
						<p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
							ResQConnect instantly connects you to emergency responders, medical
							professionals, and loved ones with a single tap. Your safety network, always
							ready.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 pt-2">
							<Button
								size="lg"
								className="h-14 px-8 text-base"
							>
								<Apple className="mr-2 h-5 w-5" /> Download for iOS
							</Button>
							<Button
								size="lg"
								variant="secondary"
								className="h-14 px-8 text-base bg-card border border-border text-foreground hover:bg-accent"
							>
								<Play className="mr-2 h-5 w-5 fill-current" /> Download for Android
							</Button>
						</div>
						<div className="flex items-center gap-6 pt-4">
							<div className="flex -space-x-3">
								{[1, 2, 3].map((i) => (
									<Avatar
										key={i}
										className="border-2 border-background"
									>
										<AvatarImage src="/assets/images/user.png" />
										<AvatarFallback>U{i}</AvatarFallback>
									</Avatar>
								))}
							</div>
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-1">
									{[1, 2, 3, 4, 5].map((i) => (
										<Star
											key={i}
											className="h-4 w-4 fill-yellow-400 text-yellow-400"
										/>
									))}
									<span className="ml-1 text-sm font-bold text-foreground">4.9/5 Rating</span>
								</div>
								<p className="text-xs font-medium text-muted-foreground">
									50,000+ Lives Protected
								</p>
							</div>
						</div>
					</div>
					<div className="relative mx-auto lg:ml-auto">
						<div className="relative z-10 overflow-hidden rounded-[2.5rem] border-8 border-primary/40 bg-primary/40 shadow-2xl">
							<Image
								src={DeviceMockup}
								alt="ResQConnect Mobile App"
								className="h-auto drop-shadow-2xl"
							/>
						</div>
						{/* Notification Card Overlay */}
						<div className="absolute -bottom-6 -left-12 z-20 hidden md:block w-64 rounded-xl bg-card p-4 shadow-xl border border-border animate-in fade-in slide-in-from-left-4 duration-1000">
							<div className="flex items-center gap-3">
								<div className="h-3 w-3 rounded-full bg-green-500" />
								<p className="text-sm font-bold text-foreground">Emergency Alert Sent</p>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Responders notified in 2.3 seconds
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
