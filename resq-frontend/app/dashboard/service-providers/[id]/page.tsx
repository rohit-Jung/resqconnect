"use client";

import { use } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	Loader2,
	Edit,
	Trash2,
	User,
	Mail,
	Phone,
	MapPin,
	Shield,
	Ambulance,
	Flame,
	LifeBuoy,
	CheckCircle,
	XCircle,
	Calendar,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	useOrgServiceProvider,
	useOrgDeleteProvider,
	useOrgVerifyProvider,
} from "@/services/service-provider/auth.api";
import { useRouter } from "next/navigation";
import { ServiceType, ServiceStatus } from "@/types/auth.types";

const SERVICE_TYPE_CONFIG: Record<
	ServiceType,
	{ label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
	ambulance: {
		label: "Ambulance",
		icon: <Ambulance className="h-5 w-5" />,
		color: "text-red-600",
		bgColor: "bg-red-100",
	},
	fire_truck: {
		label: "Fire Truck",
		icon: <Flame className="h-5 w-5" />,
		color: "text-orange-600",
		bgColor: "bg-orange-100",
	},
	police: {
		label: "Police",
		icon: <Shield className="h-5 w-5" />,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	rescue_team: {
		label: "Rescue Team",
		icon: <LifeBuoy className="h-5 w-5" />,
		color: "text-green-600",
		bgColor: "bg-green-100",
	},
};

const STATUS_CONFIG: Record<
	ServiceStatus,
	{ label: string; color: string; bgColor: string }
> = {
	available: { label: "Available", color: "text-green-700", bgColor: "bg-green-100" },
	assigned: {
		label: "On Assignment",
		color: "text-yellow-700",
		bgColor: "bg-yellow-100",
	},
	off_duty: { label: "Off Duty", color: "text-gray-700", bgColor: "bg-gray-100" },
};

export default function ServiceProviderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();

	const { data: providerData, isLoading } = useOrgServiceProvider(id);
	const deleteMutation = useOrgDeleteProvider();
	const verifyMutation = useOrgVerifyProvider();

	const provider = providerData?.data?.data;

	const handleDelete = async () => {
		if (confirm("Are you sure you want to delete this service provider?")) {
			await deleteMutation.mutateAsync(id);
			router.push("/dashboard/service-providers");
		}
	};

	const handleVerify = async () => {
		await verifyMutation.mutateAsync(id);
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

	const typeConfig = SERVICE_TYPE_CONFIG[provider.serviceType];
	const statusConfig = STATUS_CONFIG[provider.serviceStatus];

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Link href="/dashboard/service-providers">
						<Button
							variant="ghost"
							size="icon"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-bold">{provider.name}</h1>
						<div className="flex items-center gap-2 mt-1">
							<Badge
								variant="secondary"
								className={`${typeConfig.bgColor} ${typeConfig.color}`}
							>
								{typeConfig.icon}
								<span className="ml-1">{typeConfig.label}</span>
							</Badge>
							<Badge
								variant="secondary"
								className={`${statusConfig.bgColor} ${statusConfig.color}`}
							>
								{statusConfig.label}
							</Badge>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Link href={`/dashboard/service-providers/${id}/edit`}>
						<Button
							variant="outline"
							className="gap-2"
						>
							<Edit className="h-4 w-4" />
							Edit
						</Button>
					</Link>
					<Button
						variant="destructive"
						className="gap-2"
						onClick={handleDelete}
						disabled={deleteMutation.isPending}
					>
						{deleteMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
						Delete
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Info */}
				<div className="lg:col-span-2 space-y-6">
					{/* Contact Information */}
					<div className="bg-card rounded-xl border p-6">
						<h2 className="text-lg font-semibold mb-4">Contact Information</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-muted rounded-lg">
									<Mail className="h-5 w-5 text-muted-foreground" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Email</p>
									<p className="font-medium">{provider.email}</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-muted rounded-lg">
									<Phone className="h-5 w-5 text-muted-foreground" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Phone</p>
									<p className="font-medium">{provider.phoneNumber}</p>
								</div>
							</div>
							<div className="flex items-center gap-3 sm:col-span-2">
								<div className="p-2 bg-muted rounded-lg">
									<MapPin className="h-5 w-5 text-muted-foreground" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Address</p>
									<p className="font-medium">{provider.primaryAddress}</p>
								</div>
							</div>
						</div>
					</div>

					{/* Personal Information */}
					<div className="bg-card rounded-xl border p-6">
						<h2 className="text-lg font-semibold mb-4">Personal Information</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-muted rounded-lg">
									<User className="h-5 w-5 text-muted-foreground" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Age</p>
									<p className="font-medium">{provider.age || "Not specified"}</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-muted rounded-lg">
									<Calendar className="h-5 w-5 text-muted-foreground" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Joined</p>
									<p className="font-medium">
										{provider.createdAt
											? new Date(provider.createdAt).toLocaleDateString()
											: "N/A"}
									</p>
								</div>
							</div>
							{provider.serviceArea && (
								<div className="flex items-center gap-3 sm:col-span-2">
									<div className="p-2 bg-muted rounded-lg">
										<MapPin className="h-5 w-5 text-muted-foreground" />
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Service Area</p>
										<p className="font-medium">{provider.serviceArea}</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Vehicle Information */}
					{provider.vehicleInformation && (
						<div className="bg-card rounded-xl border p-6">
							<h2 className="text-lg font-semibold mb-4">Vehicle Information</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Type</p>
									<p className="font-medium">
										{provider.vehicleInformation.type || "N/A"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Number</p>
									<p className="font-medium">
										{provider.vehicleInformation.number || "N/A"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Model</p>
									<p className="font-medium">
										{provider.vehicleInformation.model || "N/A"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Color</p>
									<p className="font-medium">
										{provider.vehicleInformation.color || "N/A"}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Profile Card */}
					<div className="bg-card rounded-xl border p-6 text-center">
						<div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
							<span className="text-3xl font-bold text-primary">
								{provider.name.charAt(0).toUpperCase()}
							</span>
						</div>
						<h3 className="text-lg font-semibold">{provider.name}</h3>
						<p className="text-sm text-muted-foreground">{typeConfig.label}</p>
					</div>

					{/* Verification Status */}
					<div className="bg-card rounded-xl border p-6">
						<h3 className="font-semibold mb-4">Verification Status</h3>
						<div className="flex items-center gap-3">
							{provider.isVerified ? (
								<>
									<CheckCircle className="h-8 w-8 text-green-500" />
									<div>
										<p className="font-medium text-green-700">Verified</p>
										<p className="text-sm text-muted-foreground">Account is verified</p>
									</div>
								</>
							) : (
								<>
									<XCircle className="h-8 w-8 text-yellow-500" />
									<div>
										<p className="font-medium text-yellow-700">Not Verified</p>
										<p className="text-sm text-muted-foreground">Pending verification</p>
									</div>
								</>
							)}
						</div>
						{!provider.isVerified && (
							<Button
								className="w-full mt-4"
								onClick={handleVerify}
								disabled={verifyMutation.isPending}
							>
								{verifyMutation.isPending ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<CheckCircle className="h-4 w-4 mr-2" />
								)}
								Verify Now
							</Button>
						)}
					</div>

					{/* Activity */}
					<div className="bg-card rounded-xl border p-6">
						<h3 className="font-semibold mb-4">Activity</h3>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<div className="text-sm">
									<span className="text-muted-foreground">Last Updated:</span>{" "}
									<span className="font-medium">
										{provider.updatedAt
											? new Date(provider.updatedAt).toLocaleDateString()
											: "N/A"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
