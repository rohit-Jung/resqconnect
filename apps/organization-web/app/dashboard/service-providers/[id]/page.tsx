'use client';

import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';

import {
  AlertCircle,
  Ambulance,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
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
    color: 'text-[#C44536]',
    bgColor: 'bg-[#C44536]/10',
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
    color: 'text-[#888888]',
    bgColor: 'bg-[#E8E6E1]',
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

  const responder = providerData?.data?.data;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this responder?')) {
      await deleteMutation.mutateAsync(id);
      router.push('/dashboard/service-providers');
    }
  };

  const handleVerify = async () => {
    await verifyMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin dark:text-primary" />
      </div>
    );
  }

  if (!responder) {
    return (
      <div className="min-h-screen bg-background dark:bg-background px-6 py-12">
        <h2 className="mb-2 text-xl font-semibold text-foreground dark:text-foreground">
          Responder not found
        </h2>
        <p className="text-muted-foreground mb-4 dark:text-muted-foreground">
          The responder you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/dashboard/service-providers">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none">
            Back to Responders
          </Button>
        </Link>
      </div>
    );
  }

  const typeConfig = SERVICE_TYPE_CONFIG[responder.serviceType];
  const statusConfig = STATUS_CONFIG[responder.serviceStatus];

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background dark:bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/service-providers">
              <Button
                variant="ghost"
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-foreground dark:text-foreground">
                RESQ
              </span>
              <span className="text-xl font-bold text-primary dark:text-primary">
                .
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/service-providers/${id}/edit`}>
              <Button
                variant="outline"
                className="gap-2 border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-none dark:text-muted-foreground"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 border-border text-primary hover:bg-primary hover:text-primary-foreground rounded-none"
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
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
              {responder.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                className={`${typeConfig.bgColor} ${typeConfig.color} rounded-none border-0`}
              >
                {typeConfig.icon}
                <span className="ml-1">{typeConfig.label}</span>
              </Badge>
              <Badge
                className={`${statusConfig.bgColor} ${statusConfig.color} rounded-none border-0`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact Information */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg p-2">
                    <Mail className="text-muted-foreground h-5 w-5 dark:text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Email
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg p-2">
                    <Phone className="text-muted-foreground h-5 w-5 dark:text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Phone
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.phoneNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="bg-muted rounded-lg p-2">
                    <MapPin className="text-muted-foreground h-5 w-5 dark:text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Address
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.primaryAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg p-2">
                    <User className="text-muted-foreground h-5 w-5 dark:text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Age
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.age || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg p-2">
                    <Calendar className="text-muted-foreground h-5 w-5 dark:text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Joined
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.createdAt
                        ? new Date(responder.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {responder.serviceArea && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="bg-muted rounded-lg p-2">
                      <MapPin className="text-muted-foreground h-5 w-5 dark:text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                        Service Area
                      </p>
                      <p className="font-medium text-foreground dark:text-foreground">
                        {responder.serviceArea}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            {responder.vehicleInformation && (
              <div className="bg-card rounded-xl border p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                  Vehicle Information
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Type
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.vehicleInformation.type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Number
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.vehicleInformation.number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Model
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.vehicleInformation.model || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Color
                    </p>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {responder.vehicleInformation.color || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Section */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground dark:text-foreground">
                  Verification Documents
                </h2>
                <Badge
                  className={`rounded-none border-0 ${
                    responder.documentStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : responder.documentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : responder.documentStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {responder.documentStatus === 'approved'
                    ? 'Approved'
                    : responder.documentStatus === 'pending'
                      ? 'Pending'
                      : responder.documentStatus === 'rejected'
                        ? 'Rejected'
                        : 'Not Submitted'}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* PAN Card */}
                <div className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      PAN Card
                    </p>
                    {responder.panCardUrl && (
                      <a
                        href={responder.panCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    )}
                  </div>
                  <p className="font-medium text-foreground dark:text-foreground">
                    {responder.panCardUrl ? (
                      <a
                        href={responder.panCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        Not uploaded
                      </span>
                    )}
                  </p>
                </div>

                {/* Citizenship Document */}
                <div className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                      Citizenship Document
                    </p>
                    {responder.citizenshipUrl && (
                      <a
                        href={responder.citizenshipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    )}
                  </div>
                  <p className="font-medium text-foreground dark:text-foreground">
                    {responder.citizenshipUrl ? (
                      <a
                        href={responder.citizenshipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        Not uploaded
                      </span>
                    )}
                  </p>
                </div>

                {/* Rejection Reason */}
                {responder.documentStatus === 'rejected' &&
                  responder.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            {responder.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Verification Info */}
                {responder.documentStatus === 'approved' &&
                  responder.verifiedAt && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Verified on{' '}
                            {new Date(
                              responder.verifiedAt
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-green-700">
                            By: {responder.verifiedBy || 'System'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-card rounded-xl border p-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
                <span className="text-primary text-3xl font-bold">
                  {responder.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                {responder.name}
              </h3>
              <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                {typeConfig.label}
              </p>
            </div>

            {/* Verification Status */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="mb-4 font-semibold text-foreground dark:text-foreground">
                Verification Status
              </h3>
              <div className="flex items-center gap-3">
                {responder.isVerified ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Verified
                      </p>
                      <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                        Account is verified
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">
                        Not Verified
                      </p>
                      <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                        Pending verification
                      </p>
                    </div>
                  </>
                )}
              </div>
              {!responder.isVerified && (
                <Button
                  className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-none"
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
              <h3 className="mb-4 font-semibold text-foreground dark:text-foreground">
                Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="text-muted-foreground h-4 w-4 dark:text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-muted-foreground dark:text-muted-foreground">
                      Last Updated:
                    </span>{' '}
                    <span className="font-medium text-foreground dark:text-foreground">
                      {responder.updatedAt
                        ? new Date(responder.updatedAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
