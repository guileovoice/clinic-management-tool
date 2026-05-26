import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string
    const smsStatus = formData.get('SmsStatus') as string
    const messageStatus = formData.get('MessageStatus') as string

    console.log('Twilio Webhook received:', {
      from,
      to,
      body: body ? `${body.substring(0, 20)}...` : null,
      messageSid,
      smsStatus,
      messageStatus
    })

    // 1. Handle Status Callback (Outgoing message update)
    // Twilio sends MessageStatus (sent, delivered, failed, sending, accepted, undelivered)
    const rawStatus = messageStatus || smsStatus
    
    if (messageSid && rawStatus && rawStatus !== 'received' && !body) {
      // Map Twilio statuses to database allowed constraint values:
      // CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received'))
      let dbStatus: 'queued' | 'sent' | 'delivered' | 'failed' = 'sent'
      
      if (rawStatus === 'accepted' || rawStatus === 'sending' || rawStatus === 'queued') {
        dbStatus = 'queued'
      } else if (rawStatus === 'sent') {
        dbStatus = 'sent'
      } else if (rawStatus === 'delivered' || rawStatus === 'read') {
        dbStatus = 'delivered'
      } else if (rawStatus === 'failed' || rawStatus === 'undelivered') {
        dbStatus = 'failed'
      }

      // Find the message by Twilio Message SID and update its status
      const { data, error } = await supabaseAdmin
        .from('sms_messages')
        .update({ 
          status: dbStatus 
        })
        .eq('twilio_sid', messageSid)
        .select()

      if (error) {
        console.error('Error updating status via webhook:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('Successfully updated SMS status:', data)
      return NextResponse.json({ success: true, updated: data?.length })
    }

    // 2. Handle Incoming SMS (Inbound message)
    if (from && to && body) {
      // Find the tenant associated with the Twilio number (to)
      const { data: config, error: configError } = await supabaseAdmin
        .from('sms_config')
        .select('tenant_id')
        .eq('twilio_number', to)
        .maybeSingle()

      if (configError || !config) {
        console.error('No tenant configuration found for Twilio number:', to, configError)
        return NextResponse.json({ error: 'Config not found for Twilio number' }, { status: 404 })
      }

      const tenantId = config.tenant_id

      // Check if we have a patient matching this phone number to fetch their name
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('name')
        .eq('phone', from)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      const contactName = patient ? patient.name : from

      // Insert the inbound message into sms_messages
      const { data: insertedMsg, error: insertError } = await supabaseAdmin
        .from('sms_messages')
        .insert({
          tenant_id: tenantId,
          phone_number: from,
          contact_name: contactName,
          direction: 'inbound',
          message_body: body,
          status: 'received',
          twilio_sid: messageSid
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting inbound SMS:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      console.log('Successfully saved inbound SMS:', insertedMsg)
      
      // Return TwiML response to Twilio (empty response is fine to acknowledge receipt)
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        {
          headers: {
            'Content-Type': 'text/xml'
          }
        }
      )
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  } catch (error: any) {
    console.error('Webhook execution failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
