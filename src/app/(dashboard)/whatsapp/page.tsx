'use client'

import React, { useState } from 'react'
import { MessageSquare, Settings } from 'lucide-react'
import { WhatsAppPanel } from '@/components/whatsapp/WhatsAppPanel'
import { WhatsAppSettings } from '@/components/whatsapp/WhatsAppSettings'

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'chats' | 'settings'>('chats')

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tight">WhatsApp Connectivity</h1>
          <p className="text-text-muted mt-1">Manage outbound appointment notifications and inbound replies.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${
            activeTab === 'chats'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chats
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {activeTab === 'chats' ? <WhatsAppPanel /> : <WhatsAppSettings />}
      </div>
    </div>
  )
}
