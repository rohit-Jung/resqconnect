'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { ArrowLeft, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setTokenToStorage } from '@/lib/hooks/useLocalStorage';
import { useOrgVerify } from '@/services/organization/auth.api';
import { useVerifyUser } from '@/services/user/auth.api';
import { TVerifyUser, verifyUserSchema } from '@/validations/auth.schema';

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
        toast.success('Account verified successfully');
        // If token is returned, store it
        if (response.data.data?.token) {
          setTokenToStorage('token', response.data.data.token);
        }
      },
      onError: error => {
        toast.error(parseApiError(error));
      },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Swiss Design Dark Panel */}
      <div className="hidden flex-col justify-between bg-foreground p-12 text-background lg:flex lg:w-[45%]">
        <div className="flex flex-1 flex-col items-start justify-center px-8">
          <span className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-background/40">
            Account Verification
          </span>
          <h1 className="mb-4 text-5xl font-bold leading-[1.05] tracking-tight">
            RESQ<span className="text-primary">.</span>
          </h1>
          <p className="mb-10 max-w-sm text-lg leading-relaxed text-background/70">
            Verify your email to complete account setup and access the
            dashboard.
          </p>
          <div className="w-full max-w-xs border-t border-background/10 pt-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                  Support
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">99.9%</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                  Uptime
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">30s</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-background/50">
                  Response
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-background/30">
            Nepals Emergency Response Network
          </span>
        </div>
      </div>

      {/* Right Side - Verify Form */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-[55%]">
        <div className="w-full max-w-md">
          {!isSuccess ? (
            <>
              <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <KeyRound className="h-8 w-8 text-primary" />
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
                    className="text-primary hover:underline"
                    onClick={() => {
                      console.log('Resend OTP');
                    }}
                  >
                    Resend code
                  </button>
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-primary hover:underline"
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
