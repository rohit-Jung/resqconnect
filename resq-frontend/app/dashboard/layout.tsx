import type React from 'react';

import { DashboardContent } from '@/components/dashboard-content';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/providers/sidebar-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="bg-background min-h-screen">
        <DashboardSidebar />
        <DashboardContent>
          <DashboardHeader />
          <main className="p-8">{children}</main>
        </DashboardContent>
      </div>
    </SidebarProvider>
  );
}
