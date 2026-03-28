'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  // If token exists, render nothing (redirecting)
  if (typeof window !== 'undefined' && localStorage.getItem('token')) {
    return null;
  }

  // if (!token) {
  //   return null;
  // }

  return <>{children}</>;
}
