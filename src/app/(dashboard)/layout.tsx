'use client'

import React, { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useClinicStore } from '@/lib/stores/clinicStore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { bootstrapData } = useClinicStore()

  useEffect(() => {
    // Bootstrap all clinical data sequentially
    bootstrapData()
  }, [])

  return (
    <div className="flex w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 pl-64 h-screen flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
