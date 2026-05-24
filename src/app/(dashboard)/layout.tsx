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
    bootstrapData()

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          window.location.href = '/login'
        }
      } catch {
        window.location.href = '/login'
      }
    }

    checkSession()

    const interval = setInterval(checkSession, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex w-full">
      <Sidebar />

      <div className="flex-1 pl-64 h-screen flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
