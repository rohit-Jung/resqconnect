'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  Ambulance,
  Building2,
  Eye,
  EyeOff,
  Flame,
  HeartPulse,
  LifeBuoy,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { GuestGuard } from '@/components/guest-guard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgRegister } from '@/services/organization/auth.api';
import {
  ServiceCategory,
  TOrgRegisterForm,
  orgRegisterFormSchema,
} from '@/validations/org.schema';

const serviceCategories: {
  value: ServiceCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'ambulance',
    label: 'Ambulance Service',
    icon: <Ambulance className="h-4 w-4" />,
  },
  {
    value: 'fire_truck',
    label: 'Fire Department',
    icon: <Flame className="h-4 w-4" />,
  },
  {
    value: 'police',
    label: 'Police Department',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    value: 'rescue_team',
    label: 'Rescue Services',
    icon: <LifeBuoy className="h-4 w-4" />,
  },
];

export default function OrgSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();
  const registerMutation = useOrgRegister();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TOrgRegisterForm>({
    resolver: zodResolver(orgRegisterFormSchema),
    defaultValues: {
      name: '',
      serviceCategory: 'ambulance',
      email: '',
      generalNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: TOrgRegisterForm) => {
    if (!termsAccepted) {
      return;
    }

    // Transform form data to API format
    const apiData = {
      name: data.name,
      serviceCategory: data.serviceCategory,
      email: data.email,
      generalNumber: parseInt(data.generalNumber, 10),
      password: data.password,
    };

    registerMutation.mutate(apiData, {
      onSuccess: response => {
        const userId = response.data.data?.userId;
        if (userId) {
          toast.success('Account created. Verify your email.');
          router.push(`/verify?userId=${userId}`);
        } else {
          toast.success('Account created successfully');
          router.push('/login');
        }
      },
      onError: error => {
        const axiosErr = error as {
          response?: {
            data?: { message?: string; errors?: string[]; error?: string };
          };
        };
        const data = axiosErr?.response?.data;
        let msg = 'Registration failed. Please try again.';
        if (
          data?.errors &&
          Array.isArray(data.errors) &&
          data.errors.length > 0
        )
          msg = data.errors.join(', ');
        else if (data?.error) msg = data.error;
        else if (data?.message) msg = data.message;
        toast.error(msg);
      },
    });
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen">
        {/* Left Side - Swiss Design */}
        <div className="hidden flex-col justify-between bg-foreground p-12 text-background lg:flex lg:w-[45%]">
          <div className="flex flex-1 flex-col items-start justify-center px-8">
            <span className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-background/40">
              Organization Portal
            </span>
            <h1 className="mb-4 text-5xl font-bold leading-[1.05] tracking-tight">
              RESQ<span className="text-primary">.</span>
            </h1>
            <p className="mb-10 max-w-sm text-lg leading-relaxed text-background/70">
              Register your emergency service organization and become part of
              our life-saving network.
            </p>

            <div className="w-full max-w-xs border-t border-background/10 pt-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xl font-bold">500+</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                    Orgs
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">10K+</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                    Responders
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">50K+</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                    Lives Saved
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-background/10 pt-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-background/30">
              Join Nepals Emergency Response Network
            </span>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="bg-background flex min-h-screen w-full items-center justify-center overflow-y-auto p-4 sm:p-6 lg:w-[55%]">
          <div className="my-4 w-full max-w-md">
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold tracking-tight">
                Register Organization
              </h2>
              <p className="text-muted-foreground text-sm">
                Join the emergency response network
              </p>
            </div>

            {registerMutation.isError && (
              <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                {(
                  registerMutation.error as {
                    response?: { data?: { message?: string } };
                  }
                )?.response?.data?.message ||
                  'Registration failed. Please try again.'}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Organization Name</Label>
                <div className="relative">
                  <Building2 className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="City Fire Department"
                    className="pl-10"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Service Category</Label>
                <Controller
                  name="serviceCategory"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-1.5">
                      {serviceCategories.map(category => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => field.onChange(category.value)}
                          className={`flex items-center gap-1.5 rounded-lg border p-2 text-xs transition-all ${
                            field.value === category.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {category.icon}
                          <span className="truncate">
                            {category.label.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.serviceCategory && (
                  <p className="text-xs text-red-500">
                    {errors.serviceCategory.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Organization Email</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@organization.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="generalNumber">Emergency Contact Number</Label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <Input
                    id="generalNumber"
                    type="tel"
                    placeholder="102"
                    className="pl-10"
                    {...register('generalNumber')}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Emergency number (e.g., 100, 101, 102)
                </p>
                {errors.generalNumber && (
                  <p className="text-xs text-red-500">
                    {errors.generalNumber.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className="pr-10 pl-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm</Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm"
                      className="pr-10 pl-10"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={checked =>
                    setTermsAccepted(checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="cursor-pointer text-xs font-normal"
                >
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms
                  </Link>
                  ,{' '}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy
                  </Link>{' '}
                  &{' '}
                  <Link
                    href="/organization-agreement"
                    className="text-primary hover:underline"
                  >
                    Organization Agreement
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="h-10 w-full text-sm"
                disabled={registerMutation.isPending || !termsAccepted}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Organization'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
