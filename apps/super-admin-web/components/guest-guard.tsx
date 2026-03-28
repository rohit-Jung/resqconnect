'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  if (typeof window !== 'undefined' && localStorage.getItem('adminToken')) {
    return null;
  }

  return <>{children}</>;
}
