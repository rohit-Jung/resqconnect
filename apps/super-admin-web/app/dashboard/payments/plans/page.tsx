'use client';

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

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

const emptyFormData: PlanFormData = {
  name: '',
  price: '',
  durationMonths: '',
  features: [''],
};

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

  const plans = plansData?.data?.data ?? [];

  const formatAmount = (paisa: number) => {
    return `NPR ${(paisa / 100).toFixed(2)}`;
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(emptyFormData);
    setShowForm(true);
  };

  const handleOpenEdit = (plan: ISubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: (plan.price / 100).toString(),
      durationMonths: plan.durationMonths.toString(),
      features: plan.features.length > 0 ? [...plan.features] : [''],
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
    const payload = {
      name: formData.name,
      price: Math.round(parseFloat(formData.price) * 100),
      durationMonths: parseInt(formData.durationMonths),
      features: formData.features.filter(f => f.trim() !== ''),
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/payments"
              className="text-muted-foreground text-sm hover:underline"
            >
              Payments
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Plans</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Manage Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage subscription plans for organizations
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

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
  );
}
