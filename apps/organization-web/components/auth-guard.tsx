'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = getTokenFromStorage('token');
    if (!token) {
      router.push('/login');
    } else {
      setHasToken(true);
    }
    setIsChecking(false);
  }, [router]);

  const { isLoading, isError } = useOrgProfile(hasToken);

  useEffect(() => {
    if (isError) {
      removeTokenFromStorage('token');
      router.push('/login');
    }
  }, [isError, router]);

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

  if (!hasToken || isError) {
    return null;
  }

  return <>{children}</>;
}
