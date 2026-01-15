import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export function Testimonials() {
	const reviews = [
		{
			name: "Sarah Mitchell",
			role: "New York, NY",
			quote:
				"When my father had a heart attack, ResQConnect sent his location and medical history to paramedics instantly. They arrived prepared and saved his life.",
			image: "/assets/images/user.png",
		},
		{
			name: "Marcus Johnson",
			role: "Austin, TX",
			quote:
				"As someone with severe allergies, having my medical info instantly accessible to first responders gives me incredible peace of mind every day.",
			image: "/assets/images/user.png",
		},
		{
			name: "Emily Rodriguez",
			role: "Los Angeles, CA",
			quote:
				"The silent alert feature helped me get help during a dangerous situation without escalating it. This app literally saved my life.",
			image: "/assets/images/user.png",
		},
	];

	return (
		<section
			id="testimonials"
			className="py-20 md:py-32 bg-white"
		>
			<div className="container mx-auto px-6 sm:px-8 lg:px-12">
				<div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
					<div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-primary">
						TESTIMONIALS
					</div>
					<h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">
						Real Stories, Real Lives Saved
					</h2>
					<p className="text-lg text-slate-500">
						Hear from people who trusted ResQConnect in their moment of need
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-3">
					{reviews.map((review, idx) => (
						<Card
							key={idx}
							className="border-slate-100 shadow-sm"
						>
							<CardContent className="pt-8 space-y-4">
								<div className="flex gap-1">
									{[1, 2, 3, 4, 5].map((i) => (
										<Star
											key={i}
											className="h-4 w-4 fill-yellow-400 text-yellow-400"
										/>
									))}
								</div>
								<p className="text-slate-600 italic leading-relaxed">"{review.quote}"</p>
								<div className="flex items-center gap-4 pt-4">
									<Avatar>
										<AvatarImage src={review.image || "/placeholder.svg"} />
										<AvatarFallback>{review.name[0]}</AvatarFallback>
									</Avatar>
									<div>
										<h4 className="font-bold text-slate-900">{review.name}</h4>
										<p className="text-xs text-slate-500">{review.role}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
