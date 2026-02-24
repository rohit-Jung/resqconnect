'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/services/user/auth.api';
import {
  TResetPasswordForm,
  resetPasswordFormSchema,
} from '@/validations/auth.schema';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const resetPasswordMutation = useResetPassword();

  useEffect(() => {
    // Get userId from sessionStorage
    const storedUserId = sessionStorage.getItem('resetPasswordUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      otpToken: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: TResetPasswordForm) => {
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    const apiData = {
      userId,
      otpToken: data.otpToken,
      password: data.password,
    };

    resetPasswordMutation.mutate(apiData, {
      onSuccess: () => {
        setIsSuccess(true);
        // Clear the stored userId
        sessionStorage.removeItem('resetPasswordUserId');
      },
      onError: error => {
        console.error('Reset password failed:', error);
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
            Create a strong password to keep your account secure. Use a mix of
            letters, numbers, and special characters.
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

      {/* Right Side - Reset Password Form */}
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
                <h2 className="mb-2 text-3xl font-bold">Reset Password</h2>
                <p className="text-muted-foreground">
                  Enter the OTP code from your email and create a new password
                </p>
              </div>

              {resetPasswordMutation.isError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {resetPasswordMutation.error?.message ||
                    'Failed to reset password. Please try again.'}
                </div>
              )}

              {!userId && (
                <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                  Session expired. Please{' '}
                  <Link
                    href="/forgot-password"
                    className="font-medium underline"
                  >
                    request a new reset code
                  </Link>
                  .
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otpToken">OTP Code</Label>
                  <div className="relative">
                    <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="otpToken"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      className="pl-10 tracking-widest"
                      maxLength={6}
                      {...register('otpToken')}
                    />
                  </div>
                  {errors.otpToken && (
                    <p className="text-sm text-red-500">
                      {errors.otpToken.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="pr-10 pl-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
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
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="text-muted-foreground bg-muted/50 rounded-lg p-3 text-xs">
                  <p className="mb-1 font-medium">Password requirements:</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>At least 8 characters long</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  size="lg"
                  disabled={resetPasswordMutation.isPending || !userId}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Request new code
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
              <h2 className="mb-2 text-3xl font-bold">Password Reset!</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="h-12 w-full text-base"
                size="lg"
              >
                Sign in
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
