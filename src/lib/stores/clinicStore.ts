import { create } from 'zustand'
import { Patient, Appointment, Campaign, CallLog } from '../types'

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
  fetchClinicInfo: () => Promise<void>
  fetchPatients: () => Promise<void>
  fetchAppointments: () => Promise<void>
  fetchCampaigns: () => Promise<void>
  fetchCallLogs: () => Promise<void>

  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<void>
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  triggerReminder: (id: string) => Promise<void>

  updateClinicInfo: (info: Partial<ClinicInfo>) => Promise<void>
  updateCallLogAction: (id: string, actionRequired: boolean) => Promise<void>
  addCallLog: (callLog: Omit<CallLog, 'id' | 'timestamp'>) => Promise<void>
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>
  sendCampaign: (id: string) => Promise<void>
}

const DEFAULT_TENANT_ID = 'clinic-tenant-395b50b9-9504'

export const useClinicStore = create<ClinicState>((set, get) => ({
  info: {
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
  },
  patients: [
    {
      id: 'pat-1',
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
      id: 'pat-2',
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
      id: 'pat-3',
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
    },
    {
      id: 'pat-4',
      tenantId: DEFAULT_TENANT_ID,
      name: 'Maria Clara Souza',
      phone: '+1-347-555-8833',
      email: 'mclara.souza@gmail.com',
      preferredChannel: 'WHATSAPP',
      consents: { essential: true, marketing: true, intelligence: true },
      totalAppointments: 8,
      totalSpent: 1200.00,
      averageAppointmentValue: 150.00,
      lastAppointmentAt: '2026-04-30T16:00:00Z',
      firstAppointmentAt: '2025-10-05T10:00:00Z',
      churnRisk: 'MEDIUM',
      rfmSegment: 'LOYAL',
      insurance: {
        provider: 'Guardian Dental',
        policyNumber: 'GDN-00921',
        status: 'VERIFIED',
        coverageDetails: 'Covers 100% preventive, 50% restorative.'
      },
      treatmentHistory: ['Regular Cleaning', 'Deep Scaling', 'Nightguard Fabrication'],
      allergens: ['Latex'],
      medications: [],
      createdAt: '2025-10-05T10:00:00Z'
    }
  ],
  appointments: [
    {
      id: 'apt-1',
      tenantId: DEFAULT_TENANT_ID,
      patientId: 'pat-1',
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
      id: 'apt-2',
      tenantId: DEFAULT_TENANT_ID,
      patientId: 'pat-2',
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
      id: 'apt-3',
      tenantId: DEFAULT_TENANT_ID,
      patientId: 'pat-3',
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
    },
    {
      id: 'apt-4',
      tenantId: DEFAULT_TENANT_ID,
      patientId: 'pat-4',
      patientName: 'Maria Clara Souza',
      patientPhone: '+1-347-555-8833',
      date: '2026-05-20',
      time: '10:00',
      duration: 90,
      status: 'CONFIRMED',
      type: 'PROCEDURE',
      providerName: 'Dr. Arthur Mendes',
      totalAmount: 450.00,
      insuranceVerified: true,
      notes: 'Composite fillings on teeth #2 and #3.',
      createdAt: '2026-05-15T09:15:00Z'
    }
  ],
  campaigns: [
    {
      id: 'cmp-1',
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
      id: 'cmp-2',
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
  ],
  callLogs: [
    {
      id: 'call-1',
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
      id: 'call-2',
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
    },
    {
      id: 'call-3',
      tenantId: DEFAULT_TENANT_ID,
      patientName: 'Unknown Patient',
      phone: '+1-212-555-3030',
      timestamp: '2026-05-18T12:30:00Z',
      duration: '0s',
      status: 'missed',
      summary: 'Inbound patient call dropped before connecting to AI voice agent.',
      actionRequired: true
    }
  ],
  isLoading: false,

  fetchClinicInfo: async () => {},
  fetchPatients: async () => {},
  fetchAppointments: async () => {},
  fetchCampaigns: async () => {},
  fetchCallLogs: async () => {},

  addPatient: async (patient) => {
    const newPatient: Patient = {
      ...patient,
      id: `pat-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    set(state => ({ patients: [...state.patients, newPatient] }))
  },

  addAppointment: async (appointment) => {
    const newApt: Appointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    set(state => ({ appointments: [...state.appointments, newApt] }))
  },

  updateAppointmentStatus: async (id, status) => {
    set(state => ({
      appointments: state.appointments.map(apt => 
        apt.id === id ? { ...apt, status } : apt
      )
    }))
  },

  deleteAppointment: async (id) => {
    set(state => ({
      appointments: state.appointments.filter(apt => apt.id !== id)
    }))
  },

  triggerReminder: async (id) => {
    // Simply return success for premium interactive responsiveness
  },

  updateClinicInfo: async (newInfo) => {
    set(state => ({ info: { ...state.info, ...newInfo } }))
  },

  updateCallLogAction: async (id, actionRequired) => {
    set(state => ({
      callLogs: state.callLogs.map(log => 
        log.id === id ? { ...log, actionRequired } : log
      )
    }))
  },

  addCallLog: async (callLog) => {
    const newLog: CallLog = {
      ...callLog,
      id: `call-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    set(state => ({ callLogs: [newLog, ...state.callLogs] }))
  },

  addCampaign: async (campaign) => {
    const newCmp: Campaign = {
      ...campaign,
      id: `cmp-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    set(state => ({ campaigns: [...state.campaigns, newCmp] }))
  },

  sendCampaign: async (id) => {
    set(state => ({
      campaigns: state.campaigns.map(cmp => 
        cmp.id === id 
          ? { 
              ...cmp, 
              status: 'SENT', 
              sentCount: cmp.recipientCount, 
              sentAt: new Date().toISOString(),
              revenue: cmp.revenue || Math.floor(cmp.recipientCount * 0.2 * 120) // simulate 20% conversion at $120 spent
            } 
          : cmp
      )
    }))
  }
}))
