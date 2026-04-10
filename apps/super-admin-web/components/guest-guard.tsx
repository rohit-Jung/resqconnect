'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const tokenFromStorage = localStorage.getItem('adminToken');
    setToken(tokenFromStorage);
    if (tokenFromStorage) {
      router.push('/dashboard');
    }
  }, [router]);

  // During SSR, render children normally
  // After hydration on client, redirect if token exists
  if (!isClient) {
    return <>{children}</>;
  }

  // If token exists after hydration, render nothing (redirecting)
  if (token) {
    return null;
  }

  return <>{children}</>;
}
