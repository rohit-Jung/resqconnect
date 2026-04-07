'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/services/user/auth.api';
import {
  TForgotPassword,
  forgotPasswordSchema,
} from '@/validations/auth.schema';

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

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<TForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: TForgotPassword) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: response => {
        setIsSubmitted(true);
        toast.success('Reset code sent to your email');
        const userId = response.data.data?.userId;
        // Store userId for reset password page
        if (userId) {
          sessionStorage.setItem('resetPasswordUserId', userId);
        }
      },
      onError: error => {
        toast.error(parseApiError(error));
      },
    });
  };

  const handleContinueToReset = () => {
    router.push('/reset-password');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Swiss Design Dark Panel */}
      <div className="hidden flex-col justify-between bg-foreground p-12 text-background lg:flex lg:w-[45%]">
        <div className="flex flex-1 flex-col items-start justify-center px-8">
          <span className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-background/40">
            Account Recovery
          </span>
          <h1 className="mb-4 text-5xl font-bold leading-[1.05] tracking-tight">
            RESQ<span className="text-primary">.</span>
          </h1>
          <p className="mb-10 max-w-sm text-lg leading-relaxed text-background/70">
            We will send you a reset code to recover access to your account.
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

      {/* Right Side - Forgot Password Form */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-[55%]">
        <div className="w-full max-w-md">
          {!isSubmitted ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-3xl font-bold">Forgot Password?</h2>
                <p className="text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset code
                </p>
              </div>

              {forgotPasswordMutation.isError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {forgotPasswordMutation.error?.message ||
                    'Failed to send reset email. Please try again.'}
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
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  size="lg"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
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
              <h2 className="mb-2 text-3xl font-bold">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We&apos;ve sent a password reset code to{' '}
                <span className="text-foreground font-medium">
                  {getValues('email')}
                </span>
              </p>
              <p className="text-muted-foreground mb-6 text-sm">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary hover:underline"
                >
                  try another email
                </button>
              </p>
              <Button
                onClick={handleContinueToReset}
                className="h-12 w-full text-base"
                size="lg"
              >
                Continue to Reset Password
              </Button>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
