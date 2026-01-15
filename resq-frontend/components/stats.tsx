export function Stats() {
	const stats = [
		{ label: "Average Response Time", value: "2.3s" },
		{ label: "Active Users", value: "50K+" },
		{ label: "Uptime Reliability", value: "99.9%" },
		{ label: "Emergency Support", value: "24/7" },
	];

	return (
		<div className="border-y bg-white py-12">
			<div className="container mx-auto px-6 sm:px-8 lg:px-12">
				<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
					{stats.map((stat, idx) => (
						<div
							key={idx}
							className="flex flex-col items-center text-center gap-2"
						>
							<span className="text-3xl md:text-4xl font-bold text-slate-900">
								{stat.value}
							</span>
							<span className="text-sm font-medium text-slate-500">{stat.label}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
