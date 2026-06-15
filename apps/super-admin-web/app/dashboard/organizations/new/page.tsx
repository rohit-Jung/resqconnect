'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';

import { ArrowRight, CheckCircle2, Copy, Terminal } from 'lucide-react';
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
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

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
    value: 'fire_truck',
    label: 'Fire Truck',
    icon: <Flame className="h-6 w-6" />,
    description: 'Fire fighting and rescue services',
  },
  {
    value: 'police',
    label: 'Police',
    icon: <Shield className="h-6 w-6" />,
    description: 'Law enforcement and security',
  },
  {
    value: 'rescue_team',
    label: 'Rescue Team',
    icon: <Shield className="h-6 w-6" />,
    description: 'Search and rescue operations',
  },
];

const SECTOR_OPTIONS = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'police', label: 'Police' },
  { value: 'fire', label: 'Fire' },
] as const satisfies ReadonlyArray<{
  value: TCreateOrganization['sector'];
  label: string;
}>;

export default function NewOrganizationPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createMutation = useCreateOrganization();
  const [createdOrg, setCreatedOrg] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<TCreateOrganization>({
    resolver: zodResolver(createOrganizationSchema),
    mode: 'onBlur',
  });

  const selectedSector = useWatch({ control, name: 'sector' });

  const onSubmit = async (data: TCreateOrganization) => {
    try {
      const { confirmPassword, ...formData } = data;
      void confirmPassword;
      const apiData = {
        ...formData,
        generalNumber: parseInt(data.generalNumber, 10),
      } as any;
      createMutation.mutate(apiData, {
        onSuccess: res => {
          const orgId =
            (res as any)?.data?.org?.id ?? (res as any)?.data?.data?.id;
          setCreatedOrg({
            id: orgId ?? 'unknown',
            name: data.name,
          });
          toast.success('Organization created');
        },
        onError(error) {
          toast.error('Failed to create organization');
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

  function SuccessView({
    org,
    onDone,
  }: {
    org: { id: string; name: string };
    onDone: () => void;
  }) {
    const [copied, setCopied] = useState(false);

    const copyId = () => {
      navigator.clipboard.writeText(org.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h2 className="text-xl font-bold text-foreground">
            Organization Created
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {org.name} is now registered in the control plane.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Tenant ID
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-border bg-background px-3 py-2 font-mono text-xs break-all">
              {org.id}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={copyId}
            >
              {copied ? (
                'Copied!'
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Use this ID when deploying the silo.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Terminal className="h-4 w-4" /> Deploy the silo
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Run this command from the project root to deploy the silo:
          </p>
          <pre className="overflow-x-auto rounded border border-border bg-background p-4 font-mono text-xs">
            {`INTERNAL_API_KEY=your_key_here \
  ./deploy/deploy-silo.sh \
  \"${org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\" \
  <sector> \
  <port> \
  ${org.id}`}
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            After the silo starts and registers, come back to approve it.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onDone}>
            Back to organizations
          </Button>
          <Button asChild>
            <a href={`/dashboard/organizations/${org.id}`}>
              View organization <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
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
            Create Organization
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a new emergency service organization
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {createdOrg ? (
          <SuccessView
            org={createdOrg}
            onDone={() => router.push('/dashboard/organizations')}
          />
        ) : (
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
                    <Label htmlFor="sector" className="text-foreground">
                      Sector
                    </Label>
                    <Select
                      value={selectedSector}
                      onValueChange={value =>
                        setValue(
                          'sector',
                          value as TCreateOrganization['sector'],
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        )
                      }
                    >
                      <SelectTrigger
                        id="sector"
                        className={`w-full border-border focus-visible:border-primary ${
                          errors.sector
                            ? 'border-primary ring-1 ring-primary'
                            : ''
                        }`}
                        aria-invalid={!!errors.sector}
                      >
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTOR_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" {...register('sector')} />
                    {errors.sector && (
                      <p className="text-primary text-sm font-medium">
                        {errors.sector.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siloBaseUrl" className="text-foreground">
                      Silo Backend Base URL
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Base URL of the silo backend (not the frontend). Example:
                      https://silo.example.com
                    </p>
                    <Input
                      id="siloBaseUrl"
                      placeholder="http://localhost:4000"
                      className={`border-border focus:border-primary ${
                        errors.siloBaseUrl
                          ? 'border-primary ring-1 ring-primary'
                          : ''
                      }`}
                      aria-invalid={!!errors.siloBaseUrl}
                      {...register('siloBaseUrl')}
                    />
                    {errors.siloBaseUrl && (
                      <p className="text-primary text-sm font-medium">
                        {errors.siloBaseUrl.message}
                      </p>
                    )}
                  </div>
                </div>

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
                          errors.name
                            ? 'border-primary ring-1 ring-primary'
                            : ''
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
                          errors.email
                            ? 'border-primary ring-1 ring-primary'
                            : ''
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
        )}
      </div>
    </div>
  );
}
