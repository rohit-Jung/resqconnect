'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  Ambulance,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createMutation = useCreateOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCreateOrganization>({
    resolver: zodResolver(createOrganizationSchema),
    mode: 'onBlur',
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
            Create Organization
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a new emergency service organization
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="px-6 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Category Selection */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Service Category
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SERVICE_CATEGORIES.map(category => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategorySelect(category.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedCategory === category.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div
                      className={`rounded-lg p-2 ${
                        selectedCategory === category.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {category.label}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.serviceCategory && (
              <p className="text-primary mt-2 text-sm">
                {errors.serviceCategory.message}
              </p>
            )}
          </div>

          {/* Organization Information */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Organization Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Organization Name
                  </Label>
                  <div className="relative">
                    <Building2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="name"
                      placeholder="Nepal Red Cross Society"
                      className={`pl-10 pr-3 border-border focus:border-primary ${
                        errors.name ? 'border-primary ring-1 ring-primary' : ''
                      }`}
                      aria-invalid={!!errors.name}
                      {...register('name')}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-primary text-sm font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@organization.com"
                      className={`pl-10 pr-3 border-border focus:border-primary ${
                        errors.email ? 'border-primary ring-1 ring-primary' : ''
                      }`}
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-primary text-sm font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generalNumber" className="text-foreground">
                  General Contact Number
                </Label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="generalNumber"
                    type="tel"
                    placeholder="014123456"
                    className={`pl-10 pr-3 border-border focus:border-primary ${
                      errors.generalNumber
                        ? 'border-primary ring-1 ring-primary'
                        : ''
                    }`}
                    aria-invalid={!!errors.generalNumber}
                    {...register('generalNumber')}
                  />
                </div>
                {errors.generalNumber && (
                  <p className="text-primary text-sm font-medium">
                    {errors.generalNumber.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Account Security
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Set a password for the organization. They can change it after
              logging in.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    className={`pl-10 pr-10 border-border focus:border-primary ${
                      errors.password
                        ? 'border-primary ring-1 ring-primary'
                        : ''
                    }`}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-primary text-sm font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="********"
                    className={`pl-10 pr-10 border-border focus:border-primary ${
                      errors.confirmPassword
                        ? 'border-primary ring-1 ring-primary'
                        : ''
                    }`}
                    aria-invalid={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-primary text-sm font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/organizations">
              <Button
                type="button"
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-none"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Organization
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
