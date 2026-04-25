'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Skeleton } from '@repo/ui/skeleton';

import {
  Ambulance,
  ArrowLeft,
  Eye,
  EyeOff,
  Flame,
  Info,
  LifeBuoy,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import { useOrgRegisterProvider } from '@/services/service-provider/auth.api';
import { ServiceCategory } from '@/types/auth.types';
import {
  type ServiceType,
  type TServiceProviderRegisterForm,
  serviceProviderRegisterFormSchema,
} from '@/validations/service-provider.schema';

const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  {
    label: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance className="h-6 w-6" />,
    description: 'Emergency medical transport services',
  },
  fire_truck: {
    label: 'Fire Truck',
    icon: <Flame className="h-6 w-6" />,
    description: 'Fire fighting and rescue services',
  },
  police: {
    label: 'Police',
    icon: <Shield className="h-6 w-6" />,
    description: 'Law enforcement and security',
  },
  rescue_team: {
    label: 'Rescue Team',
    icon: <LifeBuoy className="h-6 w-6" />,
    description: 'Search and rescue operations',
  },
};

const getCategoryDisplayName = (category: ServiceCategory): string => {
  const names: Record<ServiceCategory, string> = {
    ambulance: 'Ambulance Services',
    police: 'Police Services',
    fire_truck: 'Fire Brigade Services',
    rescue_team: 'Rescue Team Services',
  };
  return names[category] || category;
};

export default function NewServiceProviderPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createMutation = useOrgRegisterProvider();

  // Fetch org data to get the allowed service type
  const { data: analyticsResponse, isLoading: isLoadingOrg } =
    useOrgDashboardAnalytics();
  const orgServiceCategory =
    analyticsResponse?.data?.data?.organization?.serviceCategory;

  // The allowed service type is the same as the org's service category
  const allowedServiceType = orgServiceCategory as ServiceType | undefined;
  const typeConfig = allowedServiceType
    ? SERVICE_TYPE_CONFIG[allowedServiceType]
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TServiceProviderRegisterForm>({
    mode: 'onBlur',
    resolver: zodResolver(serviceProviderRegisterFormSchema),
  });

  console.log('errrors', errors);
  useEffect(() => {
    if (allowedServiceType) {
      setValue('serviceType', allowedServiceType);
    }
  }, [allowedServiceType, setValue]);

  const onSubmit = async (data: TServiceProviderRegisterForm) => {
    try {
      const { confirmPassword: _confirmPassword, ...formData } = data;
      void _confirmPassword;
      const apiData = {
        ...formData,
        age: parseInt(data.age, 10),
        phoneNumber: parseInt(data.phoneNumber, 10),
        // Only include document URLs if they are provided
        ...(formData.panCardUrl &&
          formData.panCardUrl.trim() !== '' && {
            panCardUrl: formData.panCardUrl,
          }),
        ...(formData.citizenshipUrl &&
          formData.citizenshipUrl.trim() !== '' && {
            citizenshipUrl: formData.citizenshipUrl,
          }),
      };
      await createMutation.mutateAsync(apiData);
      router.push('/dashboard/service-providers');
    } catch (error: unknown) {
      console.error('Error creating responder:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || 'Failed to register responder');
      } else {
        alert('Failed to register responder');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background dark:bg-background px-6 pb-4 pt-6">
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
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Add Responder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
            Register a new responder for your organization
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="px-6 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Type - Auto-selected based on organization category */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
              Service Type
            </h2>

            {isLoadingOrg ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : typeConfig && allowedServiceType ? (
              <>
                {/* Info message explaining the restriction */}
                <div className="bg-muted mb-4 flex items-start gap-3 rounded-lg border border-border p-4">
                  <Info className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0 dark:text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground dark:text-foreground">
                      Service type automatically assigned
                    </p>
                    <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
                      Your organization is registered as{' '}
                      <span className="font-medium">
                        {getCategoryDisplayName(orgServiceCategory!)}
                      </span>
                      . Service responders can only be created with the matching
                      service type.
                    </p>
                  </div>
                </div>

                {/* Display the auto-selected service type */}
                <div className="border-primary bg-primary/5 rounded-xl border-2 p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-lg p-2">
                      {typeConfig.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground dark:text-foreground">
                        {typeConfig.label}
                      </p>
                      <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                        {typeConfig.description}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm dark:text-muted-foreground">
                Unable to determine organization service category.
              </div>
            )}

            {errors.serviceType && (
              <p className="text-primary mt-2 text-sm">
                {errors.serviceType.message}
              </p>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
              Responder Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-foreground dark:text-foreground"
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className={`pl-10 pr-3 border-border focus:border-primary text-foreground ${
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
                  <Label
                    htmlFor="email"
                    className="text-foreground dark:text-foreground"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className={`pl-10 pr-3 border-border focus:border-primary text-foreground ${
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="age"
                    className="text-foreground dark:text-foreground"
                  >
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    className={`border-border focus:border-primary text-foreground ${
                      errors.age ? 'border-primary ring-1 ring-primary' : ''
                    }`}
                    aria-invalid={!!errors.age}
                    {...register('age')}
                  />
                  {errors.age && (
                    <p className="text-primary text-sm font-medium">
                      {errors.age.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phoneNumber"
                    className="text-foreground dark:text-foreground"
                  >
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="9841234567"
                      className={`pl-10 pr-3 border-border focus:border-primary text-foreground ${
                        errors.phoneNumber
                          ? 'border-primary ring-1 ring-primary'
                          : ''
                      }`}
                      aria-invalid={!!errors.phoneNumber}
                      {...register('phoneNumber')}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-primary text-sm font-medium">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="primaryAddress"
                    className="text-foreground dark:text-foreground"
                  >
                    Primary Address
                  </Label>
                  <div className="relative">
                    <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-muted-foreground" />
                    <Input
                      id="primaryAddress"
                      placeholder="Kathmandu, Nepal"
                      className={`pl-10 pr-3 border-border focus:border-primary text-foreground ${
                        errors.primaryAddress
                          ? 'border-primary ring-1 ring-primary'
                          : ''
                      }`}
                      aria-invalid={!!errors.primaryAddress}
                      {...register('primaryAddress')}
                    />
                  </div>
                  {errors.primaryAddress && (
                    <p className="text-primary text-sm font-medium">
                      {errors.primaryAddress.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
              Account Security
            </h2>
            <p className="text-muted-foreground mb-4 text-sm dark:text-muted-foreground">
              Set a temporary password for the responder. They can change it
              after logging in.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground dark:text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 border-border focus:border-primary text-foreground ${
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
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:text-muted-foreground"
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
                <Label
                  htmlFor="confirmPassword"
                  className="text-foreground dark:text-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 border-border focus:border-primary text-foreground ${
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
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:text-muted-foreground"
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

          {/* Verification Documents (Optional) */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
              Verification Documents
            </h2>
            <p className="text-muted-foreground mb-4 text-sm dark:text-muted-foreground">
              Upload document URLs for verification (optional). These can be
              added later.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="panCardUrl"
                  className="text-foreground dark:text-foreground"
                >
                  PAN Card URL
                </Label>
                <Input
                  id="panCardUrl"
                  type="url"
                  placeholder="https://example.com/pan-card.pdf"
                  className={`border-border focus:border-primary text-foreground ${
                    errors.panCardUrl
                      ? 'border-primary ring-1 ring-primary'
                      : ''
                  }`}
                  aria-invalid={!!errors.panCardUrl}
                  {...register('panCardUrl')}
                />
                {errors.panCardUrl && (
                  <p className="text-primary text-sm font-medium">
                    {errors.panCardUrl.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="citizenshipUrl"
                  className="text-foreground dark:text-foreground"
                >
                  Citizenship Document URL
                </Label>
                <Input
                  id="citizenshipUrl"
                  type="url"
                  placeholder="https://example.com/citizenship.pdf"
                  className={`border-border focus:border-primary text-foreground ${
                    errors.citizenshipUrl
                      ? 'border-primary ring-1 ring-primary'
                      : ''
                  }`}
                  aria-invalid={!!errors.citizenshipUrl}
                  {...register('citizenshipUrl')}
                />
                {errors.citizenshipUrl && (
                  <p className="text-primary text-sm font-medium">
                    {errors.citizenshipUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/service-providers">
              <Button
                type="button"
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-none dark:text-muted-foreground"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending || !allowedServiceType}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Responder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
