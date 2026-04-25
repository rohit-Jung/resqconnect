'use client';

import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';

import {
  AlertTriangle,
  Check,
  Edit,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ISubscriptionPlan,
  useCreateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useGetSubscriptionPlans,
  useUpdateSubscriptionPlan,
} from '@/services/super-admin/payments.api';

interface PlanFormData {
  name: string;
  price: string;
  durationMonths: string;
  features: string[];
  entitlements: {
    provider_count_limit: string;
    api_rate_limit_tier: string;
    notification_fallback_quota: string;
    analytics_enabled: boolean;
  };
}

const emptyFormData: PlanFormData = {
  name: '',
  price: '',
  durationMonths: '',
  features: [''],
  entitlements: {
    provider_count_limit: '0',
    api_rate_limit_tier: '0',
    notification_fallback_quota: '0',
    analytics_enabled: false,
  },
};

const ENTITLEMENT_KEYS = new Set([
  'provider_count_limit',
  'api_rate_limit_tier',
  'notification_fallback_quota',
  'analytics_enabled',
]);

function splitPlanFeatures(features: string[] | undefined) {
  const entitlements = {
    provider_count_limit: '0',
    api_rate_limit_tier: '0',
    notification_fallback_quota: '0',
    analytics_enabled: false,
  };

  const other: string[] = [];
  for (const raw of features ?? []) {
    if (typeof raw !== 'string') continue;
    const idx = raw.indexOf('=');
    if (idx <= 0) {
      other.push(raw);
      continue;
    }
    const key = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (!ENTITLEMENT_KEYS.has(key)) {
      other.push(raw);
      continue;
    }

    switch (key) {
      case 'provider_count_limit':
      case 'api_rate_limit_tier':
      case 'notification_fallback_quota':
        entitlements[key] = value;
        break;
      case 'analytics_enabled':
        entitlements.analytics_enabled =
          value.toLowerCase() === 'true' ||
          value === '1' ||
          value.toLowerCase() === 'yes' ||
          value.toLowerCase() === 'on';
        break;
      default:
        break;
    }
  }

  return {
    entitlements,
    features: other.length > 0 ? other : [''],
  };
}

function buildPlanFeatures(
  otherFeatures: string[],
  entitlements: PlanFormData['entitlements']
) {
  const cleaned = (otherFeatures ?? []).filter(f => f.trim().length > 0);
  return [
    ...cleaned,
    `provider_count_limit=${entitlements.provider_count_limit}`,
    `api_rate_limit_tier=${entitlements.api_rate_limit_tier}`,
    `notification_fallback_quota=${entitlements.notification_fallback_quota}`,
    `analytics_enabled=${entitlements.analytics_enabled ? 'true' : 'false'}`,
  ];
}

export default function PlansManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ISubscriptionPlan | null>(
    null
  );
  const [formData, setFormData] = useState<PlanFormData>(emptyFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: plansData, isLoading, isError } = useGetSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();

  const plans = plansData?.data?.plans ?? [];

  const formatAmount = (paisa: number) => {
    return `NPR ${(paisa / 100).toFixed(2)}`;
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(emptyFormData);
    setShowForm(true);
  };

  const handleOpenEdit = (plan: ISubscriptionPlan) => {
    const parsed = splitPlanFeatures(plan.features);
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: (plan.price / 100).toString(),
      durationMonths: plan.durationMonths.toString(),
      features: parsed.features,
      entitlements: parsed.entitlements,
    });
    setShowForm(true);
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const handleSubmit = async () => {
    const provider_count_limit = Number.parseInt(
      formData.entitlements.provider_count_limit,
      10
    );
    const api_rate_limit_tier = Number.parseInt(
      formData.entitlements.api_rate_limit_tier,
      10
    );
    const notification_fallback_quota = Number.parseInt(
      formData.entitlements.notification_fallback_quota,
      10
    );

    if (
      !Number.isFinite(provider_count_limit) ||
      !Number.isFinite(api_rate_limit_tier) ||
      !Number.isFinite(notification_fallback_quota)
    ) {
      // Avoid sending malformed plan entitlements.
      return;
    }

    const payload = {
      name: formData.name,
      price: Math.round(parseFloat(formData.price) * 100),
      durationMonths: parseInt(formData.durationMonths),
      features: buildPlanFeatures(formData.features, {
        provider_count_limit: String(Math.max(0, provider_count_limit)),
        api_rate_limit_tier: String(Math.max(0, api_rate_limit_tier)),
        notification_fallback_quota: String(
          Math.max(0, notification_fallback_quota)
        ),
        analytics_enabled: formData.entitlements.analytics_enabled,
      }),
    };

    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...payload });
      } else {
        await createPlan.mutateAsync(payload);
      }
      setShowForm(false);
      setFormData(emptyFormData);
      setEditingPlan(null);
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlan.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading subscription plans...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
          <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
            Failed to load plans
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            An error occurred while fetching subscription plans
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
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
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/payments"
              className="text-muted-foreground text-sm hover:underline dark:text-muted-foreground"
            >
              Payments
            </Link>
            <span className="text-muted-foreground dark:text-muted-foreground">
              /
            </span>
            <span className="text-sm font-medium text-foreground dark:text-foreground">
              Plans
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Manage Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Create, edit, and manage subscription plans for organizations
          </p>
        </div>
        <div className="mt-4">
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>
      <div className="px-6 pb-8 space-y-6">
        {/* Plan Form Modal */}
        {showForm && (
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="planName">Plan Name</Label>
                  <Input
                    id="planName"
                    placeholder="e.g., Basic, Pro, Enterprise"
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planPrice">Price (NPR)</Label>
                  <Input
                    id="planPrice"
                    type="number"
                    placeholder="e.g., 999"
                    value={formData.price}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, price: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planDuration">Duration (Months)</Label>
                  <Input
                    id="planDuration"
                    type="number"
                    placeholder="e.g., 1, 3, 12"
                    value={formData.durationMonths}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        durationMonths: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <p className="text-muted-foreground text-xs">
                  These are additional plan features (free-form). Entitlements
                  are managed below and automatically stored on the plan.
                </p>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Feature ${index + 1}`}
                      value={feature}
                      onChange={e => handleFeatureChange(index, e.target.value)}
                    />
                    {formData.features.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddFeature}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Feature
                </Button>
              </div>

              <div className="space-y-3 rounded-md border border-border p-4">
                <div>
                  <Label>Entitlements</Label>
                  <p className="text-muted-foreground text-xs">
                    These entitlements are applied automatically when an
                    organization purchases this plan. They can still be
                    overridden manually from the organization view.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entProviderCountLimit">
                      Provider count limit
                    </Label>
                    <Input
                      id="entProviderCountLimit"
                      type="number"
                      inputMode="numeric"
                      value={formData.entitlements.provider_count_limit}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          entitlements: {
                            ...prev.entitlements,
                            provider_count_limit: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entApiRateLimitTier">
                      API rate limit tier (per 15m)
                    </Label>
                    <Input
                      id="entApiRateLimitTier"
                      type="number"
                      inputMode="numeric"
                      value={formData.entitlements.api_rate_limit_tier}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          entitlements: {
                            ...prev.entitlements,
                            api_rate_limit_tier: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entNotificationFallbackQuota">
                      Notification fallback quota
                    </Label>
                    <Input
                      id="entNotificationFallbackQuota"
                      type="number"
                      inputMode="numeric"
                      value={formData.entitlements.notification_fallback_quota}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          entitlements: {
                            ...prev.entitlements,
                            notification_fallback_quota: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="pt-7 flex items-center gap-2">
                      <input
                        id="entAnalyticsEnabled"
                        type="checkbox"
                        className="h-4 w-4"
                        checked={formData.entitlements.analytics_enabled}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            entitlements: {
                              ...prev.entitlements,
                              analytics_enabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      <Label htmlFor="entAnalyticsEnabled">
                        Analytics enabled
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {(createPlan.isError ||
                updatePlan.isError ||
                deletePlan.isError) && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {createPlan.error?.message ||
                    updatePlan.error?.message ||
                    deletePlan.error?.message}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.name ||
                    !formData.price ||
                    !formData.durationMonths ||
                    createPlan.isPending ||
                    updatePlan.isPending
                  }
                >
                  {(createPlan.isPending || updatePlan.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans List */}
        {plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Plus className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                No subscription plans yet
              </h3>
              <p className="text-muted-foreground mx-auto mb-4 max-w-md text-sm">
                Create your first subscription plan to allow organizations to
                subscribe and pay via Khalti.
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: ISubscriptionPlan) => (
              <Card key={plan.id} className="relative overflow-hidden">
                {!plan.isActive && (
                  <div className="absolute inset-x-0 top-0 bg-gray-500 px-3 py-1 text-center text-xs font-medium text-white">
                    Inactive
                  </div>
                )}
                <CardHeader className={plan.isActive ? '' : 'pt-8'}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.durationMonths} month
                        {plan.durationMonths > 1 ? 's' : ''} duration
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {deleteConfirmId === plan.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleDelete(plan.id)}
                            disabled={deletePlan.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteConfirmId(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">
                      {formatAmount(plan.price)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{plan.durationMonths} mo
                    </span>
                  </div>

                  {plan.features?.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-muted-foreground text-xs">
                    Created: {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
