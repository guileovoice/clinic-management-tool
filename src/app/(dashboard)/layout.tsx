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

    // Session validation checker
    const checkSession = () => {
      const hasSession = document.cookie
        .split('; ')
        .some(row => row.trim().startsWith('user_session='))
      if (!hasSession) {
        window.location.href = '/login'
      }
    }

    // Run check immediately on mount
    checkSession()

    // Periodically inspect session cookie status (every 5 seconds)
    const interval = setInterval(checkSession, 5000)
    return () => clearInterval(interval)
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
