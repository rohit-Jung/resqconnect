'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/alert-dialog';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Checkbox } from '@repo/ui/checkbox';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  useDeleteOrganization,
  useGetOrganizationById,
  useGetOrganizationEntitlements,
  useSetOrganizationEntitlements,
} from '@/services/super-admin/organizations.api';

const sectorLabels: Record<string, string> = {
  hospital: 'Hospital',
  police: 'Police',
  fire: 'Fire',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function prettySector(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) return 'Unknown';
  return sectorLabels[value] || value;
}

function metricValue(metrics: unknown, key: string) {
  const v = asRecord(metrics)?.[key];
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '—';
}

function entitlementNumber(entitlements: unknown, key: string): number {
  const v = asRecord(entitlements)?.[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function entitlementBoolean(entitlements: unknown, key: string): boolean {
  const v = asRecord(entitlements)?.[key];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  return false;
}

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError, error } = useGetOrganizationById(id, {
    enabled: !!id,
    includeSilo: true,
  });
  const org = data?.data?.org;
  const replica = data?.data?.replica ?? null;
  const siloMetricsLatest = data?.data?.siloMetricsLatest ?? null;
  const silo = data?.data?.silo ?? null;

  const {
    data: entData,
    isLoading: entLoading,
    isError: entError,
  } = useGetOrganizationEntitlements(id, { enabled: !!id });
  const entSnapshot =
    entData?.data && 'ok' in entData.data && entData.data.ok
      ? entData.data.snapshot
      : null;

  const setEntitlements = useSetOrganizationEntitlements();
  const [pushEntitlementsToSilo, setPushEntitlementsToSilo] = useState(true);
  const [draftEntitlements, setDraftEntitlements] = useState<{
    provider_count_limit: string;
    api_rate_limit_tier: string;
    notification_fallback_quota: string;
    analytics_enabled: boolean;
  } | null>(null);

  const siloRecord = asRecord(silo);
  const siloOrg = asRecord(siloRecord?.org);
  const siloOrgId =
    typeof siloOrg?.id === 'string' && siloOrg.id.length > 0
      ? siloOrg.id
      : null;
  const siloEmail =
    typeof siloOrg?.email === 'string' && siloOrg.email.length > 0
      ? siloOrg.email
      : null;
  const siloServiceCategory =
    typeof siloOrg?.serviceCategory === 'string' &&
    siloOrg.serviceCategory.length > 0
      ? siloOrg.serviceCategory
      : null;
  const siloLifecycleStatus =
    typeof siloOrg?.lifecycleStatus === 'string' &&
    siloOrg.lifecycleStatus.length > 0
      ? siloOrg.lifecycleStatus
      : null;
  const siloOrgStatus =
    typeof siloOrg?.orgStatus === 'string' && siloOrg.orgStatus.length > 0
      ? siloOrg.orgStatus
      : null;
  const siloIsVerified =
    typeof siloOrg?.isVerified === 'boolean' ? siloOrg.isVerified : null;
  const siloCreatedAt =
    typeof siloOrg?.createdAt === 'string' && siloOrg.createdAt.length > 0
      ? siloOrg.createdAt
      : null;
  const siloUpdatedAt =
    typeof siloOrg?.updatedAt === 'string' && siloOrg.updatedAt.length > 0
      ? siloOrg.updatedAt
      : null;

  const siloSector = siloRecord?.sector;
  const siloMetrics = siloRecord?.metrics;

  const deleteOrganization = useDeleteOrganization();

  const effectiveEntitlements =
    draftEntitlements ??
    (entSnapshot
      ? {
          provider_count_limit: String(
            entitlementNumber(entSnapshot.entitlements, 'provider_count_limit')
          ),
          api_rate_limit_tier: String(
            entitlementNumber(entSnapshot.entitlements, 'api_rate_limit_tier')
          ),
          notification_fallback_quota: String(
            entitlementNumber(
              entSnapshot.entitlements,
              'notification_fallback_quota'
            )
          ),
          analytics_enabled: entitlementBoolean(
            entSnapshot.entitlements,
            'analytics_enabled'
          ),
        }
      : {
          provider_count_limit: '0',
          api_rate_limit_tier: '0',
          notification_fallback_quota: '0',
          analytics_enabled: false,
        });

  const updateEntDraft = (
    patch: Partial<{
      provider_count_limit: string;
      api_rate_limit_tier: string;
      notification_fallback_quota: string;
      analytics_enabled: boolean;
    }>
  ) => {
    setDraftEntitlements(prev => ({
      ...(prev ?? effectiveEntitlements),
      ...patch,
    }));
  };

  const saveEntitlements = async () => {
    if (!id) return;

    const provider_count_limit = Number.parseInt(
      effectiveEntitlements.provider_count_limit,
      10
    );
    const api_rate_limit_tier = Number.parseInt(
      effectiveEntitlements.api_rate_limit_tier,
      10
    );
    const notification_fallback_quota = Number.parseInt(
      effectiveEntitlements.notification_fallback_quota,
      10
    );

    if (
      !Number.isFinite(provider_count_limit) ||
      !Number.isFinite(api_rate_limit_tier) ||
      !Number.isFinite(notification_fallback_quota)
    ) {
      toast.error('Entitlements values must be numbers');
      return;
    }

    try {
      const res = await setEntitlements.mutateAsync({
        id,
        entitlements: {
          provider_count_limit,
          api_rate_limit_tier,
          notification_fallback_quota,
          analytics_enabled: effectiveEntitlements.analytics_enabled,
        },
        pushToSilo: pushEntitlementsToSilo,
      });

      const payload = res.data;
      if (payload && 'ok' in payload && payload.ok) {
        toast.success(`Entitlements saved (v${payload.version})`);
        setDraftEntitlements(null);
      } else {
        const msg =
          payload && typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'Failed to save entitlements';
        toast.error(msg);
      }
    } catch (err) {
      console.error('Failed to save entitlements:', err);
      toast.error('Failed to save entitlements');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteOrganization.mutateAsync(id);
      toast.success('Organization deleted');
      router.push('/dashboard/organizations');
    } catch (err) {
      console.error('Failed to delete organization:', err);
      toast.error('Failed to delete organization');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-md border border-primary bg-card p-6 text-center rounded-xl">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold text-foreground">Failed to load</h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-md border border-border bg-card p-6 text-center rounded-xl">
          <h3 className="mb-2 font-semibold text-foreground">Not found</h3>
          <p className="text-sm text-muted-foreground">
            Organization not found.
          </p>
          <div className="mt-4">
            <Link href="/dashboard/organizations">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none">
                Back to organizations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="rounded-none gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete organization?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the organization from the control plane registry.
                  Silo data is not deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline" className="rounded-none">
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    className="rounded-none"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting
                      </>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {org.name}
          </h1>
          <p className="text-muted-foreground mt-1">Organization details</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl md:col-span-2">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Sector
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {prettySector(org.sector)}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Status
                  </span>
                  <p
                    className={`mt-1 inline-flex items-center gap-2 text-sm font-medium ${
                      org.status === 'active'
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-yellow-600 dark:text-yellow-500'
                    }`}
                  >
                    {org.status === 'active' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {org.status}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Control Plane Org ID
                  </span>
                  <p className="mt-1 font-mono text-xs text-foreground break-all">
                    {org.id}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Silo Org ID
                  </span>
                  <p className="mt-1 font-mono text-xs text-foreground break-all">
                    {org.siloOrgId ?? 'Not provisioned'}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Silo Backend Base URL
                </span>
                <p className="mt-1 font-mono text-xs text-foreground break-all">
                  {org.siloBaseUrl}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Silo (Live or Cached)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Sector
                </span>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {prettySector(siloSector)}
                </p>
                {typeof siloSector === 'string' &&
                  siloSector !== org.sector && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: differs from registry sector (
                      {prettySector(org.sector)}).
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border bg-muted p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Users
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {metricValue(siloMetrics, 'users')}
                  </p>
                </div>
                <div className="rounded-md border bg-muted p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Providers
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {metricValue(siloMetrics, 'providers')}
                  </p>
                </div>
                <div className="rounded-md border bg-muted p-3 col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Orgs
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {metricValue(siloMetrics, 'orgs')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Verification
                  </span>
                  <p className="mt-1 text-sm text-foreground">
                    {siloIsVerified === null
                      ? 'Unknown'
                      : siloIsVerified
                        ? 'Verified'
                        : 'Not verified'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Status
                  </span>
                  <p className="mt-1 text-sm text-foreground">
                    {siloLifecycleStatus || siloOrgStatus || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Service Category
                  </span>
                  <p className="mt-1 text-sm text-foreground">
                    {siloServiceCategory || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Email
                  </span>
                  <p className="mt-1 text-sm text-foreground break-all">
                    {siloEmail || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Silo Org ID
                  </span>
                  <p className="mt-1 font-mono text-xs text-foreground break-all">
                    {siloOrgId || 'Unknown'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Created
                    </span>
                    <p className="mt-1 text-sm text-foreground">
                      {siloCreatedAt
                        ? new Date(siloCreatedAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Updated
                    </span>
                    <p className="mt-1 text-sm text-foreground">
                      {siloUpdatedAt
                        ? new Date(siloUpdatedAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <details className="rounded-md border bg-background p-3">
                <summary className="cursor-pointer select-none text-sm text-foreground">
                  Raw silo data
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Org (raw)
                    </span>
                    <pre className="mt-2 max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs text-foreground">
                      {silo?.org ? JSON.stringify(silo.org, null, 2) : 'null'}
                    </pre>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Metrics (raw)
                    </span>
                    <pre className="mt-2 max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs text-foreground">
                      {silo?.metrics
                        ? JSON.stringify(silo.metrics, null, 2)
                        : 'null'}
                    </pre>
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Entitlements (Feature Flags)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground">
                  Latest snapshot:{' '}
                  <span className="font-mono">
                    {entLoading
                      ? 'Loading…'
                      : entSnapshot
                        ? `v${entSnapshot.version}`
                        : entError
                          ? 'Unavailable'
                          : 'None'}
                  </span>
                </p>
                {entSnapshot?.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Captured {new Date(entSnapshot.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pushToSilo"
                    checked={pushEntitlementsToSilo}
                    onCheckedChange={v => setPushEntitlementsToSilo(v === true)}
                  />
                  <Label htmlFor="pushToSilo" className="text-sm">
                    Push to silo
                  </Label>
                </div>
                <Button
                  className="rounded-none"
                  onClick={saveEntitlements}
                  disabled={setEntitlements.isPending}
                >
                  {setEntitlements.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="providerCountLimit">Provider count limit</Label>
                <Input
                  id="providerCountLimit"
                  inputMode="numeric"
                  value={effectiveEntitlements.provider_count_limit}
                  onChange={e =>
                    updateEntDraft({ provider_count_limit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiRateLimitTier">
                  API rate limit tier (per 15m)
                </Label>
                <Input
                  id="apiRateLimitTier"
                  inputMode="numeric"
                  value={effectiveEntitlements.api_rate_limit_tier}
                  onChange={e =>
                    updateEntDraft({ api_rate_limit_tier: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notificationFallbackQuota">
                  Notification fallback quota
                </Label>
                <Input
                  id="notificationFallbackQuota"
                  inputMode="numeric"
                  value={effectiveEntitlements.notification_fallback_quota}
                  onChange={e =>
                    updateEntDraft({
                      notification_fallback_quota: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-7">
                  <Checkbox
                    id="analyticsEnabled"
                    checked={effectiveEntitlements.analytics_enabled}
                    onCheckedChange={v =>
                      updateEntDraft({ analytics_enabled: v === true })
                    }
                  />
                  <Label htmlFor="analyticsEnabled" className="text-sm">
                    Analytics enabled
                  </Label>
                </div>
              </div>
            </div>

            <details className="rounded-md border bg-background p-3">
              <summary className="cursor-pointer select-none text-sm text-foreground">
                Raw snapshot
              </summary>
              <pre className="mt-3 max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs text-foreground">
                {entSnapshot ? JSON.stringify(entSnapshot, null, 2) : 'null'}
              </pre>
            </details>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Latest Snapshot (Control Plane)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Captured
                </span>
                <p className="mt-1 text-sm text-foreground">
                  {replica?.capturedAt
                    ? new Date(replica.capturedAt).toLocaleString()
                    : 'No snapshot recorded'}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Snapshot
                </span>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs text-foreground">
                  {replica?.snapshot
                    ? JSON.stringify(replica.snapshot, null, 2)
                    : 'null'}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Latest Metrics (Control Plane)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Collected
                  </span>
                  <p className="mt-1 text-sm text-foreground">
                    {siloMetricsLatest?.collectedAt
                      ? new Date(siloMetricsLatest.collectedAt).toLocaleString()
                      : 'No metrics recorded'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Sector
                  </span>
                  <p className="mt-1 text-sm text-foreground">
                    {prettySector(siloMetricsLatest?.sector)}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Metrics
                </span>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs text-foreground">
                  {siloMetricsLatest?.metrics
                    ? JSON.stringify(siloMetricsLatest.metrics, null, 2)
                    : 'null'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Created
              </span>
              <p className="mt-1 text-sm text-foreground">
                {new Date(org.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Updated
              </span>
              <p className="mt-1 text-sm text-foreground">
                {new Date(org.updatedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
