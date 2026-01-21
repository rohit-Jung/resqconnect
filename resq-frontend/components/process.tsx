export function Process() {
	const steps = [
		{
			number: "1",
			title: "Download App",
			description: "Get ResQConnect from App Store or Google Play in seconds",
		},
		{
			number: "2",
			title: "Setup Profile",
			description: "Add your medical info and emergency contacts quickly",
		},
		{
			number: "3",
			title: "Build Network",
			description: "Invite trusted contacts to your safety circle",
		},
		{
			number: "4",
			title: "Stay Protected",
			description: "You're ready! Help is just one tap away, anytime",
		},
	];

	return (
		<section
			id="how-it-works"
			className="py-20 md:py-32 bg-slate-50"
		>
			<div className="container mx-auto px-6 sm:px-8 lg:px-12">
				<div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
					<div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-primary">
						HOW IT WORKS
					</div>
					<h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">
						Simple Steps to Stay Safe
					</h2>
					<p className="text-lg text-slate-500">
						Getting started with ResQConnect is quick and easy
					</p>
				</div>

				<div className="relative max-w-5xl mx-auto">
					{/* Connecting Line */}
					<div className="absolute top-10 left-[10%] right-[10%] hidden md:block h-0.5 bg-primary/20" />

					<div className="grid gap-12 md:grid-cols-4">
						{steps.map((step, idx) => (
							<div
								key={idx}
								className="relative flex flex-col items-center text-center gap-4"
							>
								<div className="z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-lg ring-8 ring-white">
									{step.number}
								</div>
								<h3 className="text-xl font-bold text-slate-900 mt-2">{step.title}</h3>
								<p className="text-slate-500 text-sm">{step.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
