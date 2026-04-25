'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getTokenFromStorage } from '@/lib/hooks/useLocalStorage';

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const token = getTokenFromStorage('token');
  const hasToken = !!token;

  useEffect(() => {
    if (hasToken) {
      router.push('/dashboard');
    }
  }, [hasToken, router]);

  if (hasToken) return null;

  return <>{children}</>;
}
