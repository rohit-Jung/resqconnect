'use client';

import {
  Ambulance,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Flame,
  LifeBuoy,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useOrgDeleteProvider,
  useOrgServiceProvider,
  useOrgVerifyProvider,
} from '@/services/service-provider/auth.api';
import { ServiceStatus, ServiceType } from '@/types/auth.types';

const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance className="h-5 w-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  fire_truck: {
    label: 'Fire Truck',
    icon: <Flame className="h-5 w-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  police: {
    label: 'Police',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  rescue_team: {
    label: 'Rescue Team',
    icon: <LifeBuoy className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
};

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; bgColor: string }
> = {
  available: {
    label: 'Available',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  assigned: {
    label: 'On Assignment',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  off_duty: {
    label: 'Off Duty',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
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
    if (confirm('Are you sure you want to delete this service provider?')) {
      await deleteMutation.mutateAsync(id);
      router.push('/dashboard/service-providers');
    }
  };

  const handleVerify = async () => {
    await verifyMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-xl font-semibold">Provider not found</h2>
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
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/service-providers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            <div className="mt-1 flex items-center gap-2">
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
            <Button variant="outline" className="gap-2">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Contact Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <Mail className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="font-medium">{provider.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <Phone className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p className="font-medium">{provider.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="bg-muted rounded-lg p-2">
                  <MapPin className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p className="font-medium">{provider.primaryAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <User className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Age</p>
                  <p className="font-medium">
                    {provider.age || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <Calendar className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Joined</p>
                  <p className="font-medium">
                    {provider.createdAt
                      ? new Date(provider.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {provider.serviceArea && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="bg-muted rounded-lg p-2">
                    <MapPin className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Service Area
                    </p>
                    <p className="font-medium">{provider.serviceArea}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {provider.vehicleInformation && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="mb-4 text-lg font-semibold">
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Type</p>
                  <p className="font-medium">
                    {provider.vehicleInformation.type || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Number</p>
                  <p className="font-medium">
                    {provider.vehicleInformation.number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Model</p>
                  <p className="font-medium">
                    {provider.vehicleInformation.model || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Color</p>
                  <p className="font-medium">
                    {provider.vehicleInformation.color || 'N/A'}
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
            <div className="bg-primary/10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
              <span className="text-primary text-3xl font-bold">
                {provider.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{provider.name}</h3>
            <p className="text-muted-foreground text-sm">{typeConfig.label}</p>
          </div>

          {/* Verification Status */}
          <div className="bg-card rounded-xl border p-6">
            <h3 className="mb-4 font-semibold">Verification Status</h3>
            <div className="flex items-center gap-3">
              {provider.isVerified ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Verified</p>
                    <p className="text-muted-foreground text-sm">
                      Account is verified
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-700">Not Verified</p>
                    <p className="text-muted-foreground text-sm">
                      Pending verification
                    </p>
                  </div>
                </>
              )}
            </div>
            {!provider.isVerified && (
              <Button
                className="mt-4 w-full"
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Verify Now
              </Button>
            )}
          </div>

          {/* Activity */}
          <div className="bg-card rounded-xl border p-6">
            <h3 className="mb-4 font-semibold">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="text-muted-foreground h-4 w-4" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>{' '}
                  <span className="font-medium">
                    {provider.updatedAt
                      ? new Date(provider.updatedAt).toLocaleDateString()
                      : 'N/A'}
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
