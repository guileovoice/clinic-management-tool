'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Bell, 
  ChevronDown, 
  ShieldCheck, 
  Command, 
  Calendar,
  Lock
} from 'lucide-react'
import { format } from 'date-fns'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Topbar() {
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const { info } = useClinicStore()

  const handleSignOut = () => {
    document.cookie = "user_session=; path=/; max-age=0; samesite=lax;"
    window.location.href = '/login'
  }

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur border-b border-border h-16 flex items-center justify-between px-6">
      {/* Patient & Chart Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
          <Input 
            suppressHydrationWarning
            placeholder="Search patients, charts, insurances... (Cmd + K)" 
            className="pl-10 bg-surface2 border-border focus:ring-1 focus:ring-primary h-9 w-full"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 bg-surface rounded border border-border text-[10px] text-text-muted">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dynamic Digital Clock */}
        <div className="hidden xl:flex items-center gap-2 text-sm text-text-muted border-r border-border pr-4 mr-2">
          <Calendar className="w-4 h-4" />
          <span>{mounted ? format(time, 'EEE, MMM d · hh:mm:ss aa') : 'Loading time...'}</span>
        </div>



        {/* HIPAA Verified Secure Lock */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mr-2 shrink-0">
          <ShieldCheck className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">HIPAA SECURED</span>
        </div>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger suppressHydrationWarning asChild>
            <button className="relative p-2 text-text-muted hover:text-text-primary transition-all active:scale-95 outline-none">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute top-1 right-1 w-4 h-4 p-0 flex items-center justify-center bg-danger text-[9px] border-2 border-background animate-pulse">
                  {notificationCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-surface border-border p-2 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-black uppercase tracking-wider text-text-primary">Clinical Alerts</span>
              {notificationCount > 0 && (
                <button 
                  onClick={() => setNotificationCount(0)}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            <DropdownMenuSeparator className="bg-border my-1" />
            
            {notificationCount > 0 ? (
              <div className="space-y-1">
                <DropdownMenuItem className="p-2.5 rounded-xl hover:bg-surface2 focus:bg-surface2 flex flex-col items-start gap-1 cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-black uppercase text-violet-500 tracking-wider">AI Voice Scheduler</span>
                    <span className="text-[8px] text-text-muted font-mono">5m ago</span>
                  </div>
                  <p className="text-xs text-text-primary leading-tight font-medium">
                    Carlos Mendes scheduled an Emergency Appointment via Voice AI.
                  </p>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="p-2.5 rounded-xl hover:bg-surface2 focus:bg-surface2 flex flex-col items-start gap-1 cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Insurance Auto-Check</span>
                    <span className="text-[8px] text-text-muted font-mono">18m ago</span>
                  </div>
                  <p className="text-xs text-text-primary leading-tight font-medium">
                    Delta Dental policy for patient Maria Silva has been auto-verified.
                  </p>
                </DropdownMenuItem>

                <DropdownMenuItem className="p-2.5 rounded-xl hover:bg-surface2 focus:bg-surface2 flex flex-col items-start gap-1 cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">No-Show Triggered</span>
                    <span className="text-[8px] text-text-muted font-mono">45m ago</span>
                  </div>
                  <p className="text-xs text-text-primary leading-tight font-medium">
                    SMS appointment reminder sent to Carlos Mendes (24h safety).
                  </p>
                </DropdownMenuItem>
              </div>
            ) : (
              <div className="p-6 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                🎉 No new clinical alerts!
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clinic Location Trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-border hover:bg-surface2 transition-all cursor-pointer outline-none">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-extrabold uppercase shrink-0">
                {mounted ? info.name.split(' ').map(n => n[0]).join('') : ''}
              </div>
              <div className="hidden md:block text-left shrink-0 max-w-[160px]">
                <p className="text-[10px] font-black text-text-primary uppercase tracking-wide leading-none truncate">{info.name}</p>
                <p className="text-[8px] text-text-muted mt-0.5 font-bold uppercase tracking-widest truncate">{info.category}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted mr-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-surface border-border p-2 rounded-2xl shadow-xl space-y-1">
            <div className="p-2 flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">{info.name}</span>
              <span className="text-[8px] text-text-muted font-bold uppercase tracking-widest">{info.category}</span>
            </div>
            
            <DropdownMenuSeparator className="bg-border my-1" />
            
            <div className="p-2 flex flex-col gap-1.5 text-[10px] text-text-muted font-mono">
              <div className="truncate">📍 {info.address}</div>
              <div>📞 {info.phone}</div>
            </div>

            <DropdownMenuSeparator className="bg-border my-1" />

            <DropdownMenuItem 
              onClick={handleSignOut}
              className="p-2 rounded-xl text-danger hover:bg-danger/5 focus:bg-danger/5 flex items-center gap-2.5 cursor-pointer font-bold text-xs uppercase tracking-wider"
            >
              <Lock className="w-4 h-4 shrink-0" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
