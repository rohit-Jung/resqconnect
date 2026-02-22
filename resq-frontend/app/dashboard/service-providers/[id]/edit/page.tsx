'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { ArrowLeft, Car, Loader2, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgServiceProvider, useOrgUpdateProvider } from '@/services/service-provider/auth.api';
import { ServiceStatus } from '@/types/auth.types';
import {
  type TServiceProviderUpdate,
  serviceProviderUpdateSchema,
} from '@/validations/service-provider.schema';

const STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'On Assignment' },
  { value: 'off_duty', label: 'Off Duty' },
];

export default function EditServiceProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: providerData, isLoading } = useOrgServiceProvider(id);
  const updateMutation = useOrgUpdateProvider();

  const provider = providerData?.data?.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TServiceProviderUpdate>({
    resolver: zodResolver(serviceProviderUpdateSchema),
  });

  useEffect(() => {
    if (provider) {
      reset({
        name: provider.name,
        age: provider.age,
        primaryAddress: provider.primaryAddress,
        serviceArea: provider.serviceArea || undefined,
        vehicleInformation: provider.vehicleInformation || undefined,
      });
    }
  }, [provider, reset]);

  const onSubmit = async (data: TServiceProviderUpdate) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      router.push(`/dashboard/service-providers/${id}`);
    } catch (error) {
      console.error('Error updating service provider:', error);
    }
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

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/dashboard/service-providers/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Service Provider</h1>
          <p className="text-muted-foreground">Update {provider.name}&apos;s information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input id="name" placeholder="John Doe" className="pl-10" {...register('name')} />
                </div>
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  {...register('age', { valueAsNumber: true })}
                />
                {errors.age && <p className="text-destructive text-sm">{errors.age.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryAddress">Primary Address</Label>
                <div className="relative">
                  <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="primaryAddress"
                    placeholder="Kathmandu, Nepal"
                    className="pl-10"
                    {...register('primaryAddress')}
                  />
                </div>
                {errors.primaryAddress && (
                  <p className="text-destructive text-sm">{errors.primaryAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceArea">Service Area</Label>
                <div className="relative">
                  <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="serviceArea"
                    placeholder="Kathmandu Valley"
                    className="pl-10"
                    {...register('serviceArea')}
                  />
                </div>
                {errors.serviceArea && (
                  <p className="text-destructive text-sm">{errors.serviceArea.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Vehicle Information (Optional)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <div className="relative">
                <Car className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="vehicleType"
                  placeholder="Ambulance"
                  className="pl-10"
                  {...register('vehicleInformation.type')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                placeholder="BA 1 PA 1234"
                {...register('vehicleInformation.number')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Vehicle Model</Label>
              <Input
                id="vehicleModel"
                placeholder="Toyota HiAce"
                {...register('vehicleInformation.model')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleColor">Vehicle Color</Label>
              <Input
                id="vehicleColor"
                placeholder="White"
                {...register('vehicleInformation.color')}
              />
            </div>
          </div>
        </div>

        {/* Read-only Info */}
        <div className="bg-muted/50 rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Information (Read Only)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              <p className="font-medium">{provider.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Phone Number</p>
              <p className="font-medium">{provider.phoneNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Service Type</p>
              <p className="font-medium capitalize">{provider.serviceType.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Verification Status</p>
              <p className="font-medium">{provider.isVerified ? 'Verified' : 'Not Verified'}</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/dashboard/service-providers/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
