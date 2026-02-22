import type React from 'react';

import { SuperAdminContent } from '@/components/super-admin-content';
import { SuperAdminHeader } from '@/components/super-admin-header';
import { SuperAdminSidebar } from '@/components/super-admin-sidebar';
import { SidebarProvider } from '@/providers/sidebar-provider';

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="bg-background min-h-screen">
        <SuperAdminSidebar />
        <SuperAdminContent>
          <SuperAdminHeader />
          <main className="p-8">{children}</main>
        </SuperAdminContent>
      </div>
    </SidebarProvider>
  );
}
