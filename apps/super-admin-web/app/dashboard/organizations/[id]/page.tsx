'use client';

import {
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  Building2,
  CheckCircle,
  Flame,
  Loader2,
  Mail,
  Phone,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useGetOrganizationById,
  useUpdateOrganization,
} from '@/services/super-admin/organizations.api';

const serviceCategoryConfig: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
  }
> = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance className="h-5 w-5" />,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  fire_brigade: {
    label: 'Fire Brigade',
    icon: <Flame className="h-5 w-5" />,
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  police: {
    label: 'Police',
    icon: <Shield className="h-5 w-5" />,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
};

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useGetOrganizationById(id);
  const updateOrganization = useUpdateOrganization();

  const organization = data?.data?.data;

  const categoryConfig = organization
    ? serviceCategoryConfig[organization.serviceCategory] || {
        label: organization.serviceCategory,
        icon: <Building2 className="h-5 w-5" />,
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
      }
    : null;

  const handleToggleVerification = async () => {
    if (!organization) return;
    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        data: { isVerified: !organization.isVerified },
      });
    } catch (err) {
      console.error('Failed to update organization:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-md rounded-xl border border-primary bg-card p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold text-foreground">
            Organization not found
          </h3>
          <p className="text-sm text-muted-foreground">
            {error?.message ||
              'The organization you are looking for does not exist.'}
          </p>
          <Link href="/dashboard/organizations" className="mt-4 inline-block">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none">
              Back to Organizations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/organizations">
            <Button
              variant="ghost"
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary">.</span>
          </div>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {organization.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Organization details and information
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              organization.isVerified
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {organization.isVerified ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Verified Organization
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Pending Verification
                </span>
              </>
            )}
          </div>

          <Button
            onClick={handleToggleVerification}
            disabled={updateOrganization.isPending}
            variant="outline"
            className={`rounded-none ${
              organization.isVerified
                ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-500/10 dark:border-yellow-400 dark:text-yellow-400'
                : 'border-green-500 text-green-600 hover:bg-green-500/10 dark:border-green-400 dark:text-green-400'
            }`}
          >
            {updateOrganization.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {organization.isVerified
              ? 'Revoke Verification'
              : 'Verify Organization'}
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Organization Details */}
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Organization Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Organization Name
                    </p>
                    <p className="font-medium text-foreground">
                      {organization.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Email Address
                    </p>
                    <p className="font-medium text-foreground">
                      {organization.email}
                    </p>
                  </div>
                </div>

                {organization.generalNumber && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        General Contact
                      </p>
                      <p className="font-medium text-foreground">
                        {organization.generalNumber}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {categoryConfig && (
                      <span className={categoryConfig.textColor}>
                        {categoryConfig.icon}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Service Category
                    </p>
                    <p className="font-medium text-foreground">
                      {categoryConfig?.label || organization.serviceCategory}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Organization ID
                  </p>
                  <p className="font-mono text-sm text-foreground mt-1 break-all">
                    {organization.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="font-medium text-foreground">
                    {new Date(organization.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium text-foreground">
                    {new Date(organization.updatedAt).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Verification Status
                  </p>
                  <p
                    className={`font-medium mt-1 ${
                      organization.isVerified
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {organization.isVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Category Badge */}
        {categoryConfig && (
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Service Type
              </h2>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${categoryConfig.bgColor}`}>
                  <span className={categoryConfig.textColor}>
                    {categoryConfig.icon}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {categoryConfig.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {organization.serviceCategory === 'ambulance' &&
                      'Emergency medical transport services'}
                    {organization.serviceCategory === 'fire_brigade' &&
                      'Fire fighting and rescue services'}
                    {organization.serviceCategory === 'police' &&
                      'Law enforcement and security'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
