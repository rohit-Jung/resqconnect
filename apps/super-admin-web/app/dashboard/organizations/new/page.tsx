'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  Ambulance,
  ArrowLeft,
  Building2,
  Flame,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateOrganization } from '@/services/super-admin/organizations.api';
import {
  type ServiceCategory,
  type TCreateOrganization,
  createOrganizationSchema,
} from '@/validations/super-admin.schema';

const SERVICE_CATEGORIES: {
  value: ServiceCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'ambulance',
    label: 'Ambulance',
    icon: <Ambulance className="h-6 w-6" />,
    description: 'Emergency medical transport services',
  },
  {
    value: 'fire_brigade',
    label: 'Fire Brigade',
    icon: <Flame className="h-6 w-6" />,
    description: 'Fire fighting and rescue services',
  },
  {
    value: 'police',
    label: 'Police',
    icon: <Shield className="h-6 w-6" />,
    description: 'Law enforcement and security',
  },
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const createMutation = useCreateOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCreateOrganization>({
    resolver: zodResolver(createOrganizationSchema),
  });

  const onSubmit = async (data: TCreateOrganization) => {
    try {
      // Convert form data to API format, excluding confirmPassword
      const { confirmPassword, ...formData } = data;
      const apiData = {
        ...formData,
        generalNumber: parseInt(data.generalNumber, 10),
      };
      createMutation.mutate(apiData, {
        onSuccess: () => {
          router.push('/dashboard/organizations');
        },
        onError(error) {
          alert('Failed to create organization');
          console.error('Error: ', error);
        },
      });
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setValue('serviceCategory', category);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/organizations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Organization</h1>
          <p className="text-muted-foreground">
            Register a new emergency service organization
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Service Category Selection */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Service Category</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SERVICE_CATEGORIES.map(category => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategorySelect(category.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedCategory === category.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className={`rounded-lg p-2 ${
                      selectedCategory === category.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <p className="font-medium">{category.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {errors.serviceCategory && (
            <p className="text-destructive mt-2 text-sm">
              {errors.serviceCategory.message}
            </p>
          )}
        </div>

        {/* Organization Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Organization Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <div className="relative">
                  <Building2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="name"
                    placeholder="Nepal Red Cross Society"
                    className="pl-10"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@organization.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalNumber">General Contact Number</Label>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="generalNumber"
                  type="tel"
                  placeholder="014123456"
                  className="pl-10"
                  {...register('generalNumber')}
                />
              </div>
              {errors.generalNumber && (
                <p className="text-destructive text-sm">
                  {errors.generalNumber.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Security</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Set a password for the organization. They can change it after
            logging in.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  className="pl-10"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/organizations">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Organization
          </Button>
        </div>
      </form>
    </div>
  );
}
