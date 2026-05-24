'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Save, Loader2 } from 'lucide-react'
import { WhatsAppConfig } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { useClinicStore } from '@/lib/stores/clinicStore'

export function WhatsAppSettings() {
  const { info } = useClinicStore()
  const [config, setConfig] = useState<Partial<WhatsAppConfig>>({
    api_url: '',
    auth_token: '',
    phone_number_id: '',
    webhook_verify_token: '',
    status: 'NOT_CONNECTED'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!info?.id) return

    const fetchConfig = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('tenant_id', info.id)
        .single()
      
      if (!error && data) {
        setConfig(data as WhatsAppConfig)
      }
      setLoading(false)
    }

    fetchConfig()
  }, [info?.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!info?.id) return

    setSaving(true)
    setMessage(null)

    // Basic URL validation
    if (config.api_url && !/^https?:\/\/.+/.test(config.api_url)) {
      setMessage({ type: 'error', text: 'Please enter a valid API URL starting with http:// or https://' })
      setSaving(false)
      return
    }

    const payload = {
      tenant_id: info.id,
      api_url: config.api_url,
      auth_token: config.auth_token,
      phone_number_id: config.phone_number_id,
      webhook_verify_token: config.webhook_verify_token,
      status: (config.api_url && config.auth_token) ? 'CONNECTED' : 'NOT_CONNECTED'
    }

    let result
    if (config.id) {
      result = await supabase
        .from('whatsapp_config')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', config.id)
    } else {
      result = await supabase
        .from('whatsapp_config')
        .insert([payload])
    }

    if (result.error) {
      setMessage({ type: 'error', text: 'Failed to save configuration.' })
    } else {
      setMessage({ type: 'success', text: 'WhatsApp configuration saved successfully.' })
      setConfig(prev => ({ ...prev, status: payload.status as 'CONNECTED' | 'NOT_CONNECTED' }))
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">WhatsApp Business API Config</h2>
          <p className="text-sm text-text-muted mt-1">Connect your WhatsApp Business account to enable live sending.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
          config.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {config.status === 'CONNECTED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {config.status === 'CONNECTED' ? 'Connected' : 'Not Connected'}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">API URL</label>
          <input 
            type="text"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            placeholder="https://graph.facebook.com/v17.0/..."
            value={config.api_url || ''}
            onChange={e => setConfig({ ...config, api_url: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">Auth Token</label>
          <input 
            type="password"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            placeholder="EAAB..."
            value={config.auth_token || ''}
            onChange={e => setConfig({ ...config, auth_token: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">Phone Number ID</label>
          <input 
            type="text"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            placeholder="123456789012345"
            value={config.phone_number_id || ''}
            onChange={e => setConfig({ ...config, phone_number_id: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1.5">Webhook Verify Token (Optional)</label>
          <input 
            type="text"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            placeholder="my_secret_token"
            value={config.webhook_verify_token || ''}
            onChange={e => setConfig({ ...config, webhook_verify_token: e.target.value })}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {message.text}
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
