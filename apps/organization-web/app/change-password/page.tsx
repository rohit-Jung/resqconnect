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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChangePassword } from '@/services/user/auth.api';
import {
  TChangePassword,
  changePasswordSchema,
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

export default function ChangePasswordPage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: TChangePassword) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
        toast.success('Password changed successfully');
        reset();
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
            Account Security
          </span>
          <h1 className="mb-4 text-5xl font-bold leading-[1.05] tracking-tight">
            RESQ<span className="text-primary">.</span>
          </h1>
          <p className="mb-10 max-w-sm text-lg leading-relaxed text-background/70">
            Keep your account secure by updating your password regularly.
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

      {/* Right Side - Change Password Form */}
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
                <h2 className="mb-2 text-3xl font-bold">Change Password</h2>
                <p className="text-muted-foreground">
                  Enter your current password and choose a new one
                </p>
              </div>

              {changePasswordMutation.isError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {changePasswordMutation.error?.message ||
                    'Failed to change password. Please check your current password.'}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className="pr-10 pl-10"
                      {...register('oldPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.oldPassword && (
                    <p className="text-sm text-red-500">
                      {errors.oldPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="pr-10 pl-10"
                      {...register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500">
                      {errors.newPassword.message}
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
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Settings
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
              <h2 className="mb-2 text-3xl font-bold">Password Changed!</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully updated. Your account is now
                more secure.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="h-12 w-full text-base"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="h-12 w-full text-base"
                  size="lg"
                >
                  Change Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
