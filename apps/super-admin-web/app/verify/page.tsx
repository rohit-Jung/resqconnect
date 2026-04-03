'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Loader2,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuperAdminVerify } from '@/services/super-admin/auth.api';
import {
  TSuperAdminVerify,
  superAdminVerifySchema,
} from '@/validations/super-admin.schema';

function VerifyPageContent() {
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const verifyMutation = useSuperAdminVerify();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TSuperAdminVerify>({
    resolver: zodResolver(superAdminVerifySchema),
    defaultValues: {
      userId: userId || '',
      otpToken: '',
    },
  });

  useEffect(() => {
    if (userId) {
      setValue('userId', userId);
    }
  }, [userId, setValue]);

  const onSubmit = (data: TSuperAdminVerify) => {
    verifyMutation.mutate(data, {
      onSuccess: response => {
        setIsSuccess(true);
        // If token is returned, store it
        if (response.data.data?.token) {
          localStorage.setItem('adminToken', response.data.data.token);
        }
      },
      onError: error => {
        console.error('Verification failed:', error);
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
          <p className="mb-8 text-xl opacity-90">
            ResqConnect Management Portal
          </p>

          <p className="mb-16 max-w-md text-lg leading-relaxed opacity-90">
            We&apos;ve sent a verification code to your email. Enter the code to
            complete your account verification and access the admin portal.
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

      {/* Right Side - Verify Form */}
      <div className="bg-muted/30 flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="bg-card w-full max-w-md rounded-2xl p-8 shadow-xl">
          {!isSuccess ? (
            <>
              <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                    <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h2 className="mb-2 text-3xl font-bold">Verify Your Account</h2>
                <p className="text-muted-foreground">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {verifyMutation.isError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                  {verifyMutation.error?.message ||
                    'Verification failed. Please check your code and try again.'}
                </div>
              )}

              {!userId && (
                <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
                  Invalid verification link. Please{' '}
                  <Link href="/login" className="font-medium underline">
                    login again
                  </Link>
                  .
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <input type="hidden" {...register('userId')} />

                <div className="space-y-2">
                  <Label htmlFor="otpToken">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="otpToken"
                      type="text"
                      placeholder="Enter 6-digit code"
                      className="pl-10 text-center font-mono text-lg tracking-[0.5em]"
                      maxLength={6}
                      {...register('otpToken')}
                    />
                  </div>
                  {errors.otpToken && (
                    <p className="text-sm text-red-500">
                      {errors.otpToken.message}
                    </p>
                  )}
                  {errors.userId && (
                    <p className="text-sm text-red-500">
                      {errors.userId.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-slate-900 text-base hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                  size="lg"
                  disabled={verifyMutation.isPending || !userId}
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-3 text-center">
                <p className="text-muted-foreground text-sm">
                  Didn&apos;t receive the code?{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => {
                      console.log('Resend OTP');
                    }}
                  >
                    Resend code
                  </button>
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign in
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="mb-2 text-3xl font-bold">Account Verified!</h2>
              <p className="text-muted-foreground mb-6">
                Your account has been successfully verified. You can now access
                the Super Admin portal.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="h-12 w-full bg-slate-900 text-base hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                size="lg"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
