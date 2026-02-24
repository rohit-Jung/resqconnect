'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgVerify } from '@/services/organization/auth.api';
import { useVerifyUser } from '@/services/user/auth.api';
import { TVerifyUser, verifyUserSchema } from '@/validations/auth.schema';

function VerifyPageContent() {
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const verifyMutation = useOrgVerify();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TVerifyUser>({
    resolver: zodResolver(verifyUserSchema),
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

  const onSubmit = (data: TVerifyUser) => {
    verifyMutation.mutate(data, {
      onSuccess: response => {
        setIsSuccess(true);
        // If token is returned, store it
        if (response.data.data?.token) {
          localStorage.setItem('token', response.data.data.token);
        }
      },
      onError: error => {
        console.error('Verification failed:', error);
      },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Red Background */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#C53030] to-[#7A1F1F] p-12 text-white lg:flex lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <ShieldCheck className="h-16 w-16" />
          </div>
          <h1 className="mb-2 text-5xl font-bold">ResqConnect</h1>
          <p className="mb-8 text-xl opacity-90">Emergency Response Platform</p>

          <p className="mb-16 max-w-md text-lg leading-relaxed opacity-90">
            We&apos;ve sent a verification code to your email. Enter the code to
            complete your account setup and start using ResqConnect.
          </p>

          <div className="flex gap-16">
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">24/7</p>
              <p className="text-sm opacity-90">Support</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">99.9%</p>
              <p className="text-sm opacity-90">Uptime</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-4xl font-bold">30s</p>
              <p className="text-sm opacity-90">Response</p>
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
                  <div className="rounded-full bg-blue-100 p-3">
                    <KeyRound className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h2 className="mb-2 text-3xl font-bold">Verify Your Account</h2>
                <p className="text-muted-foreground">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {verifyMutation.isError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {verifyMutation.error?.message ||
                    'Verification failed. Please check your code and try again.'}
                </div>
              )}

              {!userId && (
                <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                  Invalid verification link. Please{' '}
                  <Link href="/signup" className="font-medium underline">
                    sign up again
                  </Link>{' '}
                  or{' '}
                  <Link href="/login" className="font-medium underline">
                    login
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
                  className="h-12 w-full text-base"
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
                    className="text-blue-600 hover:underline"
                    onClick={() => {
                      // TODO: Implement resend OTP functionality
                      console.log('Resend OTP');
                    }}
                  >
                    Resend code
                  </button>
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign in
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="mb-2 text-3xl font-bold">Account Verified!</h2>
              <p className="text-muted-foreground mb-6">
                Your account has been successfully verified. You can now access
                all features of ResqConnect.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="h-12 w-full text-base"
                size="lg"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="text-muted-foreground absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-6 text-sm lg:right-1/2 lg:left-auto lg:translate-x-1/2">
        <Link href="/help" className="hover:text-foreground">
          Help Center
        </Link>
        <Link href="/support" className="hover:text-foreground">
          Contact Support
        </Link>
        <Link href="/guide" className="hover:text-foreground">
          Emergency Guide
        </Link>
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
