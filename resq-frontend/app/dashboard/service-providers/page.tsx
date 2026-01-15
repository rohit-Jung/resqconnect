"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Users,
	Plus,
	Search,
	MoreVertical,
	Eye,
	Edit,
	Trash2,
	CheckCircle,
	XCircle,
	Loader2,
	Ambulance,
	Flame,
	Shield,
	LifeBuoy,
	Phone,
	Mail,
	MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	useOrgServiceProviders,
	useOrgDeleteProvider,
	useOrgVerifyProvider,
} from "@/services/service-provider/auth.api";
import { ServiceType, ServiceStatus } from "@/types/auth.types";

const SERVICE_TYPE_CONFIG: Record<
	ServiceType,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	ambulance: {
		label: "Ambulance",
		icon: <Ambulance className="h-4 w-4" />,
		color: "text-red-500",
	},
	fire_truck: {
		label: "Fire Truck",
		icon: <Flame className="h-4 w-4" />,
		color: "text-orange-500",
	},
	police: {
		label: "Police",
		icon: <Shield className="h-4 w-4" />,
		color: "text-blue-500",
	},
	rescue_team: {
		label: "Rescue Team",
		icon: <LifeBuoy className="h-4 w-4" />,
		color: "text-green-500",
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

export default function ServiceProvidersPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [filterType, setFilterType] = useState<string>("all");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

	const { data: providersData, isLoading, refetch } = useOrgServiceProviders();
	const deleteMutation = useOrgDeleteProvider();
	const verifyMutation = useOrgVerifyProvider();

	const providers = providersData?.data?.data || [];

	// Filter providers
	const filteredProviders = providers.filter((provider) => {
		const matchesSearch =
			provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			provider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			provider.phoneNumber.toString().includes(searchQuery);
		const matchesStatus =
			filterStatus === "all" || provider.serviceStatus === filterStatus;
		const matchesType = filterType === "all" || provider.serviceType === filterType;
		return matchesSearch && matchesStatus && matchesType;
	});

	const handleDelete = async (id: string) => {
		if (deleteId === id) {
			await deleteMutation.mutateAsync(id);
			setDeleteId(null);
		} else {
			setDeleteId(id);
		}
	};

	const handleVerify = async (id: string) => {
		await verifyMutation.mutateAsync(id);
		setActiveDropdown(null);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Service Providers</h1>
					<p className="text-muted-foreground">
						Manage your organization&apos;s service providers
					</p>
				</div>
				<Link href="/dashboard/service-providers/new">
					<Button className="gap-2">
						<Plus className="h-4 w-4" />
						Add Provider
					</Button>
				</Link>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-card rounded-xl p-4 border">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Users className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Total Providers</p>
							<p className="text-2xl font-bold">{providers.length}</p>
						</div>
					</div>
				</div>
				<div className="bg-card rounded-xl p-4 border">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 rounded-lg">
							<CheckCircle className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Available</p>
							<p className="text-2xl font-bold">
								{providers.filter((p) => p.serviceStatus === "available").length}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-card rounded-xl p-4 border">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-yellow-100 rounded-lg">
							<Loader2 className="h-5 w-5 text-yellow-600" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">On Assignment</p>
							<p className="text-2xl font-bold">
								{providers.filter((p) => p.serviceStatus === "assigned").length}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-card rounded-xl p-4 border">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gray-100 rounded-lg">
							<XCircle className="h-5 w-5 text-gray-600" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Off Duty</p>
							<p className="text-2xl font-bold">
								{providers.filter((p) => p.serviceStatus === "off_duty").length}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by name, email, or phone..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
				<select
					value={filterStatus}
					onChange={(e) => setFilterStatus(e.target.value)}
					className="px-3 py-2 rounded-md border bg-background text-sm"
				>
					<option value="all">All Status</option>
					<option value="available">Available</option>
					<option value="assigned">On Assignment</option>
					<option value="off_duty">Off Duty</option>
				</select>
				<select
					value={filterType}
					onChange={(e) => setFilterType(e.target.value)}
					className="px-3 py-2 rounded-md border bg-background text-sm"
				>
					<option value="all">All Types</option>
					<option value="ambulance">Ambulance</option>
					<option value="fire_truck">Fire Truck</option>
					<option value="police">Police</option>
					<option value="rescue_team">Rescue Team</option>
				</select>
			</div>

			{/* Providers List */}
			<div className="bg-card rounded-xl border overflow-hidden">
				{filteredProviders.length === 0 ? (
					<div className="p-8 text-center">
						<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium mb-2">No service providers found</h3>
						<p className="text-muted-foreground mb-4">
							{searchQuery || filterStatus !== "all" || filterType !== "all"
								? "Try adjusting your filters"
								: "Get started by adding your first service provider"}
						</p>
						{!searchQuery && filterStatus === "all" && filterType === "all" && (
							<Link href="/dashboard/service-providers/new">
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Add Provider
								</Button>
							</Link>
						)}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-muted/50">
								<tr>
									<th className="text-left px-4 py-3 text-sm font-medium">Provider</th>
									<th className="text-left px-4 py-3 text-sm font-medium">Contact</th>
									<th className="text-left px-4 py-3 text-sm font-medium">
										Service Type
									</th>
									<th className="text-left px-4 py-3 text-sm font-medium">Status</th>
									<th className="text-left px-4 py-3 text-sm font-medium">Verified</th>
									<th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{filteredProviders.map((provider) => {
									const typeConfig = SERVICE_TYPE_CONFIG[provider.serviceType];
									const statusConfig = STATUS_CONFIG[provider.serviceStatus];

									return (
										<tr
											key={provider.id}
											className="hover:bg-muted/30"
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
														<span className="font-medium text-primary">
															{provider.name.charAt(0).toUpperCase()}
														</span>
													</div>
													<div>
														<p className="font-medium">{provider.name}</p>
														<p className="text-sm text-muted-foreground flex items-center gap-1">
															<MapPin className="h-3 w-3" />
															{provider.primaryAddress}
														</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-3">
												<div className="space-y-1">
													<p className="text-sm flex items-center gap-1">
														<Mail className="h-3 w-3 text-muted-foreground" />
														{provider.email}
													</p>
													<p className="text-sm flex items-center gap-1">
														<Phone className="h-3 w-3 text-muted-foreground" />
														{provider.phoneNumber}
													</p>
												</div>
											</td>
											<td className="px-4 py-3">
												<div className={`flex items-center gap-2 ${typeConfig.color}`}>
													{typeConfig.icon}
													<span className="text-sm font-medium">{typeConfig.label}</span>
												</div>
											</td>
											<td className="px-4 py-3">
												<Badge
													variant="secondary"
													className={`${statusConfig.bgColor} ${statusConfig.color}`}
												>
													{statusConfig.label}
												</Badge>
											</td>
											<td className="px-4 py-3">
												{provider.isVerified ? (
													<CheckCircle className="h-5 w-5 text-green-500" />
												) : (
													<XCircle className="h-5 w-5 text-yellow-500" />
												)}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="relative inline-block">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															setActiveDropdown(
																activeDropdown === provider.id ? null : provider.id
															)
														}
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
													{activeDropdown === provider.id && (
														<div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10">
															<Link
																href={`/dashboard/service-providers/${provider.id}`}
																className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
															>
																<Eye className="h-4 w-4" />
																View Details
															</Link>
															<Link
																href={`/dashboard/service-providers/${provider.id}/edit`}
																className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
															>
																<Edit className="h-4 w-4" />
																Edit
															</Link>
															{!provider.isVerified && (
																<button
																	onClick={() => handleVerify(provider.id)}
																	className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-green-600"
																	disabled={verifyMutation.isPending}
																>
																	<CheckCircle className="h-4 w-4" />
																	{verifyMutation.isPending ? "Verifying..." : "Verify"}
																</button>
															)}
															<button
																onClick={() => handleDelete(provider.id)}
																className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-red-600"
															>
																<Trash2 className="h-4 w-4" />
																{deleteId === provider.id ? "Confirm Delete" : "Delete"}
															</button>
														</div>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
