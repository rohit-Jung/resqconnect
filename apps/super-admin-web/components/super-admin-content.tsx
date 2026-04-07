'use client';

import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';

export function SuperAdminContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        'transition-all duration-200',
        isCollapsed ? 'pl-16' : 'pl-56'
      )}
    >
      {children}
    </div>
  );
}
