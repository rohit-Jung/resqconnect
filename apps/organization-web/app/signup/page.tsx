'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  AlertTriangle,
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
          router.push(`/verify?userId=${userId}`);
        } else {
          router.push('/login');
        }
      },
      onError: error => {
        console.error('Registration failed:', error);
      },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Primary Color Gradient */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#E63946] to-[#9B2C35] p-12 text-white lg:flex lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <Building2 className="h-16 w-16" />
          </div>
          <h1 className="mb-2 text-5xl font-bold">ResqConnect</h1>
          <p className="mb-8 text-xl opacity-90">Organization Portal</p>

          <p className="mb-12 max-w-md text-lg leading-relaxed opacity-90">
            Register your emergency service organization and become part of our
            life-saving network. Coordinate faster, respond smarter.
          </p>

          {/* Service Icons */}
          <div className="mb-12 flex gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl bg-white/10 p-3">
                <Ambulance className="h-8 w-8" />
              </div>
              <span className="text-xs opacity-75">Ambulance</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl bg-white/10 p-3">
                <Flame className="h-8 w-8" />
              </div>
              <span className="text-xs opacity-75">Fire</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl bg-white/10 p-3">
                <Shield className="h-8 w-8" />
              </div>
              <span className="text-xs opacity-75">Police</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl bg-white/10 p-3">
                <HeartPulse className="h-8 w-8" />
              </div>
              <span className="text-xs opacity-75">Medical</span>
            </div>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">500+</p>
              <p className="text-sm opacity-90">Organizations</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">10K+</p>
              <p className="text-sm opacity-90">Responders</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">50K+</p>
              <p className="text-sm opacity-90">Lives Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="bg-muted/30 flex min-h-screen w-full items-center justify-center overflow-y-auto p-4 sm:p-6 lg:w-1/2">
        <div className="bg-card my-4 w-full max-w-md rounded-2xl p-6 shadow-xl">
          <div className="mb-4 text-center">
            <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-red-100 p-2">
              <Building2 className="h-5 w-5 text-[#E63946]" />
            </div>
            <h2 className="mb-1 text-2xl font-bold">Register Organization</h2>
            <p className="text-muted-foreground text-sm">
              Join the emergency response network
            </p>
          </div>

          {registerMutation.isError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {registerMutation.error?.message ||
                'Registration failed. Please try again.'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
                            ? 'border-[#E63946] bg-red-50 text-[#E63946]'
                            : 'border-border hover:bg-muted/50 hover:border-[#E63946]/50'
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                onCheckedChange={checked => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="cursor-pointer text-xs font-normal"
              >
                I agree to the{' '}
                <Link href="/terms" className="text-[#E63946] hover:underline">
                  Terms
                </Link>
                ,{' '}
                <Link
                  href="/privacy"
                  className="text-[#E63946] hover:underline"
                >
                  Privacy
                </Link>{' '}
                &{' '}
                <Link
                  href="/organization-agreement"
                  className="text-[#E63946] hover:underline"
                >
                  Organization Agreement
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="h-10 w-full bg-[#E63946] text-sm hover:bg-[#9B2C35]"
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
                className="font-medium text-[#E63946] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
