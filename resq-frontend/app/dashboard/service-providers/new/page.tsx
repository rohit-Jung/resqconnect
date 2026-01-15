"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowLeft,
	Loader2,
	User,
	Mail,
	Phone,
	MapPin,
	Lock,
	Ambulance,
	Flame,
	Shield,
	LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrgRegisterProvider } from "@/services/service-provider/auth.api";
import {
	serviceProviderRegisterFormSchema,
	type TServiceProviderRegisterForm,
	type ServiceType,
} from "@/validations/service-provider.schema";

const SERVICE_TYPES: {
	value: ServiceType;
	label: string;
	icon: React.ReactNode;
	description: string;
}[] = [
	{
		value: "ambulance",
		label: "Ambulance",
		icon: <Ambulance className="h-6 w-6" />,
		description: "Emergency medical transport services",
	},
	{
		value: "fire_truck",
		label: "Fire Truck",
		icon: <Flame className="h-6 w-6" />,
		description: "Fire fighting and rescue services",
	},
	{
		value: "police",
		label: "Police",
		icon: <Shield className="h-6 w-6" />,
		description: "Law enforcement and security",
	},
	{
		value: "rescue_team",
		label: "Rescue Team",
		icon: <LifeBuoy className="h-6 w-6" />,
		description: "Search and rescue operations",
	},
];

export default function NewServiceProviderPage() {
	const router = useRouter();
	const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
	const createMutation = useOrgRegisterProvider();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<TServiceProviderRegisterForm>({
		resolver: zodResolver(serviceProviderRegisterFormSchema),
	});

	const onSubmit = async (data: TServiceProviderRegisterForm) => {
		try {
			// Convert form data to API format
			const apiData = {
				...data,
				age: parseInt(data.age, 10),
				phoneNumber: parseInt(data.phoneNumber, 10),
			};
			await createMutation.mutateAsync(apiData);
			router.push("/dashboard/service-providers");
		} catch (error) {
			console.error("Error creating service provider:", error);
		}
	};

	const handleTypeSelect = (type: ServiceType) => {
		setSelectedType(type);
		setValue("serviceType", type);
	};

	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link href="/dashboard/service-providers">
					<Button
						variant="ghost"
						size="icon"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</Link>
				<div>
					<h1 className="text-2xl font-bold">Add New Service Provider</h1>
					<p className="text-muted-foreground">
						Register a new service provider for your organization
					</p>
				</div>
			</div>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="space-y-6"
			>
				{/* Service Type Selection */}
				<div className="bg-card rounded-xl border p-6">
					<h2 className="text-lg font-semibold mb-4">Service Type</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{SERVICE_TYPES.map((type) => (
							<button
								key={type.value}
								type="button"
								onClick={() => handleTypeSelect(type.value)}
								className={`p-4 rounded-xl border-2 text-left transition-all ${
									selectedType === type.value
										? "border-primary bg-primary/5"
										: "border-muted hover:border-primary/50"
								}`}
							>
								<div className="flex items-start gap-3">
									<div
										className={`p-2 rounded-lg ${
											selectedType === type.value
												? "bg-primary text-primary-foreground"
												: "bg-muted"
										}`}
									>
										{type.icon}
									</div>
									<div>
										<p className="font-medium">{type.label}</p>
										<p className="text-sm text-muted-foreground">{type.description}</p>
									</div>
								</div>
							</button>
						))}
					</div>
					{errors.serviceType && (
						<p className="text-sm text-destructive mt-2">{errors.serviceType.message}</p>
					)}
				</div>

				{/* Personal Information */}
				<div className="bg-card rounded-xl border p-6">
					<h2 className="text-lg font-semibold mb-4">Provider Information</h2>
					<div className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="name"
										placeholder="John Doe"
										className="pl-10"
										{...register("name")}
									/>
								</div>
								{errors.name && (
									<p className="text-sm text-destructive">{errors.name.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="email"
										type="email"
										placeholder="john@example.com"
										className="pl-10"
										{...register("email")}
									/>
								</div>
								{errors.email && (
									<p className="text-sm text-destructive">{errors.email.message}</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="age">Age</Label>
								<Input
									id="age"
									type="number"
									placeholder="25"
									{...register("age")}
								/>
								{errors.age && (
									<p className="text-sm text-destructive">{errors.age.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="phoneNumber">Phone Number</Label>
								<div className="relative">
									<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="phoneNumber"
										type="tel"
										placeholder="9841234567"
										className="pl-10"
										{...register("phoneNumber")}
									/>
								</div>
								{errors.phoneNumber && (
									<p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="primaryAddress">Primary Address</Label>
								<div className="relative">
									<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="primaryAddress"
										placeholder="Kathmandu, Nepal"
										className="pl-10"
										{...register("primaryAddress")}
									/>
								</div>
								{errors.primaryAddress && (
									<p className="text-sm text-destructive">
										{errors.primaryAddress.message}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Password */}
				<div className="bg-card rounded-xl border p-6">
					<h2 className="text-lg font-semibold mb-4">Account Security</h2>
					<p className="text-sm text-muted-foreground mb-4">
						Set a temporary password for the provider. They can change it after logging
						in.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									className="pl-10"
									{...register("password")}
								/>
							</div>
							{errors.password && (
								<p className="text-sm text-destructive">{errors.password.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="confirmPassword"
									type="password"
									placeholder="••••••••"
									className="pl-10"
									{...register("confirmPassword")}
								/>
							</div>
							{errors.confirmPassword && (
								<p className="text-sm text-destructive">
									{errors.confirmPassword.message}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Submit */}
				<div className="flex items-center justify-end gap-4">
					<Link href="/dashboard/service-providers">
						<Button
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
					</Link>
					<Button
						type="submit"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						Create Provider
					</Button>
				</div>
			</form>
		</div>
	);
}
