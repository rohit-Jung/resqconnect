'use client';

import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className={cn('transition-all duration-300', isCollapsed ? 'pl-16' : 'pl-64')}>
      {children}
    </div>
  );
}
