'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getTokenFromStorage } from '@/lib/hooks/useLocalStorage';

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const tokenFromStorage = getTokenFromStorage('adminToken');
    if (tokenFromStorage) {
      router.replace('/dashboard');
    }
  }, [router]);

  return <>{children}</>;
}
