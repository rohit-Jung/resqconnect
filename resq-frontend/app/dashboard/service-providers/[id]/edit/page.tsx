"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, User, MapPin, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	useOrgServiceProvider,
	useOrgUpdateProvider,
} from "@/services/service-provider/auth.api";
import {
	serviceProviderUpdateSchema,
	type TServiceProviderUpdate,
} from "@/validations/service-provider.schema";
import { ServiceStatus } from "@/types/auth.types";

const STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
	{ value: "available", label: "Available" },
	{ value: "assigned", label: "On Assignment" },
	{ value: "off_duty", label: "Off Duty" },
];

export default function EditServiceProviderPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();

	const { data: providerData, isLoading } = useOrgServiceProvider(id);
	const updateMutation = useOrgUpdateProvider();

	const provider = providerData?.data?.data;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<TServiceProviderUpdate>({
		resolver: zodResolver(serviceProviderUpdateSchema),
	});

	useEffect(() => {
		if (provider) {
			reset({
				name: provider.name,
				age: provider.age,
				primaryAddress: provider.primaryAddress,
				serviceArea: provider.serviceArea || undefined,
				vehicleInformation: provider.vehicleInformation || undefined,
			});
		}
	}, [provider, reset]);

	const onSubmit = async (data: TServiceProviderUpdate) => {
		try {
			await updateMutation.mutateAsync({ id, data });
			router.push(`/dashboard/service-providers/${id}`);
		} catch (error) {
			console.error("Error updating service provider:", error);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!provider) {
		return (
			<div className="text-center py-12">
				<h2 className="text-xl font-semibold mb-2">Provider not found</h2>
				<p className="text-muted-foreground mb-4">
					The service provider you&apos;re looking for doesn&apos;t exist.
				</p>
				<Link href="/dashboard/service-providers">
					<Button>Back to Providers</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link href={`/dashboard/service-providers/${id}`}>
					<Button
						variant="ghost"
						size="icon"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</Link>
				<div>
					<h1 className="text-2xl font-bold">Edit Service Provider</h1>
					<p className="text-muted-foreground">
						Update {provider.name}&apos;s information
					</p>
				</div>
			</div>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="space-y-6"
			>
				{/* Personal Information */}
				<div className="bg-card rounded-xl border p-6">
					<h2 className="text-lg font-semibold mb-4">Personal Information</h2>
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
								<Label htmlFor="age">Age</Label>
								<Input
									id="age"
									type="number"
									placeholder="25"
									{...register("age", { valueAsNumber: true })}
								/>
								{errors.age && (
									<p className="text-sm text-destructive">{errors.age.message}</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
							<div className="space-y-2">
								<Label htmlFor="serviceArea">Service Area</Label>
								<div className="relative">
									<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="serviceArea"
										placeholder="Kathmandu Valley"
										className="pl-10"
										{...register("serviceArea")}
									/>
								</div>
								{errors.serviceArea && (
									<p className="text-sm text-destructive">{errors.serviceArea.message}</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Vehicle Information */}
				<div className="bg-card rounded-xl border p-6">
					<h2 className="text-lg font-semibold mb-4">Vehicle Information (Optional)</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="vehicleType">Vehicle Type</Label>
							<div className="relative">
								<Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="vehicleType"
									placeholder="Ambulance"
									className="pl-10"
									{...register("vehicleInformation.type")}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="vehicleNumber">Vehicle Number</Label>
							<Input
								id="vehicleNumber"
								placeholder="BA 1 PA 1234"
								{...register("vehicleInformation.number")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="vehicleModel">Vehicle Model</Label>
							<Input
								id="vehicleModel"
								placeholder="Toyota HiAce"
								{...register("vehicleInformation.model")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="vehicleColor">Vehicle Color</Label>
							<Input
								id="vehicleColor"
								placeholder="White"
								{...register("vehicleInformation.color")}
							/>
						</div>
					</div>
				</div>

				{/* Read-only Info */}
				<div className="bg-muted/50 rounded-xl border p-6">
					<h2 className="text-lg font-semibold mb-4">Account Information (Read Only)</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Email</p>
							<p className="font-medium">{provider.email}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Phone Number</p>
							<p className="font-medium">{provider.phoneNumber}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Service Type</p>
							<p className="font-medium capitalize">
								{provider.serviceType.replace("_", " ")}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Verification Status</p>
							<p className="font-medium">
								{provider.isVerified ? "Verified" : "Not Verified"}
							</p>
						</div>
					</div>
				</div>

				{/* Submit */}
				<div className="flex items-center justify-end gap-4">
					<Link href={`/dashboard/service-providers/${id}`}>
						<Button
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
					</Link>
					<Button
						type="submit"
						disabled={updateMutation.isPending}
					>
						{updateMutation.isPending && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						Save Changes
					</Button>
				</div>
			</form>
		</div>
	);
}
