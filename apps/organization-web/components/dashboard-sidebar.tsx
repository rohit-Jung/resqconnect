'use client';

import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Navigation,
  Settings,
  Smartphone,
  Users,
} from 'lucide-react';
import Image from 'next/image';
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
  { name: 'Mobile Apps', href: '/dashboard/mobile-apps', icon: Smartphone },
  { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
  {
    name: 'Emergency Reports',
    href: '/dashboard/emergency-reports',
    icon: AlertTriangle,
  },
  { name: 'Live Tracking', href: '/dashboard/live-tracking', icon: Navigation },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        'bg-card fixed top-0 left-0 z-40 h-screen border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center border-b',
            isCollapsed ? 'justify-center px-2' : 'gap-2 px-6'
          )}
        >
          <Image
            src="/resq-connect-logo.png"
            alt="ResQ Connect"
            width={32}
            height={32}
            className="rounded-lg"
          />
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight">
              ResQ <span className="text-primary">Connect</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navigation.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  isCollapsed
                    ? 'justify-center px-2 py-2.5'
                    : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'w-full',
              isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
