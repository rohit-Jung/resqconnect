'use client';

import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileCheck,
  LayoutDashboard,
  Navigation,
  Settings,
  Smartphone,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Service Providers',
    href: '/dashboard/service-providers',
    icon: Users,
  },
  {
    name: 'Document Verification',
    href: '/dashboard/verifications',
    icon: FileCheck,
  },
  { name: 'Mobile Apps', href: '/dashboard/mobile-apps', icon: Smartphone },
  {
    name: 'Emergency Reports',
    href: '/dashboard/emergency-reports',
    icon: AlertTriangle,
  },
  { name: 'Live Tracking', href: '/dashboard/live-tracking', icon: Navigation },
  {
    name: 'Plans & Billing',
    href: '/dashboard/plans',
    icon: CreditCard,
  },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-200',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-sidebar-border',
            isCollapsed ? 'justify-center px-2' : 'px-5'
          )}
        >
          {!isCollapsed ? (
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">
              RESQ<span className="text-sidebar-primary">.</span>{' '}
              <span className="text-xs font-medium text-sidebar-foreground/60">
                ORG
              </span>
            </span>
          ) : (
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">
              R<span className="text-sidebar-primary">.</span>
            </span>
          )}
        </div>

        {/* System label */}
        {!isCollapsed && (
          <div className="px-5 pt-4 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/40">
              NAVIGATION
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-px px-2">
          {navigation.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  'flex items-center text-sm transition-colors duration-100',
                  isCollapsed
                    ? 'justify-center px-2 py-2.5'
                    : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium dark:bg-sidebar-primary dark:text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'w-full text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
                  Collapse
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
