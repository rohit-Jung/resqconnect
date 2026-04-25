'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  getTokenFromStorage,
  removeTokenFromStorage,
} from '@/lib/hooks/useLocalStorage';
import { useOrgProfile } from '@/services/organization/auth.api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const token = getTokenFromStorage('token');
  const hasToken = !!token;

  useEffect(() => {
    if (!hasToken) router.push('/login');
  }, [hasToken, router]);

  const { isLoading, isError } = useOrgProfile(hasToken);

  useEffect(() => {
    if (isError) {
      removeTokenFromStorage('token');
      router.push('/login');
    }
  }, [isError, router]);

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

  if (isError) {
    return null;
  }

  return <>{children}</>;
}
