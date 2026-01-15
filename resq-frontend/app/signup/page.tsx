"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Building2,
	Mail,
	Lock,
	Eye,
	EyeOff,
	Loader2,
	Phone,
	Ambulance,
	Flame,
	Shield,
	HeartPulse,
	AlertTriangle,
	LifeBuoy,
} from "lucide-react";
import {
	orgRegisterFormSchema,
	TOrgRegisterForm,
	ServiceCategory,
} from "@/validations/org.schema";
import { useOrgRegister } from "@/services/organization/auth.api";

const serviceCategories: {
	value: ServiceCategory;
	label: string;
	icon: React.ReactNode;
}[] = [
	{
		value: "ambulance",
		label: "Ambulance Service",
		icon: <Ambulance className="h-4 w-4" />,
	},
	{
		value: "fire",
		label: "Fire Department",
		icon: <Flame className="h-4 w-4" />,
	},
	{
		value: "police",
		label: "Police Department",
		icon: <Shield className="h-4 w-4" />,
	},
	{
		value: "medical",
		label: "Medical Services",
		icon: <HeartPulse className="h-4 w-4" />,
	},
	{
		value: "disaster_response",
		label: "Disaster Response",
		icon: <AlertTriangle className="h-4 w-4" />,
	},
	{
		value: "rescue",
		label: "Rescue Services",
		icon: <LifeBuoy className="h-4 w-4" />,
	},
];

export default function OrgSignupPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [termsAccepted, setTermsAccepted] = useState(false);
	const router = useRouter();
	const registerMutation = useOrgRegister();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<TOrgRegisterForm>({
		resolver: zodResolver(orgRegisterFormSchema),
		defaultValues: {
			name: "",
			serviceCategory: "ambulance",
			email: "",
			generalNumber: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = (data: TOrgRegisterForm) => {
		if (!termsAccepted) {
			return;
		}

		// Transform form data to API format
		const apiData = {
			name: data.name,
			serviceCategory: data.serviceCategory,
			email: data.email,
			generalNumber: parseInt(data.generalNumber, 10),
			password: data.password,
		};

		registerMutation.mutate(apiData, {
			onSuccess: (response) => {
				const userId = response.data.data?.userId;
				if (userId) {
					router.push(`/verify?userId=${userId}`);
				} else {
					router.push("/login");
				}
			},
			onError: (error) => {
				console.error("Registration failed:", error);
			},
		});
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Side - Primary Color Gradient */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#E63946] to-[#9B2C35] text-white flex-col justify-between p-12">
				<div className="flex flex-col items-center justify-center flex-1 text-center">
					<div className="flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm p-6 mb-6">
						<Building2 className="h-16 w-16" />
					</div>
					<h1 className="text-5xl font-bold mb-2">ResqConnect</h1>
					<p className="text-xl mb-8 opacity-90">Organization Portal</p>

					<p className="text-lg max-w-md mb-12 leading-relaxed opacity-90">
						Register your emergency service organization and become part of our
						life-saving network. Coordinate faster, respond smarter.
					</p>

					{/* Service Icons */}
					<div className="flex gap-8 mb-12">
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-white/10 rounded-xl">
								<Ambulance className="h-8 w-8" />
							</div>
							<span className="text-xs opacity-75">Ambulance</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-white/10 rounded-xl">
								<Flame className="h-8 w-8" />
							</div>
							<span className="text-xs opacity-75">Fire</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-white/10 rounded-xl">
								<Shield className="h-8 w-8" />
							</div>
							<span className="text-xs opacity-75">Police</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-white/10 rounded-xl">
								<HeartPulse className="h-8 w-8" />
							</div>
							<span className="text-xs opacity-75">Medical</span>
						</div>
					</div>

					<div className="flex gap-16">
						<div className="flex flex-col items-center">
							<p className="text-4xl font-bold mb-1">500+</p>
							<p className="text-sm opacity-90">Organizations</p>
						</div>
						<div className="flex flex-col items-center">
							<p className="text-4xl font-bold mb-1">10K+</p>
							<p className="text-sm opacity-90">Responders</p>
						</div>
						<div className="flex flex-col items-center">
							<p className="text-4xl font-bold mb-1">50K+</p>
							<p className="text-sm opacity-90">Lives Saved</p>
						</div>
					</div>
				</div>
			</div>

			{/* Right Side - Signup Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-muted/30 overflow-y-auto min-h-screen">
				<div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 my-4">
					<div className="mb-4 text-center">
						<div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-lg mb-3">
							<Building2 className="h-5 w-5 text-[#E63946]" />
						</div>
						<h2 className="text-2xl font-bold mb-1">Register Organization</h2>
						<p className="text-muted-foreground text-sm">
							Join the emergency response network
						</p>
					</div>

					{registerMutation.isError && (
						<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
							{registerMutation.error?.message ||
								"Registration failed. Please try again."}
						</div>
					)}

					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-3"
					>
						<div className="space-y-1">
							<Label htmlFor="name">Organization Name</Label>
							<div className="relative">
								<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="name"
									type="text"
									placeholder="City Fire Department"
									className="pl-10"
									{...register("name")}
								/>
							</div>
							{errors.name && (
								<p className="text-xs text-red-500">{errors.name.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="serviceCategory">Service Category</Label>
							<Controller
								name="serviceCategory"
								control={control}
								render={({ field }) => (
									<div className="grid grid-cols-3 gap-1.5">
										{serviceCategories.map((category) => (
											<button
												key={category.value}
												type="button"
												onClick={() => field.onChange(category.value)}
												className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs transition-all ${
													field.value === category.value
														? "border-[#E63946] bg-red-50 text-[#E63946]"
														: "border-border hover:border-[#E63946]/50 hover:bg-muted/50"
												}`}
											>
												{category.icon}
												<span className="truncate">{category.label.split(" ")[0]}</span>
											</button>
										))}
									</div>
								)}
							/>
							{errors.serviceCategory && (
								<p className="text-xs text-red-500">{errors.serviceCategory.message}</p>
							)}
						</div>

						<div className="space-y-1">
							<Label htmlFor="email">Organization Email</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder="contact@organization.com"
									className="pl-10"
									{...register("email")}
								/>
							</div>
							{errors.email && (
								<p className="text-xs text-red-500">{errors.email.message}</p>
							)}
						</div>

						<div className="space-y-1">
							<Label htmlFor="generalNumber">Emergency Contact Number</Label>
							<div className="relative">
								<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="generalNumber"
									type="tel"
									placeholder="102"
									className="pl-10"
									{...register("generalNumber")}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Emergency number (e.g., 100, 101, 102)
							</p>
							{errors.generalNumber && (
								<p className="text-xs text-red-500">{errors.generalNumber.message}</p>
							)}
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="Password"
										className="pl-10 pr-10"
										{...register("password")}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
								{errors.password && (
									<p className="text-xs text-red-500">{errors.password.message}</p>
								)}
							</div>

							<div className="space-y-1">
								<Label htmlFor="confirmPassword">Confirm</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? "text" : "password"}
										placeholder="Confirm"
										className="pl-10 pr-10"
										{...register("confirmPassword")}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{showConfirmPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
								{errors.confirmPassword && (
									<p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
								)}
							</div>
						</div>

						<div className="flex items-start gap-2">
							<Checkbox
								id="terms"
								checked={termsAccepted}
								onCheckedChange={(checked) => setTermsAccepted(checked === true)}
								className="mt-0.5"
							/>
							<Label
								htmlFor="terms"
								className="text-xs font-normal cursor-pointer"
							>
								I agree to the{" "}
								<Link
									href="/terms"
									className="text-[#E63946] hover:underline"
								>
									Terms
								</Link>
								,{" "}
								<Link
									href="/privacy"
									className="text-[#E63946] hover:underline"
								>
									Privacy
								</Link>{" "}
								&{" "}
								<Link
									href="/organization-agreement"
									className="text-[#E63946] hover:underline"
								>
									Organization Agreement
								</Link>
							</Label>
						</div>

						<Button
							type="submit"
							className="w-full h-10 text-sm bg-[#E63946] hover:bg-[#9B2C35]"
							disabled={registerMutation.isPending || !termsAccepted}
						>
							{registerMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Registering...
								</>
							) : (
								"Register Organization"
							)}
						</Button>
					</form>

					<div className="mt-4 text-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								href="/login"
								className="text-[#E63946] hover:underline font-medium"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
