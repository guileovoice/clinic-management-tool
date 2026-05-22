import { create } from 'zustand'
import { Patient, Appointment, Campaign, CallLog, AppointmentStatus, AppointmentType } from '../types'
import { supabase } from '../supabaseClient'
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'

interface ClinicInfo {
  id: string
  name: string
  address: string
  phone: string
  category: string
  logo?: string
  voicePersona: string
  agentLanguage: string
  greetingText: string
  agentTemp: string
  interruptSens: string
  waConfirmations: boolean
  smsNoShowAlerts: boolean
  autoInsuranceVerify: boolean
  churnRiskAnalytics: boolean
  stripePublishableKey: string
  stripeSecretKey: string
}

export interface DateRange {
  start: string
  end: string
}

function getDefaultDateRange(): DateRange {
  const today = new Date()
  const str = today.toISOString().split('T')[0]
  return { start: str, end: str }
}

interface ClinicState {
  info: ClinicInfo
  patients: Patient[]
  appointments: Appointment[]
  campaigns: Campaign[]
  callLogs: CallLog[]
  isLoading: boolean
  dateRange: DateRange

  // Actions
  bootstrapData: () => Promise<void>
  fetchClinicInfo: () => Promise<void>
  fetchPatients: () => Promise<void>
  fetchAppointments: () => Promise<void>
  fetchCampaigns: () => Promise<void>
  fetchCallLogs: () => Promise<void>
  setDateRange: (range: DateRange) => void

  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'> & { id?: string }) => Promise<string>
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }) => Promise<string>
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  triggerReminder: (id: string) => Promise<void>

  updateClinicInfo: (info: Partial<ClinicInfo>) => Promise<void>
  updateCallLogAction: (id: string, actionRequired: boolean) => Promise<void>
  addCallLog: (callLog: Omit<CallLog, 'id' | 'timestamp'> & { id?: string }) => Promise<string>
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'> & { id?: string }) => Promise<string>
  sendCampaign: (id: string) => Promise<void>
}

const DEFAULT_TENANT_ID = '395b50b9-9504-4bda-bd38-7ce5b53e7aa0'

// =========================================================================
// BLANK DEFAULTS (no mock data - always load from Supabase)
// =========================================================================

const DEFAULT_CLINIC_INFO: ClinicInfo = {
  id: DEFAULT_TENANT_ID,
  name: 'Loading...',
  address: '',
  phone: '',
  category: 'Dental & Aesthetics',
  voicePersona: 'Dr. Arthur (AI)',
  agentLanguage: 'en-US',
  greetingText: '',
  agentTemp: '0.4',
  interruptSens: 'Medium',
  waConfirmations: true,
  smsNoShowAlerts: true,
  autoInsuranceVerify: true,
  churnRiskAnalytics: true,
  stripePublishableKey: '',
  stripeSecretKey: ''
}

// =========================================================================
// MAPPING HELPER FUNCTIONS
// =========================================================================

function mapClinicInfoFromDb(row: any): ClinicInfo {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    category: row.category || 'Dental & Aesthetics',
    voicePersona: row.voice_persona || 'Dr. Arthur (AI)',
    agentLanguage: row.agent_language || 'en-US',
    greetingText: row.greeting_text || '',
    agentTemp: String(row.agent_temp || '0.4'),
    interruptSens: row.interrupt_sens || 'Medium',
    waConfirmations: row.wa_confirmations !== false,
    smsNoShowAlerts: row.sms_no_show_alerts !== false,
    autoInsuranceVerify: row.auto_insurance_verify !== false,
    churnRiskAnalytics: row.churn_risk_analytics !== false,
    stripePublishableKey: row.stripe_publishable_key || '',
    stripeSecretKey: row.stripe_secret_key || ''
  }
}

function mapPatientFromDb(row: any): Patient {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    preferredChannel: row.preferred_channel || 'VOICE',
    consents: row.consents || { essential: true, marketing: true, intelligence: true },
    totalAppointments: row.total_appointments || 0,
    totalSpent: Number(row.total_spent || 0),
    averageAppointmentValue: Number(row.average_appointment_value || 0),
    lastAppointmentAt: row.last_appointment_at || '',
    firstAppointmentAt: row.first_appointment_at || '',
    churnRisk: row.churn_risk || 'LOW',
    rfmSegment: row.rfm_segment === 'INACTIVE' ? 'AT_RISK' : (row.rfm_segment || 'NEW'),
    insurance: row.insurance || { provider: 'Uninsured', policyNumber: '', status: 'PENDING' },
    treatmentHistory: row.treatment_history || [],
    allergens: row.allergens || [],
    medications: row.medications || [],
    createdAt: row.created_at || ''
  }
}

function mapAppointmentFromDb(row: any, patientName: string = '', patientPhone: string = ''): Appointment {
  let uiStatus: AppointmentStatus = 'PENDING'
  if (row.status === 'NOSHOW') uiStatus = 'NO_SHOW'
  else uiStatus = row.status as AppointmentStatus

  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName: row.patient_name || patientName || 'Unknown Patient',
    patientPhone: row.patient_phone || patientPhone || '',
    date: row.date,
    time: row.time ? row.time.substring(0, 5) : '',
    duration: row.duration,
    status: uiStatus,
    type: row.type as AppointmentType,
    providerName: row.provider_name || 'Dr. Arthur Mendes',
    totalAmount: Number(row.total_amount || 0),
    notes: row.notes || '',
    createdAt: row.created_at || '',
    insuranceVerified: row.insurance_verified || false
  }
}

function mapCampaignFromDb(row: any): Campaign {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    channel: row.channel,
    status: row.status as Campaign['status'],
    segment: row.segment,
    recipientCount: row.recipient_count || 0,
    sentCount: row.sent_count || 0,
    revenue: Number(row.revenue || 0),
    message: row.message,
    scheduledAt: row.scheduled_at || undefined,
    sentAt: row.sent_at || undefined,
    createdAt: row.created_at || ''
  }
}

function mapCallLogFromDb(row: any): CallLog {
  const durSec = row.duration_seconds || 0
  const mins = Math.floor(durSec / 60)
  const secs = Math.floor(durSec % 60)
  const durDisplay = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  let transcriptText: string | undefined
  if (row.transcript) {
    transcriptText = typeof row.transcript === 'string' ? row.transcript : JSON.stringify(row.transcript)
  }

  // Map Vapi end statuses to completed/missed properly
  const isCompleted = 
    row.status === 'completed' || 
    row.status === 'answered' || 
    row.status === 'customer-ended-call' || 
    row.status === 'assistant-ended-call'

  return {
    id: row.id,
    tenantId: row.tenant_id || DEFAULT_TENANT_ID,
    patientName: row.customer_name || 'Unknown Caller',
    phone: row.customer_phone || '',
    // Use created_at for date filtering as per requirements
    timestamp: row.created_at || row.started_at || '',
    startedAt: row.started_at || row.created_at || '',
    durationSeconds: durSec,
    duration: durDisplay,
    status: isCompleted ? 'completed' : 'missed',
    rawStatus: row.status || undefined,
    costUsd: Number(row.cost_usd || 0),
    source: row.source || 'inbound',
    recordingUrl: row.recording_url || undefined,
    transcript: transcriptText,
    summary: row.summary || undefined,
    type: row.type || undefined,
    assistantId: row.assistantId || undefined,
    vapiAccount: row.vapi_account || 'normal',
    actionRequired: false
  }
}

// =========================================================================
// ZUSTAND STORE
// =========================================================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const useClinicStore = create<ClinicState>((set, get) => ({
  info: DEFAULT_CLINIC_INFO,
  patients: [],
  appointments: [],
  campaigns: [],
  callLogs: [],
  isLoading: false,
  dateRange: getDefaultDateRange(),

  setDateRange: (range) => set({ dateRange: range }),

  bootstrapData: async () => {
    set({ isLoading: true })
    try {
      await get().fetchClinicInfo()
      await get().fetchPatients()
      await get().fetchAppointments()
      await get().fetchCampaigns()
      await get().fetchCallLogs()
    } catch (err) {
      console.warn('Error bootstrapping clinic data:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchClinicInfo: async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', DEFAULT_TENANT_ID)
        .maybeSingle()

      if (error) throw error

      if (data) {
        set({ info: mapClinicInfoFromDb(data) })
      }
    } catch (err) {
      console.warn('Supabase fetchClinicInfo error:', err)
    }
  },

  fetchPatients: async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ patients: (data || []).map(mapPatientFromDb) })
    } catch (err) {
      console.warn('Supabase fetchPatients error:', err)
      set({ patients: [] })
    }
  },

  fetchAppointments: async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('date', { ascending: false })

      if (error) throw error

      const patients = get().patients
      const mapped = (data || []).map(row => {
        const matchedPat = patients.find(p => p.id === row.patient_id)
        return mapAppointmentFromDb(
          row,
          matchedPat ? matchedPat.name : (row.patient_name || 'Unknown Patient'),
          matchedPat ? matchedPat.phone : (row.patient_phone || '')
        )
      })
      set({ appointments: mapped })
    } catch (err) {
      console.warn('Supabase fetchAppointments error:', err)
      set({ appointments: [] })
    }
  },

  fetchCampaigns: async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ campaigns: (data || []).map(mapCampaignFromDb) })
    } catch (err) {
      console.warn('Supabase fetchCampaigns error:', err)
      set({ campaigns: [] })
    }
  },

  fetchCallLogs: async () => {
    try {
      const { data, error } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ callLogs: (data || []).map(mapCallLogFromDb) })
    } catch (err) {
      console.warn('Supabase fetchCallLogs error:', err)
      set({ callLogs: [] })
    }
  },

  addPatient: async (patient) => {
    const tempId = patient.id || generateUUID()
    const newPatient: Patient = {
      ...patient,
      id: tempId,
      createdAt: new Date().toISOString()
    }
    set(state => ({ patients: [newPatient, ...state.patients] }))

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          id: tempId,
          tenant_id: DEFAULT_TENANT_ID,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          preferred_channel: patient.preferredChannel,
          consents: patient.consents,
          insurance: patient.insurance,
          total_appointments: patient.totalAppointments,
          total_spent: patient.totalSpent,
          average_appointment_value: patient.averageAppointmentValue,
          last_appointment_at: patient.lastAppointmentAt || null,
          first_appointment_at: patient.firstAppointmentAt || null,
          churn_risk: patient.churnRisk,
          rfm_segment: patient.rfmSegment === 'AT_RISK' ? 'INACTIVE' : patient.rfmSegment,
          treatment_history: patient.treatmentHistory,
          allergens: patient.allergens,
          medications: patient.medications
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          const { data: existingPat } = await supabase
            .from('patients')
            .select('id')
            .eq('tenant_id', DEFAULT_TENANT_ID)
            .eq('phone', patient.phone)
            .maybeSingle()

          if (existingPat) {
            set(state => ({ patients: state.patients.filter(p => p.id !== tempId) }))
            return existingPat.id
          }
        }
        throw error
      }
      if (data) {
        const finalPatient = mapPatientFromDb(data)
        set(state => ({
          patients: state.patients.map(p => p.id === tempId ? finalPatient : p)
        }))
      }
    } catch (err) {
      console.warn('Supabase addPatient write error:', err)
    }
    return tempId
  },

  addAppointment: async (appointment) => {
    const tempId = appointment.id || generateUUID()
    const newApt: Appointment = {
      ...appointment,
      id: tempId,
      createdAt: new Date().toISOString()
    }
    set(state => ({ appointments: [newApt, ...state.appointments] }))

    try {
      let dbStatus = appointment.status === 'NO_SHOW' ? 'NOSHOW' : appointment.status

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          id: tempId,
          tenant_id: DEFAULT_TENANT_ID,
          patient_id: appointment.patientId,
          date: appointment.date,
          time: `${appointment.time}:00`,
          duration: appointment.duration,
          status: dbStatus,
          type: appointment.type,
          provider_name: appointment.providerName,
          total_amount: appointment.totalAmount,
          insurance_verified: appointment.insuranceVerified,
          notes: appointment.notes
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        const finalApt = mapAppointmentFromDb(
          data,
          appointment.patientName,
          appointment.patientPhone
        )
        set(state => ({
          appointments: state.appointments.map(a => a.id === tempId ? finalApt : a)
        }))
      }
    } catch (err) {
      console.warn('Supabase addAppointment write error:', err)
    }
    return tempId
  },

  updateAppointmentStatus: async (id, status) => {
    set(state => ({
      appointments: state.appointments.map(apt =>
        apt.id === id ? { ...apt, status } : apt
      )
    }))

    try {
      let dbStatus = status === 'NO_SHOW' ? 'NOSHOW' : status

      const { error } = await supabase
        .from('appointments')
        .update({ status: dbStatus })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      console.warn('Supabase updateAppointmentStatus error:', err)
    }
  },

  deleteAppointment: async (id) => {
    set(state => ({
      appointments: state.appointments.filter(apt => apt.id !== id)
    }))

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      console.warn('Supabase deleteAppointment error:', err)
    }
  },

  triggerReminder: async (id) => {
    try {
      const { error } = await supabase
        .from('hipaa_audit_logs')
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          event_name: 'TRIGGER_PATIENT_REMINDER',
          message: `Manual outreach notification triggered for appointment ID: ${id}`,
          performed_by: 'Staff UI Client'
        })
      if (error) throw error
    } catch (err) {
      console.warn('Supabase triggerReminder audit error:', err)
    }
  },

  updateClinicInfo: async (newInfo) => {
    set(state => ({ info: { ...state.info, ...newInfo } }))

    try {
      const dbPayload: any = {}
      if (newInfo.name) dbPayload.name = newInfo.name
      if (newInfo.address) dbPayload.address = newInfo.address
      if (newInfo.phone) dbPayload.phone = newInfo.phone
      if (newInfo.category) dbPayload.category = newInfo.category
      if (newInfo.voicePersona) dbPayload.voice_persona = newInfo.voicePersona
      if (newInfo.agentLanguage) dbPayload.agent_language = newInfo.agentLanguage
      if (newInfo.greetingText) dbPayload.greeting_text = newInfo.greetingText
      if (newInfo.agentTemp) dbPayload.agent_temp = Number(newInfo.agentTemp)
      if (newInfo.interruptSens) dbPayload.interrupt_sens = newInfo.interruptSens
      if (newInfo.waConfirmations !== undefined) dbPayload.wa_confirmations = newInfo.waConfirmations
      if (newInfo.smsNoShowAlerts !== undefined) dbPayload.sms_no_show_alerts = newInfo.smsNoShowAlerts
      if (newInfo.autoInsuranceVerify !== undefined) dbPayload.auto_insurance_verify = newInfo.autoInsuranceVerify
      if (newInfo.churnRiskAnalytics !== undefined) dbPayload.churn_risk_analytics = newInfo.churnRiskAnalytics
      if (newInfo.stripePublishableKey !== undefined) dbPayload.stripe_publishable_key = newInfo.stripePublishableKey
      if (newInfo.stripeSecretKey !== undefined) dbPayload.stripe_secret_key = newInfo.stripeSecretKey

      const { error } = await supabase
        .from('clinics')
        .update(dbPayload)
        .eq('id', DEFAULT_TENANT_ID)

      if (error) throw error
    } catch (err) {
      console.warn('Supabase updateClinicInfo error:', err)
    }
  },

  updateCallLogAction: async (id, actionRequired) => {
    set(state => ({
      callLogs: state.callLogs.map(log =>
        log.id === id ? { ...log, actionRequired } : log
      )
    }))
  },

  addCallLog: async (callLog) => {
    const tempId = callLog.id || generateUUID()
    const newLog: CallLog = {
      ...callLog,
      id: tempId,
      timestamp: new Date().toISOString(),
      startedAt: new Date().toISOString()
    }
    set(state => ({ callLogs: [newLog, ...state.callLogs] }))

    try {
      const { data, error } = await supabase
        .from('vapi_call_logs')
        .insert({
          id: tempId,
          vapi_account: 'clinic-calls',
          customer_name: callLog.patientName,
          customer_phone: callLog.phone,
          started_at: new Date().toISOString(),
          duration_seconds: callLog.durationSeconds || 0,
          status: callLog.status === 'completed' ? 'completed' : 'missed',
          cost_usd: callLog.costUsd || 0,
          source: callLog.source || 'inbound',
          recording_url: callLog.recordingUrl || null,
          transcript: callLog.transcript || null,
          summary: callLog.summary || null,
          type: callLog.type || 'inbound',
          assistantId: callLog.assistantId || null
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        const finalLog = mapCallLogFromDb(data)
        set(state => ({
          callLogs: state.callLogs.map(l => l.id === tempId ? finalLog : l)
        }))
      }
    } catch (err) {
      console.warn('Supabase addCallLog error:', err)
    }
    return tempId
  },

  addCampaign: async (campaign) => {
    const tempId = campaign.id || generateUUID()
    const newCmp: Campaign = {
      ...campaign,
      id: tempId,
      createdAt: new Date().toISOString()
    }
    set(state => ({ campaigns: [...state.campaigns, newCmp] }))

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          id: tempId,
          tenant_id: DEFAULT_TENANT_ID,
          name: campaign.name,
          channel: campaign.channel,
          status: campaign.status,
          segment: campaign.segment,
          recipient_count: campaign.recipientCount,
          sent_count: campaign.sentCount,
          revenue: campaign.revenue || 0,
          message: campaign.message,
          scheduled_at: campaign.scheduledAt || null,
          sent_at: campaign.sentAt || null
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        const finalCmp = mapCampaignFromDb(data)
        set(state => ({
          campaigns: state.campaigns.map(c => c.id === tempId ? finalCmp : c)
        }))
      }
    } catch (err) {
      console.warn('Supabase addCampaign error:', err)
    }
    return tempId
  },

  sendCampaign: async (id) => {
    const updatedSentAt = new Date().toISOString()
    set(state => ({
      campaigns: state.campaigns.map(cmp => {
        if (cmp.id === id) {
          const rev = cmp.revenue || Math.floor(cmp.recipientCount * 0.2 * 120)
          return {
            ...cmp,
            status: 'SENT',
            sentCount: cmp.recipientCount,
            sentAt: updatedSentAt,
            revenue: rev
          }
        }
        return cmp
      })
    }))

    try {
      const targetCmp = get().campaigns.find(c => c.id === id)
      if (targetCmp) {
        const { error } = await supabase
          .from('campaigns')
          .update({
            status: 'SENT',
            sent_count: targetCmp.recipientCount,
            sent_at: updatedSentAt,
            revenue: targetCmp.revenue
          })
          .eq('id', id)

        if (error) throw error
      }
    } catch (err) {
      console.warn('Supabase sendCampaign error:', err)
    }
  }
}))

// =========================================================================
// DATE-RANGE FILTER HELPERS
// =========================================================================

function parseDateSafe(dateStr: string | undefined | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Generic date filter.
 * dateField: which property to use for filtering.
 * Appointments use 'date', patients use 'createdAt', call logs use 'timestamp' (mapped from created_at)
 */
export function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  start: string,
  end: string,
  dateField?: string
): T[] {
  const startDate = parseDateSafe(start)
  const endDate = parseDateSafe(end)
  if (!startDate || !endDate) return items

  return items.filter(item => {
    // Priority: explicit dateField > 'date' > 'timestamp' > 'createdAt'
    const rawVal = dateField 
      ? item[dateField]
      : item['date'] ?? item['timestamp'] ?? item['createdAt'] ?? null

    const target = parseDateSafe(rawVal)
    if (!target) return false
    return isWithinInterval(target, {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    })
  })
}

export function useFilteredAppointments() {
  const { appointments, dateRange } = useClinicStore()
  // Appointments filter uses the `date` field (YYYY-MM-DD)
  return filterByDateRange(appointments, dateRange.start, dateRange.end, 'date')
}

export function useFilteredCallLogs() {
  const { callLogs, dateRange } = useClinicStore()
  // Call logs filter uses `timestamp` which is mapped from `created_at`
  return filterByDateRange(callLogs, dateRange.start, dateRange.end, 'timestamp')
}

export function useFilteredPatients() {
  const { patients, dateRange } = useClinicStore()
  // Patients filter uses `createdAt` 
  return filterByDateRange(patients, dateRange.start, dateRange.end, 'createdAt')
}
