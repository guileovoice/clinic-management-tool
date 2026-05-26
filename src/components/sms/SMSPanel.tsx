'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useClinicStore } from '@/lib/stores/clinicStore'
import {
  Search,
  Send,
  CheckCircle2,
  MessageSquare,
  Settings as SettingsIcon,
  ShieldCheck,
  ShieldX,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface SMSMessage {
  id: string
  tenant_id: string
  phone_number: string
  contact_name: string
  direction: 'inbound' | 'outbound'
  message_body: string
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received'
  created_at: string
}

interface ChatContact {
  phone_number: string
  contact_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

interface PatientConsent {
  essential: boolean
  marketing: boolean
  intelligence: boolean
}

export function SMSPanel() {
  const { info } = useClinicStore()
  const tenantId = info?.id || '395b50b9-9504-4bda-bd38-7ce5b53e7aa0'

  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat')

  // Chat states
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMarketingMessage, setIsMarketingMessage] = useState(false)

  // New Chat states
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const [newChatName, setNewChatName] = useState('')

  // Patient details & consent
  const [patientConsent, setPatientConsent] = useState<PatientConsent | null>(null)
  const [patientName, setPatientName] = useState<string>('')

  // Settings states
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [twilioNumber, setTwilioNumber] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load Twilio Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('sms_config')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (error) {
          console.error('Error loading SMS settings:', error)
        } else if (data) {
          setAccountSid(data.account_sid || '')
          setAuthToken(data.auth_token || '')
          setTwilioNumber(data.twilio_number || '')
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadSettings()
  }, [tenantId])

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('sms_config')
        .upsert({
          tenant_id: tenantId,
          account_sid: accountSid,
          auth_token: authToken,
          twilio_number: twilioNumber,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

      if (error) {
        toast.error(`Failed to save settings: ${error.message}`)
      } else {
        setSettingsSaved(true)
        toast.success('Twilio credentials updated successfully!')
        setTimeout(() => setSettingsSaved(false), 3000)
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Load Contacts
  useEffect(() => {
    async function loadContacts() {
      try {
        const { data, error } = await supabase
          .from('sms_messages')
          .select('phone_number, contact_name, message_body, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading contacts:', error)
          return
        }

        if (data) {
          const contactMap = new Map<string, ChatContact>()
          data.forEach(msg => {
            if (!contactMap.has(msg.phone_number)) {
              contactMap.set(msg.phone_number, {
                phone_number: msg.phone_number,
                contact_name: msg.contact_name || msg.phone_number,
                last_message: msg.message_body,
                last_message_at: msg.created_at,
                unread_count: 0
              })
            }
          })
          setContacts(Array.from(contactMap.values()))
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadContacts()

    // Subscribe to new messages for real-time
    const channel = supabase
      .channel('sms-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sms_messages', filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as SMSMessage

            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              if (selectedPhone === newMsg.phone_number) {
                return [...prev, newMsg]
              }
              return prev
            })

            setContacts(prev => {
              const existing = prev.find(c => c.phone_number === newMsg.phone_number)
              if (existing) {
                return [
                  { ...existing, last_message: newMsg.message_body, last_message_at: newMsg.created_at },
                  ...prev.filter(c => c.phone_number !== newMsg.phone_number)
                ]
              } else {
                return [
                  {
                    phone_number: newMsg.phone_number,
                    contact_name: newMsg.contact_name || newMsg.phone_number,
                    last_message: newMsg.message_body,
                    last_message_at: newMsg.created_at,
                    unread_count: 0
                  },
                  ...prev
                ]
              }
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as SMSMessage
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m))
            setContacts(prev => prev.map(c => c.phone_number === updatedMsg.phone_number ? { ...c, last_message: updatedMsg.message_body, last_message_at: updatedMsg.created_at } : c))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, selectedPhone])

  // Load Messages for selected contact & check consents
  useEffect(() => {
    if (!selectedPhone) return

    async function loadMessages() {
      const { data } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('phone_number', selectedPhone)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data as SMSMessage[])
      }
    }

    async function checkConsent() {
      try {
        const { data } = await supabase
          .from('patients')
          .select('name, consents')
          .eq('phone', selectedPhone)
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (data) {
          setPatientName(data.name || '')
          setPatientConsent(data.consents as PatientConsent)
        } else {
          setPatientName('')
          setPatientConsent(null)
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadMessages()
    checkConsent()
  }, [selectedPhone, tenantId])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartNewChat = () => {
    if (!newChatPhone.trim()) return
    const formattedPhone = newChatPhone.trim()
    const name = newChatName.trim() || formattedPhone

    const existing = contacts.find(c => c.phone_number === formattedPhone)
    if (!existing) {
      const newContact: ChatContact = {
        phone_number: formattedPhone,
        contact_name: name,
        last_message: 'New chat initiated',
        last_message_at: new Date().toISOString(),
        unread_count: 0
      }
      setContacts([newContact, ...contacts])
    }

    setSelectedPhone(formattedPhone)
    setShowNewChatModal(false)
    setNewChatPhone('')
    setNewChatName('')
  }

  // Send SMS
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedPhone) return

    // 1. Consent Check for Marketing messages
    if (isMarketingMessage && patientConsent && !patientConsent.marketing) {
      toast.error('Cannot send marketing content. Patient has opted out.')
      return
    }

    const contactNameStr = contacts.find(c => c.phone_number === selectedPhone)?.contact_name || selectedPhone
    const outMsg = {
      tenant_id: tenantId,
      phone_number: selectedPhone,
      contact_name: contactNameStr,
      direction: 'outbound',
      message_body: inputText,
      status: 'queued'
    }

    setInputText('')

    // Insert outbound message to DB (Will trigger n8n flow via DB webhooks)
    const { data: insertedMsg, error } = await supabase
      .from('sms_messages')
      .insert(outMsg)
      .select()
      .single()

    if (error) {
      toast.error(`Failed to send: ${error.message}`)
      return
    }

    // In demo mode (no Twilio SID saved) update status to 'sent' after 1s and simulate inbound reply
    if (!accountSid && insertedMsg) {
      setTimeout(async () => {
        await supabase
          .from('sms_messages')
          .update({ status: 'sent' })
          .eq('id', insertedMsg.id)
      }, 1000)

      setTimeout(async () => {
        await supabase.from('sms_messages').insert({
          tenant_id: tenantId,
          phone_number: selectedPhone,
          contact_name: contactNameStr,
          direction: 'inbound',
          message_body: `Simulated Reply: Received message! Configure your Twilio credentials to route real SMS.`,
          status: 'received'
        })
      }, 4000)
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-[#111B21] rounded-2xl overflow-hidden shadow-2xl border border-[#222E35]">

      {/* Left Sidebar - Chat Contact List & Tab Toggle */}
      <div className="w-full md:w-[350px] flex flex-col border-r border-[#222E35] bg-[#111B21] shrink-0">
        <div className="flex p-4 border-b border-[#222E35] gap-2 bg-[#202C33]">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'bg-emerald-600 text-white' : 'bg-[#2A3942] hover:bg-[#202C33] text-[#AEBAC1]'}`}
          >
            <MessageSquare size={16} /> Chat
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'bg-[#2A3942] hover:bg-[#202C33] text-[#AEBAC1]'}`}
          >
            <SettingsIcon size={16} /> Settings
          </button>
        </div>

        {activeTab === 'chat' && (
          <>
            <div className="p-4 border-b border-[#222E35] flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEBAC1]" />
                <input
                  type="text"
                  placeholder="Search SMS..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#202C33] border-none outline-none rounded-lg pl-9 pr-4 py-2 text-sm text-[#E9EDEF] placeholder:text-[#AEBAC1]"
                />
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-all active:scale-95"
              >
                + New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.filter(c => c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone_number.includes(searchQuery)).map(contact => (
                <div
                  key={contact.phone_number}
                  onClick={() => setSelectedPhone(contact.phone_number)}
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-[#202C33] transition-colors border-b border-[#222E35] ${selectedPhone === contact.phone_number ? 'bg-[#2A3942]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0 text-emerald-500 font-bold">
                    {contact.contact_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-[#E9EDEF] truncate">{contact.contact_name}</h3>
                      <span className="text-[10px] text-[#8696A0]">
                        {format(new Date(contact.last_message_at), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-[#8696A0] truncate">{contact.last_message}</p>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && (
                <div className="p-8 text-center text-[#8696A0] text-sm">
                  No active SMS logs found.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 flex flex-col bg-[#0B141A] relative h-full">
        {/* WhatsApp Default Wallpaper Overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yO/r/FsWUvqSpAoa.png")' }}></div>

        {activeTab === 'settings' ? (
          <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto z-10">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wide">Twilio Configuration</h4>
                <p className="text-xs text-[#8696A0] mt-1 leading-relaxed">
                  Provide credentials from your Twilio Console. Webhooks will use these to route outbound/inbound SMS and process live updates. Leave blank to run in mock sandbox mode.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#E9EDEF] mb-6">SMS Integrations Config</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#8696A0]">Account SID</label>
                <input
                  type="text"
                  value={accountSid}
                  onChange={e => setAccountSid(e.target.value)}
                  placeholder="AC..."
                  className="w-full bg-[#202C33] border border-[#222E35] rounded-lg px-4 py-2 text-[#E9EDEF] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#8696A0]">Auth Token</label>
                <input
                  type="password"
                  value={authToken}
                  onChange={e => setAuthToken(e.target.value)}
                  placeholder="Enter Auth Token"
                  className="w-full bg-[#202C33] border border-[#222E35] rounded-lg px-4 py-2 text-[#E9EDEF] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#8696A0]">Twilio Number (SMS Enabled)</label>
                <input
                  type="text"
                  value={twilioNumber}
                  onChange={e => setTwilioNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-[#202C33] border border-[#222E35] rounded-lg px-4 py-2 text-[#E9EDEF] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2"
                >
                  {settingsSaved ? <><CheckCircle2 size={18} /> Credentials Updated!</> : 'Save Credentials'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          selectedPhone ? (
            <>
              {/* Chat View Header */}
              <div className="h-16 border-b border-[#222E35] bg-[#202C33] flex items-center justify-between px-6 flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    {patientName ? patientName.substring(0, 2).toUpperCase() : selectedPhone.substring(selectedPhone.length - 2)}
                  </div>
                  <div>
                    <h2 className="font-bold text-[#E9EDEF]">{patientName || 'Unknown Patient'}</h2>
                    <p className="text-xs text-[#8696A0]">{selectedPhone}</p>
                  </div>
                </div>

                {/* Compliance & Consent Badges */}
                <div className="flex items-center gap-3">
                  {patientConsent ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8696A0] uppercase font-bold tracking-wider">Consent Tier:</span>
                      {patientConsent.marketing ? (
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/20">
                          <ShieldCheck size={12} /> Marketing OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-bold border border-red-500/20">
                          <ShieldX size={12} /> Marketing Blocked
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#8696A0] italic flex items-center gap-1">
                      <Info size={12} /> Auto-Essential Alerts Only
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-950/20 z-10">
                {messages.map(msg => {
                  const isOutbound = msg.direction === 'outbound'
                  return (
                    <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-3 shadow-md ${isOutbound ? 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none' : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none'}`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message_body}</p>
                        <div className="flex justify-end items-center gap-2 mt-1.5 border-t border-white/10 pt-1">
                          <span className="text-[9px] text-[#AEBAC1]/60">
                            {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                          </span>
                          {isOutbound && (
                            <span className={`text-[9px] font-bold uppercase ${msg.status === 'delivered' ? 'text-emerald-400' : msg.status === 'failed' ? 'text-red-400' : 'text-[#AEBAC1]/80'}`}>
                              {msg.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#202C33] flex items-center gap-3 z-10">
                <div className="flex items-center gap-2 pr-2 border-r border-[#222E35]">
                  <input
                    type="checkbox"
                    id="marketing-check"
                    checked={isMarketingMessage}
                    onChange={e => setIsMarketingMessage(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="marketing-check" className="text-xs text-[#AEBAC1] select-none cursor-pointer whitespace-nowrap">
                    Marketing Content
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Type an SMS message..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                  className="flex-1 bg-[#2A3942] border-none outline-none text-[#E9EDEF] placeholder:text-[#AEBAC1] rounded-lg px-4 py-2.5 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8696A0] gap-3 z-10">
              <MessageSquare size={48} className="text-[#222E35]" />
              <p className="text-sm">Select an active SMS thread or save credentials in Settings.</p>
            </div>
          )
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#222E35] border border-[#2A3942] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#E9EDEF] mb-4">Start New Chat Thread</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8696A0] uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={newChatPhone}
                  onChange={e => setNewChatPhone(e.target.value)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-4 py-2.5 text-sm text-[#E9EDEF] focus:border-emerald-600 focus:outline-none placeholder:text-[#AEBAC1]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8696A0] uppercase tracking-wider mb-1">Contact Name (Optional)</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newChatName}
                  onChange={e => setNewChatName(e.target.value)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-4 py-2.5 text-sm text-[#E9EDEF] focus:border-emerald-600 focus:outline-none placeholder:text-[#AEBAC1]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartNewChat}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
