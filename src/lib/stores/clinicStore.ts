import { create } from 'zustand'
import { Patient, Appointment, Campaign, CallLog, AppointmentStatus, AppointmentType } from '../types'
import { supabase } from '../supabaseClient'

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

interface ClinicState {
  info: ClinicInfo
  patients: Patient[]
  appointments: Appointment[]
  campaigns: Campaign[]
  callLogs: CallLog[]
  isLoading: boolean

  // Actions
  bootstrapData: () => Promise<void>
  fetchClinicInfo: () => Promise<void>
  fetchPatients: () => Promise<void>
  fetchAppointments: () => Promise<void>
  fetchCampaigns: () => Promise<void>
  fetchCallLogs: () => Promise<void>

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
// MOCK DATA FOR SEEDING / FALLBACK
// =========================================================================

const INITIAL_CLINIC_INFO: ClinicInfo = {
  id: DEFAULT_TENANT_ID,
  name: 'Origem Dental & Aesthetic Clinic',
  address: '42-15 Broadway, Astoria, Queens, NY 11103',
  phone: '+1-718-555-4040',
  category: 'Dental & Aesthetics',
  voicePersona: 'Dr. Arthur (AI)',
  agentLanguage: 'en-US',
  greetingText: 'Welcome to Origem Dental & Aesthetic Clinic. This is Arthur, your virtual dental assistant. How can I assist you with scheduling or dental care today?',
  agentTemp: '0.4',
  interruptSens: 'Medium',
  waConfirmations: true,
  smsNoShowAlerts: true,
  autoInsuranceVerify: true,
  churnRiskAnalytics: true,
  stripePublishableKey: 'pk_test_mock_holder',
  stripeSecretKey: 'sk_test_mock_holder'
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'a0b1c2d3-e4f5-6789-0123-456789abcdef',
    tenantId: DEFAULT_TENANT_ID,
    name: 'Maria Silva',
    phone: '+1-718-555-1212',
    email: 'maria.silva@gmail.com',
    preferredChannel: 'WHATSAPP',
    consents: { essential: true, marketing: true, intelligence: true },
    totalAppointments: 12,
    totalSpent: 1850.00,
    averageAppointmentValue: 154.16,
    lastAppointmentAt: '2026-05-15T10:00:00Z',
    firstAppointmentAt: '2025-09-10T14:30:00Z',
    churnRisk: 'LOW',
    rfmSegment: 'CHAMPION',
    insurance: {
      provider: 'Delta Dental',
      policyNumber: 'DD-9831A',
      groupNumber: 'G-1102',
      status: 'VERIFIED',
      coverageDetails: 'Covers 100% preventive, 80% basic procedures, 50% major treatments.'
    },
    treatmentHistory: ['Routine Cleaning', 'Cavity Filling (Tooth #14)', 'Teeth Whitening'],
    allergens: ['Penicillin'],
    medications: ['Amoxicillin (pre-op)'],
    createdAt: '2025-09-10T14:30:00Z'
  },
  {
    id: 'b1c2d3e4-f5a6-7890-1234-567890abcdef',
    tenantId: DEFAULT_TENANT_ID,
    name: 'João Santos',
    phone: '+1-917-555-9080',
    email: 'joao.santos@outlook.com',
    preferredChannel: 'VOICE',
    consents: { essential: true, marketing: false, intelligence: false },
    totalAppointments: 3,
    totalSpent: 450.00,
    averageAppointmentValue: 150.00,
    lastAppointmentAt: '2026-05-18T11:00:00Z',
    firstAppointmentAt: '2026-01-14T09:00:00Z',
    churnRisk: 'LOW',
    rfmSegment: 'LOYAL',
    insurance: {
      provider: 'Cigna Dental',
      policyNumber: 'CIG-882193',
      status: 'VERIFIED',
      coverageDetails: 'Covers 80% preventive and basic care.'
    },
    treatmentHistory: ['Comprehensive Oral Exam', 'Full Mouth X-Rays'],
    allergens: [],
    medications: [],
    createdAt: '2026-01-14T09:00:00Z'
  },
  {
    id: 'c2d3e4f5-a6b7-8901-2345-678901abcdef',
    tenantId: DEFAULT_TENANT_ID,
    name: 'Carlos Mendes',
    phone: '+1-516-555-0012',
    email: 'carlos.m@yahoo.com',
    preferredChannel: 'SMS',
    consents: { essential: true, marketing: true, intelligence: false },
    totalAppointments: 1,
    totalSpent: 90.00,
    averageAppointmentValue: 90.00,
    lastAppointmentAt: '2026-05-14T15:30:00Z',
    firstAppointmentAt: '2026-05-14T15:30:00Z',
    churnRisk: 'HIGH',
    rfmSegment: 'NEW',
    insurance: {
      provider: 'MetLife Dental',
      policyNumber: 'MET-44109',
      status: 'PENDING'
    },
    treatmentHistory: ['Emergency Consultation (Toothache)'],
    allergens: ['Sulfa Drugs'],
    medications: ['Ibuprofen 800mg'],
    createdAt: '2026-05-14T15:30:00Z'
  }
]

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'd3e4f5a6-b7c8-9012-3456-789012abcdef',
    tenantId: DEFAULT_TENANT_ID,
    patientId: 'a0b1c2d3-e4f5-6789-0123-456789abcdef',
    patientName: 'Maria Silva',
    patientPhone: '+1-718-555-1212',
    date: '2026-05-18',
    time: '09:00',
    duration: 60,
    status: 'CONFIRMED',
    type: 'PROCEDURE',
    providerName: 'Dr. Arthur Mendes',
    totalAmount: 320.00,
    insuranceVerified: true,
    notes: 'Root canal therapy follow-up.',
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 'e4f5a6b7-c8d9-0123-4567-890123abcdef',
    tenantId: DEFAULT_TENANT_ID,
    patientId: 'b1c2d3e4-f5a6-7890-1234-567890abcdef',
    patientName: 'João Santos',
    patientPhone: '+1-917-555-9080',
    date: '2026-05-18',
    time: '11:00',
    duration: 45,
    status: 'COMPLETED',
    type: 'CHECKUP',
    providerName: 'Dr. Arthur Mendes',
    totalAmount: 150.00,
    insuranceVerified: true,
    notes: 'Routine 6-month cleaning and screening.',
    createdAt: '2026-05-08T10:30:00Z'
  },
  {
    id: 'f5a6b7c8-d9e0-1234-5678-901234abcdef',
    tenantId: DEFAULT_TENANT_ID,
    patientId: 'c2d3e4f5-a6b7-8901-2345-678901abcdef',
    patientName: 'Carlos Mendes',
    patientPhone: '+1-516-555-0012',
    date: '2026-05-19',
    time: '14:00',
    duration: 30,
    status: 'PENDING',
    type: 'CONSULTATION',
    providerName: 'Dr. Arthur Mendes',
    totalAmount: 90.00,
    insuranceVerified: false,
    notes: 'Consultation for crown replacement.',
    createdAt: '2026-05-17T16:00:00Z'
  }
]

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    tenantId: DEFAULT_TENANT_ID,
    name: 'Spring Whitening Special',
    channel: 'WHATSAPP',
    status: 'SENT',
    segment: 'Loyal Patients',
    recipientCount: 142,
    sentCount: 140,
    revenue: 2800.00,
    message: 'Get 25% off our premium in-office whitening this Spring! Click to schedule: clinic.guileo.ai/whitening',
    sentAt: '2026-05-10T10:00:00Z',
    createdAt: '2026-05-08T09:00:00Z'
  },
  {
    id: '12345678-9abc-def0-1234-567890abcdef',
    tenantId: DEFAULT_TENANT_ID,
    name: 'Bi-Annual Recall Winback',
    channel: 'VOICE',
    status: 'SCHEDULED',
    segment: 'Inactive (6mo+)',
    recipientCount: 88,
    sentCount: 0,
    message: 'Hello, this is Arthur from Origem Dental. We noticed it has been over 6 months since your last clean. Call back to book your recall appointment today!',
    scheduledAt: '2026-05-22T09:00:00Z',
    createdAt: '2026-05-15T14:00:00Z'
  }
]

const INITIAL_CALL_LOGS: CallLog[] = [
  {
    id: '23456789-abcd-ef01-2345-678901abcdef',
    tenantId: DEFAULT_TENANT_ID,
    patientName: 'Maria Silva',
    phone: '+1-718-555-1212',
    timestamp: '2026-05-18T08:45:00Z',
    duration: '1m 45s',
    status: 'completed',
    recordingUrl: 'https://vapi-recordings.s3.amazonaws.com/origem/call-1.mp3',
    transcript: 'Arthur: Origem Clinic, how can I help you today?\nMaria: Hi, I want to confirm my 9 AM appointment.\nArthur: Certainly! You are confirmed for 9 AM today with Dr. Mendes.',
    summary: 'Patient called to confirm their 9:00 AM root canal checkup.',
    actionRequired: false
  },
  {
    id: '34567890-bcde-f012-3456-789012abcdef',
    tenantId: DEFAULT_TENANT_ID,
    patientName: 'Carlos Mendes',
    phone: '+1-516-555-0012',
    timestamp: '2026-05-18T10:15:00Z',
    duration: '2m 10s',
    status: 'completed',
    recordingUrl: 'https://vapi-recordings.s3.amazonaws.com/origem/call-2.mp3',
    transcript: 'Arthur: Hello, how can I help you?\nCarlos: Hi, my filling fell out and my tooth really hurts. Do you have any emergency appointments tomorrow?\nArthur: Yes, I can book you for 2:00 PM tomorrow. Does that work?\nCarlos: Yes, thank you.',
    summary: 'Patient reported toothache and requested an emergency appointment. Booked for tomorrow 2 PM.',
    actionRequired: true
  }
]

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
  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientName: row.patient_name || 'Unknown Patient',
    phone: row.phone,
    timestamp: row.created_at || '',
    duration: row.duration || '0s',
    status: row.status === 'answered' || row.status === 'completed' ? 'completed' : 'missed',
    recordingUrl: row.recording_url || undefined,
    transcript: row.transcript || undefined,
    summary: row.summary || undefined,
    actionRequired: row.action_required || false
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
  info: INITIAL_CLINIC_INFO,
  patients: INITIAL_PATIENTS,
  appointments: INITIAL_APPOINTMENTS,
  campaigns: INITIAL_CAMPAIGNS,
  callLogs: INITIAL_CALL_LOGS,
  isLoading: false,

  bootstrapData: async () => {
    set({ isLoading: true })
    try {
      // 1. Fetch clinic info (seeds if empty)
      await get().fetchClinicInfo()
      // 2. Fetch patients (seeds if empty - must run before appointments)
      await get().fetchPatients()
      // 3. Fetch appointments (seeds if empty - safe now that patients are loaded)
      await get().fetchAppointments()
      // 4. Fetch campaigns (seeds if empty)
      await get().fetchCampaigns()
      // 5. Fetch call logs (seeds if empty)
      await get().fetchCallLogs()
    } catch (err) {
      console.warn('Error bootstrapping clinic data:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchClinicInfo: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', DEFAULT_TENANT_ID)
        .maybeSingle()

      if (error) throw error

      if (data) {
        set({ info: mapClinicInfoFromDb(data) })
      } else {
        // Seed initial clinic in Supabase
        const defaultInfo = get().info
        const { error: insertErr } = await supabase
          .from('clinics')
          .insert({
            id: DEFAULT_TENANT_ID,
            name: defaultInfo.name,
            address: defaultInfo.address,
            phone: defaultInfo.phone,
            category: defaultInfo.category,
            voice_persona: defaultInfo.voicePersona,
            agent_language: defaultInfo.agentLanguage,
            greeting_text: defaultInfo.greetingText,
            agent_temp: Number(defaultInfo.agentTemp),
            interrupt_sens: defaultInfo.interruptSens,
            wa_confirmations: defaultInfo.waConfirmations,
            sms_no_show_alerts: defaultInfo.smsNoShowAlerts,
            auto_insurance_verify: defaultInfo.autoInsuranceVerify,
            churn_risk_analytics: defaultInfo.churnRiskAnalytics,
            stripe_publishable_key: defaultInfo.stripePublishableKey,
            stripe_secret_key: defaultInfo.stripeSecretKey
          })
        if (insertErr) console.warn('Supabase seed clinic failed:', insertErr)
      }
    } catch (err) {
      console.warn('Supabase fetchClinicInfo fallback:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPatients: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (error) throw error

      if (data && data.length > 0) {
        set({ patients: data.map(mapPatientFromDb) })
      } else {
        // Fallback to local mockup state if database is empty
        set({ patients: INITIAL_PATIENTS })
      }
    } catch (err) {
      console.warn('Supabase fetchPatients fallback:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchAppointments: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (error) throw error

      if (data && data.length > 0) {
        const patients = get().patients
        const mapped = data.map(row => {
          const matchedPat = patients.find(p => p.id === row.patient_id)
          return mapAppointmentFromDb(
            row, 
            matchedPat ? matchedPat.name : 'Unknown Patient', 
            matchedPat ? matchedPat.phone : ''
          )
        })
        set({ appointments: mapped })
      } else {
        // Fallback to local mockup state if database is empty
        set({ appointments: INITIAL_APPOINTMENTS })
      }
    } catch (err) {
      console.warn('Supabase fetchAppointments fallback:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchCampaigns: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (error) throw error

      if (data && data.length > 0) {
        set({ campaigns: data.map(mapCampaignFromDb) })
      } else {
        // Fallback to local mockup state if database is empty
        set({ campaigns: INITIAL_CAMPAIGNS })
      }
    } catch (err) {
      console.warn('Supabase fetchCampaigns fallback:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchCallLogs: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        set({ callLogs: data.map(mapCallLogFromDb) })
      } else {
        // Fallback to local mockup state if database is empty
        set({ callLogs: INITIAL_CALL_LOGS })
      }
    } catch (err) {
      console.warn('Supabase fetchCallLogs fallback:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  addPatient: async (patient) => {
    const tempId = patient.id || generateUUID()
    const newPatient: Patient = {
      ...patient,
      id: tempId,
      createdAt: new Date().toISOString()
    }
    // Update local state first for instant response
    set(state => ({ patients: [...state.patients, newPatient] }))

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
          // Patient already exists! Let's fetch their existing ID
          const { data: existingPat, error: fetchErr } = await supabase
            .from('patients')
            .select('id')
            .eq('tenant_id', DEFAULT_TENANT_ID)
            .eq('phone', patient.phone)
            .maybeSingle()

          if (!fetchErr && existingPat) {
            // Update local state to remove the duplicate local temp entry
            set(state => ({
              patients: state.patients.filter(p => p.id !== tempId)
            }))
            return existingPat.id
          }
        }
        throw error
      }
      if (data) {
        // Swap tempId with final DB UUID
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
    // Update local state first
    set(state => ({ appointments: [...state.appointments, newApt] }))

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
    // Audit-trail action in audit logs for HIPAA compliance
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

    try {
      const { error } = await supabase
        .from('call_logs')
        .update({ action_required: actionRequired })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      console.warn('Supabase updateCallLogAction error:', err)
    }
  },

  addCallLog: async (callLog) => {
    const tempId = callLog.id || generateUUID()
    const newLog: CallLog = {
      ...callLog,
      id: tempId,
      timestamp: new Date().toISOString()
    }
    set(state => ({ callLogs: [newLog, ...state.callLogs] }))

    try {
      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          id: tempId,
          tenant_id: DEFAULT_TENANT_ID,
          patient_name: callLog.patientName,
          phone: callLog.phone,
          duration: callLog.duration,
          status: callLog.status === 'completed' ? 'completed' : 'missed',
          recording_url: callLog.recordingUrl || null,
          transcript: callLog.transcript || null,
          summary: callLog.summary || null,
          action_required: callLog.actionRequired
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
