import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-8 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
