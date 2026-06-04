import type React from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { DashboardContent } from '@/components/dashboard-content';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { OrgDynamicTitle } from '@/components/org-dynamic-title';
import { SidebarProvider } from '@/providers/sidebar-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <OrgDynamicTitle />
      <SidebarProvider>
        <div className="bg-background min-h-screen">
          <DashboardSidebar />
          <DashboardContent>
            <DashboardHeader />
            <main className="p-8">{children}</main>
          </DashboardContent>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
