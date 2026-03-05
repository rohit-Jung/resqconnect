'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  Ambulance,
  ArrowLeft,
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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
    resolver: zodResolver(serviceProviderRegisterFormSchema),
  });

  // Auto-set the service type when org data is loaded
  useEffect(() => {
    if (allowedServiceType) {
      setValue('serviceType', allowedServiceType);
    }
  }, [allowedServiceType, setValue]);

  const onSubmit = async (data: TServiceProviderRegisterForm) => {
    try {
      // Convert form data to API format, excluding confirmPassword
      const { confirmPassword, ...formData } = data;
      const apiData = {
        ...formData,
        age: parseInt(data.age, 10),
        phoneNumber: parseInt(data.phoneNumber, 10),
      };
      createMutation.mutate(apiData, {
        onSuccess: () => {
          router.push('/dashboard/service-providers');
        },
        onError(error) {
          alert('Failed to register service provider');
          console.log('Error: ', error);
        },
      });
    } catch (error) {
      console.error('Error creating service provider:', error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/service-providers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Service Provider</h1>
          <p className="text-muted-foreground">
            Register a new service provider for your organization
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Service Type - Auto-selected based on organization category */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Service Type</h2>

          {isLoadingOrg ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : typeConfig && allowedServiceType ? (
            <>
              {/* Info message explaining the restriction */}
              <div className="bg-muted/50 mb-4 flex items-start gap-3 rounded-lg border p-4">
                <Info className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">
                    Service type automatically assigned
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Your organization is registered as{' '}
                    <span className="font-medium">
                      {getCategoryDisplayName(orgServiceCategory!)}
                    </span>
                    . Service providers can only be created with the matching
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
                    <p className="font-medium">{typeConfig.label}</p>
                    <p className="text-muted-foreground text-sm">
                      {typeConfig.description}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">
              Unable to determine organization service category.
            </div>
          )}

          {errors.serviceType && (
            <p className="text-destructive mt-2 text-sm">
              {errors.serviceType.message}
            </p>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Provider Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="name"
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  {...register('age')}
                />
                {errors.age && (
                  <p className="text-destructive text-sm">
                    {errors.age.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="9841234567"
                    className="pl-10"
                    {...register('phoneNumber')}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-destructive text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
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
                  <p className="text-destructive text-sm">
                    {errors.primaryAddress.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Account Security</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Set a temporary password for the provider. They can change it after
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
                  placeholder="••••••••"
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
                  placeholder="••••••••"
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
          <Link href="/dashboard/service-providers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || !allowedServiceType}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Provider
          </Button>
        </div>
      </form>
    </div>
  );
}
