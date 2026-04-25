'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  getTokenFromStorage,
  removeTokenFromStorage,
  useTokenFromStorage,
} from '@/lib/hooks/useLocalStorage';
import { useAdminProfile } from '@/services/super-admin/auth.api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const token = useTokenFromStorage('adminToken');
  const hasToken = token !== null;

  // Redirect unauthenticated clients.
  useEffect(() => {
    // Best-effort synchronous read for first paint.
    const tokenNow = getTokenFromStorage('adminToken');
    if (!tokenNow) {
      router.replace('/login');
    }
  }, [router]);

  // Validate token by fetching profile
  const { isLoading, isError } = useAdminProfile({
    enabled: hasToken === true,
  });

  // Handle authentication errors (invalid/expired token)
  useEffect(() => {
    if (isError) {
      // Clear invalid token
      removeTokenFromStorage('adminToken');
      router.replace('/login');
    }
  }, [isError, router]);

  // Show loading while checking auth
  if (!hasToken || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // If error occurred, don't render children (redirect is happening)
  if (isError) {
    return null;
  }

  return <>{children}</>;
}
