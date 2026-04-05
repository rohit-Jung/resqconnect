'use client';

import {
  Ambulance,
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Flame,
  LifeBuoy,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DocumentStatus,
  useProviderDocuments,
  useVerifyDocuments,
} from '@/services/verification/verification.api';
import { ServiceType } from '@/types/auth.types';

const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance className="h-5 w-5" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950',
  },
  fire_truck: {
    label: 'Fire Truck',
    icon: <Flame className="h-5 w-5" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
  },
  police: {
    label: 'Police',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
  },
  rescue_team: {
    label: 'Rescue Team',
    icon: <LifeBuoy className="h-5 w-5" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950',
  },
};

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  not_submitted: {
    label: 'Not Submitted',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: <Clock className="h-4 w-4" />,
  },
  pending: {
    label: 'Pending Review',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950',
    icon: <Clock className="h-4 w-4" />,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: providerData, isLoading } = useProviderDocuments(providerId);
  const verifyMutation = useVerifyDocuments();

  const provider = providerData?.data?.data?.provider;

  const handleApprove = async () => {
    await verifyMutation.mutateAsync({
      providerId,
      action: 'approve',
    });
    router.push('/dashboard/verifications');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    await verifyMutation.mutateAsync({
      providerId,
      action: 'reject',
      rejectionReason: rejectionReason.trim(),
    });

    setShowRejectModal(false);
    router.push('/dashboard/verifications');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin dark:text-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex h-64 flex-col items-center justify-center">
        <XCircle className="text-muted-foreground mb-4 h-12 w-12 dark:text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium text-foreground dark:text-foreground">
          Provider not found
        </h3>
        <Link href="/dashboard/verifications">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Verifications
          </Button>
        </Link>
      </div>
    );
  }

  const typeConfig = SERVICE_TYPE_CONFIG[provider.serviceType];
  const statusConfig = STATUS_CONFIG[provider.documentStatus];

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background dark:bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground dark:text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary dark:text-primary">
              .
            </span>
          </div>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/verifications">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">
                Document Review
              </h1>
              <p className="text-[#888888] dark:text-gray-400">
                Review and verify provider documents
              </p>
            </div>
          </div>
          <Badge
            className={`${statusConfig.bgColor} ${statusConfig.color} rounded-none`}
          >
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Provider Info */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Provider Information</h2>

            <div className="mb-6 flex items-center gap-4">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <User className="text-primary h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-semibold">{provider.name}</p>
                <div className={`flex items-center gap-1 ${typeConfig.color}`}>
                  {typeConfig.icon}
                  <span className="text-sm font-medium">
                    {typeConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{provider.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{provider.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  Submitted:{' '}
                  {new Date(provider.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {provider.documentStatus === 'rejected' &&
              provider.rejectionReason && (
                <div className="mt-6 rounded-lg bg-red-50 p-4">
                  <p className="mb-1 text-sm font-medium text-red-800">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700">
                    {provider.rejectionReason}
                  </p>
                </div>
              )}

            {provider.documentStatus === 'approved' && provider.verifiedAt && (
              <div className="mt-6 rounded-lg bg-green-50 p-4">
                <p className="mb-1 text-sm font-medium text-green-800">
                  Verified At
                </p>
                <p className="text-sm text-green-700">
                  {new Date(provider.verifiedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-card rounded-xl border p-6 lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Uploaded Documents</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* PAN Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">PAN Card</h3>
                  {provider.panCardUrl && (
                    <a
                      href={provider.panCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  )}
                </div>
                {provider.panCardUrl ? (
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-lg border"
                    onClick={() => setSelectedImage(provider.panCardUrl)}
                  >
                    <Image
                      src={provider.panCardUrl}
                      alt="PAN Card"
                      width={400}
                      height={250}
                      className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm font-medium text-white">
                        Click to enlarge
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed bg-gray-50">
                    <div className="text-center">
                      <XCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Not uploaded</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Citizenship */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Citizenship</h3>
                  {provider.citizenshipUrl && (
                    <a
                      href={provider.citizenshipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  )}
                </div>
                {provider.citizenshipUrl ? (
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-lg border"
                    onClick={() => setSelectedImage(provider.citizenshipUrl)}
                  >
                    <Image
                      src={provider.citizenshipUrl}
                      alt="Citizenship"
                      width={400}
                      height={250}
                      className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm font-medium text-white">
                        Click to enlarge
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed bg-gray-50">
                    <div className="text-center">
                      <XCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Not uploaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {provider.documentStatus === 'pending' && (
              <div className="mt-6 flex justify-end gap-3 border-t pt-6">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectModal(true)}
                  disabled={verifyMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Documents
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={verifyMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve Documents
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card w-full max-w-md rounded-xl p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold">Reject Documents</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Please provide a reason for rejecting the documents. This will
                be shared with the service provider so they can re-upload
                correct documents.
              </p>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g., PAN card image is blurry, Citizenship document expired..."
                className="bg-background mb-4 w-full rounded-lg border p-3 text-sm"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Reject Documents
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-h-full max-w-4xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-12 top-0 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <XCircle className="h-6 w-6" />
              </Button>
              <Image
                src={selectedImage}
                alt="Document"
                width={800}
                height={600}
                className="max-h-[80vh] w-auto rounded-lg object-contain"
                onClick={e => e.stopPropagation()}
              />
              <div className="mt-4 flex justify-center gap-2">
                <a
                  href={selectedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
                <a
                  href={selectedImage}
                  download
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                  onClick={e => e.stopPropagation()}
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
