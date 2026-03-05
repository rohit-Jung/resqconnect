'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAdminProfile } from '@/services/super-admin/auth.api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  // Check if token exists in localStorage (client-side only)
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/login');
    } else {
      setHasToken(true);
    }
    setIsChecking(false);
  }, [router]);

  // Validate token by fetching profile
  const { isLoading, isError, error } = useAdminProfile({
    enabled: hasToken,
  });

  // Handle authentication errors (invalid/expired token)
  useEffect(() => {
    if (isError) {
      // Clear invalid token
      localStorage.removeItem('adminToken');
      router.replace('/login');
    }
  }, [isError, router]);

  // Show loading while checking auth
  if (isChecking || (hasToken && isLoading)) {
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

  // If no token or error occurred, don't render children (redirect is happening)
  if (!hasToken || isError) {
    return null;
  }

  return <>{children}</>;
}
