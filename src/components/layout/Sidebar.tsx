'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  PhoneCall, 
  Send, 
  Target, 
  Settings, 
  LogOut,
  ShieldAlert,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClinicStore } from '@/lib/stores/clinicStore'

const navItems = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/calendar', label: 'Booking Calendar', icon: Calendar },
  { href: '/patients', label: 'Patients CRM', icon: Users },
  { href: '/services', label: 'Clinic Services', icon: Sparkles },
  { href: '/calls', label: 'Call Logs', icon: PhoneCall },
  { href: '/campaigns', label: 'Outreach Campaigns', icon: Send },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/audiences', label: 'Ad Sync Audiences', icon: Target },
  { href: '/settings', label: 'System Settings', icon: Settings },
]


export function Sidebar() {
  const pathname = usePathname()
  const { info } = useClinicStore()

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-base shadow-lg shadow-primary/25">
          G
        </div>
        <div>
          <span className="font-extrabold text-sm tracking-wider uppercase text-text-primary">Guileo AI</span>
          <span className="block text-[8px] font-black uppercase text-primary tracking-widest leading-none">Clinics Tier</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-muted hover:text-text-primary hover:bg-surface2"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-text-muted group-hover:text-primary")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Compliance Badge */}
      <div className="p-4 border-t border-border bg-surface2/30">
        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
          <div>
            <p className="text-[9px] font-black uppercase text-emerald-500 tracking-wider leading-none">HIPAA Compliant</p>
            <p className="text-[8px] text-text-muted mt-0.5 font-medium leading-tight">AES-256 data protection active</p>
          </div>
        </div>

        <button 
          suppressHydrationWarning
          onClick={handleSignOut}
          className="w-full mt-4 flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-danger hover:bg-danger/5 rounded-xl transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
