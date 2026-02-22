'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { Eye, EyeOff, Loader2, Lock, Mail, Shield } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuperAdminLogin } from '@/services/super-admin/auth.api';
import { ISuperAdminLoginResponse } from '@/types/auth.types';
import { TSuperAdminLogin, superAdminLoginSchema } from '@/validations/super-admin.schema';

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
    },
  });

  const onSubmit = (data: TSuperAdminLogin) => {
    loginMutation.mutate(data, {
      onSuccess: response => {
        const responseData = response.data.data as ISuperAdminLoginResponse;
        if (responseData.token) {
          localStorage.setItem('superAdminToken', responseData.token);
        }
        router.push('/super-admin/dashboard');
      },
      onError: error => {
        console.error('Login failed:', error);
      },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Dark Background */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-white lg:flex lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <Shield className="h-16 w-16" />
          </div>
          <h1 className="mb-2 text-5xl font-bold">Super Admin</h1>
          <p className="mb-8 text-xl opacity-90">ResqConnect Management Portal</p>

          <p className="mb-16 max-w-md text-lg leading-relaxed opacity-90">
            Full administrative access to manage organizations, users, and monitor system-wide
            emergency response operations.
          </p>

          <div className="flex gap-16">
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">Full</p>
              <p className="text-sm opacity-90">Access</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">All</p>
              <p className="text-sm opacity-90">Organizations</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">System</p>
              <p className="text-sm opacity-90">Analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="bg-muted/30 flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="bg-card w-full max-w-md rounded-2xl p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <Image
                src="/resq-connect-logo.png"
                alt="ResQ Connect"
                width={64}
                height={64}
                className="rounded-lg"
              />
            </div>
            <h2 className="mb-2 text-3xl font-bold">Super Admin Login</h2>
            <p className="text-muted-foreground">Sign in to access the admin portal</p>
          </div>

          {loginMutation.isError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {loginMutation.error?.message || 'Login failed. Please try again.'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
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
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-slate-900 text-base hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in as Super Admin'
              )}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            This portal is restricted to authorized super administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
