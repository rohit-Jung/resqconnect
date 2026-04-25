'use client';

import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';

import {
  Ambulance,
  CheckCircle,
  Clock,
  Eye,
  FileCheck,
  Flame,
  LifeBuoy,
  Loader2,
  Mail,
  Phone,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  usePendingVerifications,
  useVerifyDocuments,
} from '@/services/verification/verification.api';
import { ServiceType } from '@/types/auth.types';

const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance className="h-4 w-4" />,
    color: 'text-[#C44536]',
  },
  fire_truck: {
    label: 'Fire Truck',
    icon: <Flame className="h-4 w-4" />,
    color: 'text-orange-500',
  },
  police: {
    label: 'Police',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  rescue_team: {
    label: 'Rescue Team',
    icon: <LifeBuoy className="h-4 w-4" />,
    color: 'text-green-500',
  },
};

export default function VerificationsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: verificationsData, isLoading } = usePendingVerifications();
  const verifyMutation = useVerifyDocuments();

  const responders = verificationsData?.data?.data?.providers || [];
  const pendingCount = verificationsData?.data?.data?.count || 0;

  const handleApprove = async (providerId: string) => {
    await verifyMutation.mutateAsync({
      providerId,
      action: 'approve',
    });
  };

  const handleReject = async () => {
    if (!selectedProvider || !rejectionReason.trim()) return;

    await verifyMutation.mutateAsync({
      providerId: selectedProvider,
      action: 'reject',
      rejectionReason: rejectionReason.trim(),
    });

    setShowRejectModal(false);
    setSelectedProvider(null);
    setRejectionReason('');
  };

  const openRejectModal = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowRejectModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin dark:text-primary" />
      </div>
    );
  }

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
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-none"
          >
            <Clock className="mr-1 h-4 w-4" />
            {pendingCount} Pending
          </Badge>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Document Verification
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Review and verify responder documents
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  Pending Review
                </p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  Documents Required
                </p>
                <p className="text-sm font-medium text-foreground dark:text-foreground">
                  PAN Card + Citizenship
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  Review Time
                </p>
                <p className="text-sm font-medium text-foreground dark:text-foreground">
                  1-2 Days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Verifications List */}
        <div className="bg-card overflow-hidden rounded-xl border">
          {responders.length === 0 ? (
            <div className="p-8 text-center">
              <FileCheck className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium text-foreground dark:text-foreground">
                No pending verifications
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                All responder documents have been reviewed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Responder
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Service Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Documents
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {responders.map(responder => {
                    const typeConfig =
                      SERVICE_TYPE_CONFIG[responder.serviceType];

                    return (
                      <tr key={responder.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center">
                              <span className="text-primary font-medium">
                                {responder.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground dark:text-foreground">
                                {responder.name}
                              </p>
                              <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                                ID: {responder.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 text-sm text-foreground dark:text-foreground">
                              <Mail className="text-muted-foreground h-3 w-3 dark:text-muted-foreground" />
                              {responder.email}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-foreground dark:text-foreground">
                              <Phone className="text-muted-foreground h-3 w-3 dark:text-muted-foreground" />
                              {responder.phoneNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center gap-2 ${typeConfig.color}`}
                          >
                            {typeConfig.icon}
                            <span className="text-sm font-medium text-foreground dark:text-foreground">
                              {typeConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              {responder.panCardUrl ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-xs text-foreground dark:text-foreground">
                                PAN Card
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {responder.citizenshipUrl ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-xs text-foreground dark:text-foreground">
                                Citizenship
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted-foreground text-sm dark:text-muted-foreground">
                            {new Date(responder.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/verifications/${responder.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                Review
                              </Button>
                            </Link>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(responder.id)}
                              disabled={verifyMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-none"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="rounded-none"
                              onClick={() => openRejectModal(responder.id)}
                              disabled={verifyMutation.isPending}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
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

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card w-full max-w-md rounded-xl p-6 shadow-xl border">
              <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                Reject Documents
              </h3>
              <p className="text-muted-foreground mb-4 text-sm dark:text-muted-foreground">
                Please provide a reason for rejecting the documents. This will
                be shared with the responder.
              </p>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="bg-background mb-4 w-full rounded-none border border-border p-3 text-sm text-foreground focus:border-primary focus:outline-none"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-none border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedProvider(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-none"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || verifyMutation.isPending}
                >
                  {verifyMutation.isPending
                    ? 'Rejecting...'
                    : 'Reject Documents'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
