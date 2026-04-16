'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { GuestGuard } from '@/components/guest-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuperAdminLogin } from '@/services/super-admin/auth.api';
import { IAdminLoginResponse, IOtpResponse } from '@/types/auth.types';
import {
  TSuperAdminLogin,
  superAdminLoginSchema,
} from '@/validations/super-admin.schema';

export const dynamic = 'force-dynamic';

function parseApiError(err: unknown): string {
  const axiosErr = err as {
    response?: {
      data?: { message?: string; errors?: string[]; error?: string };
    };
  };
  const data = axiosErr?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0)
    return data.errors.join(', ');
  if (data.error) return data.error;
  if (data.message) return data.message;
  return 'Something went wrong. Please try again.';
}

export default function SuperAdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useSuperAdminLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TSuperAdminLogin>({
    resolver: zodResolver(superAdminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'admin',
    },
  });

  const onSubmit = (data: TSuperAdminLogin) => {
    loginMutation.mutate(data, {
      onSuccess: response => {
        const responseData = response.data.data;

        if ('otpToken' in responseData) {
          const otpData = responseData as IOtpResponse;
          toast.success('OTP sent to your email');
          router.push(`/verify?userId=${otpData.userId}`);
        } else {
          const loginData = responseData as IAdminLoginResponse;
          if (loginData.token) {
            localStorage.setItem('adminToken', loginData.token);
          }
          toast.success('Welcome back');
          router.push('/dashboard');
        }
      },
      onError: error => {
        toast.error(parseApiError(error));
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
              Management Portal
            </span>
            <h1 className="mb-4 text-5xl font-bold leading-[1.05] tracking-tight">
              RESQ<span className="text-primary">.</span>
            </h1>
            <p className="mb-2 text-lg font-medium text-background/90">
              Super Admin
            </p>
            <p className="mb-10 max-w-sm text-base leading-relaxed text-background/60">
              Full administrative access to manage organizations, users, and
              monitor system-wide emergency response operations.
            </p>

            <div className="w-full max-w-xs border-t border-background/10 pt-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xl font-bold">Full</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                    Access
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">All</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                    Orgs
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">Live</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                    Analytics
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-background/10 pt-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-background/30">
              Authorized Administrators Only
            </span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-background flex w-full items-center justify-center p-8 lg:w-[55%]">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="mb-2 text-2xl font-bold tracking-tight">
                Super Admin Login
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access the admin portal
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="text-muted-foreground mt-6 text-center text-xs">
              This portal is restricted to authorized super administrators only.
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
