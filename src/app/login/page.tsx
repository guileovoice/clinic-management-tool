'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Lock, Mail, ShieldAlert, KeyRound, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Welcome back, ${data.name}!`)
        window.location.href = '/overview'
      } else {
        toast.error(data.error || 'Invalid clinical credentials.')
        setIsLoading(false)
      }
    } catch {
      toast.error('Connection error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#09090b] overflow-hidden px-4">
      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase font-mono mt-2">
            Guileo Clinic Portal
          </h1>
          <p className="text-xs text-text-muted max-w-[280px]">
            Access clinical workflows, VAPI voice agents, and safety Gateway metrics.
          </p>
        </div>

        <Card className="p-8 bg-surface border-border/80 backdrop-blur-md shadow-2xl rounded-2xl space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Sign In Required
            </h2>
            <p className="text-[10px] text-text-muted mt-1">Please enter your clinical email and credentials below.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-text-muted" /> Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@scalepods.co"
                className="bg-surface2 border-border/80 h-11 text-xs font-mono font-semibold text-text-primary focus:border-primary/50 transition-all rounded-xl"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-text-muted" /> Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-surface2 border-border/80 h-11 text-xs font-mono font-semibold text-text-primary focus:border-primary/50 transition-all rounded-xl"
              />
            </div>

            {/* Compliance Info Banner */}
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">HIPAA Secured Session</span>
                <span className="text-[9px] text-text-muted leading-relaxed block">
                  All active sessions are fully audited. Access tokens are TLS-secured and automatically rotate.
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-widest h-11 transition-all rounded-xl shadow-lg shadow-primary/10 mt-6"
            >
              {isLoading ? 'Authenticating Secures...' : 'Connect Workspace'}
            </Button>
          </form>
        </Card>

        
      </div>
    </div>
  )
}
