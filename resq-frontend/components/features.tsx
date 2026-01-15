import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, MapPin, Users, Video, ClipboardList, BellOff } from "lucide-react";

export function Features() {
	const features = [
		{
			title: "One-Tap Emergency",
			description:
				"Instantly alert emergency services and your safety network with a single tap. No navigation, no delays.",
			icon: Zap,
		},
		{
			title: "Real-Time Location",
			description:
				"Automatic GPS sharing sends your exact location to responders and trusted contacts instantly.",
			icon: MapPin,
		},
		{
			title: "Safety Network",
			description:
				"Create a circle of trusted contacts who are automatically notified during emergencies.",
			icon: Users,
		},
		{
			title: "Live Video Stream",
			description:
				"Stream live video to emergency responders to help them assess the situation before arrival.",
			icon: Video,
		},
		{
			title: "Medical Profile",
			description:
				"Store critical medical information, allergies, and medications accessible to first responders.",
			icon: ClipboardList,
		},
		{
			title: "Silent Alert Mode",
			description:
				"Discreetly send alerts without sound or notification in dangerous situations.",
			icon: BellOff,
		},
	];

	return (
		<section
			id="features"
			className="py-20 md:py-32 bg-white"
		>
			<div className="container mx-auto px-6 sm:px-8 lg:px-12">
				<div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
					<div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-primary">
						FEATURES
					</div>
					<h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">
						Everything You Need in an Emergency
					</h2>
					<p className="text-lg text-slate-500">
						Comprehensive emergency response features designed to keep you and your loved
						ones safe
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, idx) => (
						<Card
							key={idx}
							className="border-slate-100 shadow-sm hover:shadow-md transition-shadow"
						>
							<CardHeader>
								<div className="mb-4 h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white">
									<feature.icon className="h-6 w-6" />
								</div>
								<CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-slate-500 leading-relaxed">{feature.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
