'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        toast.error(data.error || 'Invalid credentials.')
        setIsLoading(false)
      }
    } catch {
      toast.error('Connection error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0d0d14',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle radial glow behind card */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(ellipse at center, rgba(108,60,225,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#16161f',
        borderRadius: '16px',
        border: '1px solid #2a2a3a',
        padding: '40px 36px 36px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo + Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* G Icon */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c4ff0 0%, #5b2fe0 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 8px 24px rgba(108,60,225,0.35)',
          }}>
            <span style={{
              color: '#fff',
              fontSize: '22px',
              fontWeight: '800',
              letterSpacing: '-0.5px',
            }}>G</span>
          </div>

          {/* GuileoAI */}
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#f1f1f3', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>Guileo</span>
            <span style={{ color: '#8b6cf7', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>AI</span>
          </div>

          <p style={{ color: '#7b7b95', fontSize: '13px', fontWeight: '400', margin: 0 }}>
            Clinic Dashboard
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#9090a8',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Email
            </label>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Mail style={{
                position: 'absolute',
                left: '14px',
                color: '#5c5c72',
                width: '16px',
                height: '16px',
                flexShrink: 0,
              }} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@clinic.com"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  backgroundColor: '#1e1e2a',
                  border: '1px solid #2e2e3f',
                  borderRadius: '8px',
                  color: '#d0d0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6c3ce1' }}
                onBlur={(e) => { e.target.style.borderColor = '#2e2e3f' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#9090a8',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Lock style={{
                position: 'absolute',
                left: '14px',
                color: '#5c5c72',
                width: '16px',
                height: '16px',
                flexShrink: 0,
              }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '11px 44px 11px 42px',
                  backgroundColor: '#1e1e2a',
                  border: '1px solid #2e2e3f',
                  borderRadius: '8px',
                  color: '#d0d0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6c3ce1' }}
                onBlur={(e) => { e.target.style.borderColor = '#2e2e3f' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5c5c72',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword
                  ? <EyeOff style={{ width: '16px', height: '16px' }} />
                  : <Eye style={{ width: '16px', height: '16px' }} />
                }
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '13px 20px',
              background: isLoading
                ? 'linear-gradient(135deg, #5b2fe0 0%, #4a26b8 100%)'
                : 'linear-gradient(135deg, #7c4ff0 0%, #5b2fe0 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: '0 4px 20px rgba(108,60,225,0.35)',
              opacity: isLoading ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            }}
          >
            {isLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Copyright Footer */}
      <p style={{
        marginTop: '28px',
        color: '#4a4a60',
        fontSize: '12px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        © 2026 Guileo AI. All rights reserved.
      </p>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
