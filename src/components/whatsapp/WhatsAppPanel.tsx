'use client'

import React, { useState, useEffect } from 'react'
import { Search, MoreVertical, Send, Check, CheckCheck, Clock } from 'lucide-react'
import { WhatsAppMessage, WhatsAppInbound } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { useClinicStore } from '@/lib/stores/clinicStore'

export function WhatsAppPanel() {
  const { info } = useClinicStore()
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [inboundCount, setInboundCount] = useState<number>(0)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Dummy data fallback
  const dummyMessages: WhatsAppMessage[] = [
    {
      id: '1',
      tenant_id: 'dummy',
      contact_name: 'John Doe',
      phone_number: '+15551234567',
      direction: 'outbound',
      message_body: 'Hi John, your appointment for tomorrow is confirmed!',
      status: 'read',
      appointment_status: 'Confirmed',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      tenant_id: 'dummy',
      contact_name: 'Jane Smith',
      phone_number: '+15559876543',
      direction: 'outbound',
      message_body: 'Hello Jane, please remember to bring your forms.',
      status: 'delivered',
      appointment_status: 'Confirmed',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '3',
      tenant_id: 'dummy',
      contact_name: 'Alice Johnson',
      phone_number: '+15554567890',
      direction: 'outbound',
      message_body: 'Hi Alice, your appointment has been cancelled as requested.',
      status: 'sent',
      appointment_status: 'Cancelled',
      timestamp: new Date(Date.now() - 300000).toISOString(),
    }
  ]

  useEffect(() => {
    if (!info?.id) return

    const fetchMessages = async () => {
      const { data: outMsgs, error: outErr } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('tenant_id', info.id)
        .order('timestamp', { ascending: false })
      
      if (!outErr && outMsgs && outMsgs.length > 0) {
        setMessages(outMsgs as WhatsAppMessage[])
        setSelectedContact(outMsgs[0].phone_number)
      } else {
        setMessages(dummyMessages)
        setSelectedContact(dummyMessages[0].phone_number)
      }

      const { count, error: inErr } = await supabase
        .from('whatsapp_inbound')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', info.id)
        .eq('is_read', false)
      
      if (!inErr && count !== null) {
        setInboundCount(count)
      }
    }

    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const newMsg = payload.new as WhatsAppMessage
          if (newMsg.tenant_id === info.id) {
            setMessages((prev) => [newMsg, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_inbound' },
        (payload) => {
          const newIn = payload.new as WhatsAppInbound
          if (newIn.tenant_id === info.id && !newIn.is_read) {
            setInboundCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [info?.id])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!draftMessage.trim() || !selectedContactInfo || !info?.id) return

    setIsSending(true)

    // Insert Outbound message
    const outboundMsg = {
      tenant_id: info.id,
      contact_name: selectedContactInfo.contact_name,
      phone_number: selectedContactInfo.phone_number,
      direction: 'outbound',
      message_body: draftMessage.trim(),
      status: 'sent',
      appointment_status: selectedContactInfo.appointment_status
    }

    const { error } = await supabase.from('whatsapp_messages').insert([outboundMsg])
    
    if (!error) {
      setDraftMessage('')
      
      // Simulate an inbound response after 3 seconds for dummy testing
      setTimeout(async () => {
        const inboundMsg = {
          tenant_id: info.id,
          contact_name: selectedContactInfo.contact_name,
          phone_number: selectedContactInfo.phone_number,
          direction: 'inbound',
          message_body: 'This is an auto-reply dummy message for testing!',
          status: 'delivered',
          appointment_status: selectedContactInfo.appointment_status
        }
        await supabase.from('whatsapp_messages').insert([inboundMsg])

        // Also add to inbound table for badge tracking
        await supabase.from('whatsapp_inbound').insert([{
          tenant_id: info.id,
          phone_number: selectedContactInfo.phone_number,
          message_body: 'This is an auto-reply dummy message for testing!',
          is_read: false
        }])
      }, 3000)
    }

    setIsSending(false)
  }

  // Group by contacts
  const contactsMap = new Map<string, WhatsAppMessage>()
  messages.forEach(m => {
    if (!contactsMap.has(m.phone_number)) {
      contactsMap.set(m.phone_number, m)
    }
  })
  const contacts = Array.from(contactsMap.values())
    .filter(c => c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone_number.includes(searchQuery))

  const selectedMessages = messages
    .filter(m => m.phone_number === selectedContact)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const selectedContactInfo = contacts.find(c => c.phone_number === selectedContact)

  const isDemo = messages === dummyMessages

  return (
    <div className="flex h-[calc(100vh-140px)] w-full bg-[#111B21] rounded-2xl overflow-hidden shadow-2xl border border-[#222E35]">
      {/* Left Panel */}
      <div className="w-[380px] flex flex-col bg-[#111B21] border-r border-[#222E35]">
        <div className="h-16 px-4 bg-[#202C33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
              WA
            </div>
            <span className="text-[#E9EDEF] font-semibold">Chats {isDemo && <span className="text-xs bg-emerald-600/20 text-emerald-500 px-2 py-0.5 rounded-full ml-2">Demo</span>}</span>
          </div>
          <div className="flex items-center gap-4 text-[#AEBAC1]">
            <div className="relative">
              <MoreVertical className="w-5 h-5 cursor-pointer" />
              {inboundCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {inboundCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-2 border-b border-[#222E35]">
          <div className="bg-[#202C33] rounded-lg flex items-center px-3 py-1.5 gap-3">
            <Search className="w-4 h-4 text-[#AEBAC1]" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="bg-transparent border-none outline-none text-[#E9EDEF] text-sm w-full placeholder:text-[#AEBAC1]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.phone_number} 
              onClick={() => setSelectedContact(contact.phone_number)}
              className={`flex items-center px-3 py-3 gap-3 cursor-pointer hover:bg-[#202C33] transition-colors ${selectedContact === contact.phone_number ? 'bg-[#2A3942]' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-[#6C7175] flex items-center justify-center font-semibold text-xl text-white shrink-0">
                {contact.contact_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 border-b border-[#222E35] pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#E9EDEF] text-[17px] truncate">{contact.contact_name}</span>
                  <span className="text-[#8696A0] text-xs">
                    {new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#8696A0] text-sm">
                  {contact.status === 'read' && <CheckCheck className="w-4 h-4 text-[#53BDEB]" />}
                  {contact.status === 'delivered' && <CheckCheck className="w-4 h-4 text-[#8696A0]" />}
                  {contact.status === 'sent' && <Check className="w-4 h-4 text-[#8696A0]" />}
                  <span className="truncate">{contact.message_body}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat View */}
      {selectedContactInfo ? (
        <div className="flex-1 flex flex-col bg-[#0B141A] relative">
          {/* WhatsApp Web Dark Default Background Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yO/r/FsWUvqSpAoa.png")' }}></div>
          
          {/* Top Bar */}
          <div className="h-16 px-4 bg-[#202C33] flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#6C7175] flex items-center justify-center font-semibold text-white">
                {selectedContactInfo.contact_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[#E9EDEF] font-medium">{selectedContactInfo.contact_name}</div>
                <div className="text-[#8696A0] text-xs">{selectedContactInfo.phone_number}</div>
              </div>
            </div>
            <div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                selectedContactInfo.appointment_status.toLowerCase() === 'confirmed' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {selectedContactInfo.appointment_status}
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:px-10 z-10 flex flex-col gap-2">
            {selectedMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg p-2 relative shadow-sm ${
                  msg.direction === 'outbound' ? 'bg-[#005C4B] text-[#E9EDEF]' : 'bg-[#202C33] text-[#E9EDEF]'
                }`}>
                  <div className="text-[15px] pr-2 pb-3">{msg.message_body}</div>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[11px] text-[#AEBAC1]/80">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.direction === 'outbound' && (
                      <>
                        {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-[#AEBAC1]/80" />}
                        {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-[#AEBAC1]/80" />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compose Area */}
          <form onSubmit={handleSendMessage} className="min-h-[62px] px-4 py-3 bg-[#202C33] flex items-center gap-4 z-10">
            <input 
              type="text"
              placeholder="Type a message (Dummy Mode Active)..."
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              className="flex-1 bg-[#2A3942] rounded-lg px-4 py-2 text-[#E9EDEF] outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
            <button 
              type="submit" 
              disabled={!draftMessage.trim() || isSending} 
              className="p-2 text-[#8696A0] hover:text-[#E9EDEF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-[#222E35] items-center justify-center border-l border-[#222E35]">
          <div className="text-[#AEBAC1] text-sm">Select a chat to start messaging</div>
        </div>
      )}
    </div>
  )
}
