'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { ArrowLeft, CheckCircle, Loader2, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/services/user/auth.api';
import { TForgotPassword, forgotPasswordSchema } from '@/validations/auth.schema';

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
        const userId = response.data.data?.userId;
        // Store userId for reset password page
        if (userId) {
          sessionStorage.setItem('resetPasswordUserId', userId);
        }
      },
      onError: error => {
        console.error('Forgot password failed:', error);
      },
    });
  };

  const handleContinueToReset = () => {
    router.push('/reset-password');
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
            Don&apos;t worry! We&apos;ll help you recover access to your account securely and
            quickly.
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

      {/* Right Side - Forgot Password Form */}
      <div className="bg-muted/30 flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="bg-card w-full max-w-md rounded-2xl p-8 shadow-xl">
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
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
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
              <h2 className="mb-2 text-3xl font-bold">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We&apos;ve sent a password reset code to{' '}
                <span className="text-foreground font-medium">{getValues('email')}</span>
              </p>
              <p className="text-muted-foreground mb-6 text-sm">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-blue-600 hover:underline"
                >
                  try another email
                </button>
              </p>
              <Button onClick={handleContinueToReset} className="h-12 w-full text-base" size="lg">
                Continue to Reset Password
              </Button>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign in
                </Link>
              </div>
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
