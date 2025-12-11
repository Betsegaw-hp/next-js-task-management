"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
