import { ShieldCheck, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";

export function Footer() {
	return (
		<footer className="bg-slate-900 text-slate-300 py-20">
			<div className="container mx-auto px-6 sm:px-8 lg:px-12">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
					<div className="space-y-6">
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center rounded-lg bg-primary p-1 text-primary-foreground">
								<ShieldCheck className="h-6 w-6" />
							</div>
							<span className="text-xl font-bold tracking-tight text-white">
								ResQ <span className="text-primary">Connect</span>
							</span>
						</div>
						<p className="text-sm leading-relaxed max-w-xs">
							Your trusted emergency response companion. Always ready, always reliable,
							always there when you need us most.
						</p>
						<div className="flex items-center gap-4">
							<Link
								href="#"
								className="hover:text-white transition-colors"
							>
								<Facebook className="h-5 w-5" />
							</Link>
							<Link
								href="#"
								className="hover:text-white transition-colors"
							>
								<Twitter className="h-5 w-5" />
							</Link>
							<Link
								href="#"
								className="hover:text-white transition-colors"
							>
								<Instagram className="h-5 w-5" />
							</Link>
							<Link
								href="#"
								className="hover:text-white transition-colors"
							>
								<Linkedin className="h-5 w-5" />
							</Link>
						</div>
					</div>

					<div>
						<h4 className="text-white font-bold mb-6">Product</h4>
						<ul className="space-y-4 text-sm">
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Features
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Pricing
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Security
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Updates
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-bold mb-6">Company</h4>
						<ul className="space-y-4 text-sm">
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Careers
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Press
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Contact
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-bold mb-6">Support</h4>
						<ul className="space-y-4 text-sm">
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Help Center
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Safety Tips
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Privacy
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-white transition-colors"
								>
									Terms
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-slate-800 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
					<p>© 2025 ResQConnect. All rights reserved.</p>
					<div className="flex gap-8">
						<Link
							href="#"
							className="hover:text-white transition-colors"
						>
							Privacy Policy
						</Link>
						<Link
							href="#"
							className="hover:text-white transition-colors"
						>
							Terms of Service
						</Link>
						<Link
							href="#"
							className="hover:text-white transition-colors"
						>
							Cookie Policy
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
