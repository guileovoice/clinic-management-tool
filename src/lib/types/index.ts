export type Channel = 'VOICE' | 'WHATSAPP' | 'SMS' | 'WEB'

export type AppointmentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'CANCELLED'

export type AppointmentType = 
  | 'CHECKUP' 
  | 'CONSULTATION' 
  | 'PROCEDURE' 
  | 'EMERGENCY'

export interface Consent {
  essential: boolean
  marketing: boolean
  intelligence: boolean
}

export interface InsuranceRecord {
  provider: string
  policyNumber: string
  groupNumber?: string
  status: 'VERIFIED' | 'FAILED' | 'PENDING'
  coverageDetails?: string
}

export interface Patient {
  id: string
  tenantId: string
  name: string
  phone: string
  email: string
  preferredChannel: Channel
  consents: Consent
  totalAppointments: number
  totalSpent: number
  averageAppointmentValue: number
  lastAppointmentAt: string
  firstAppointmentAt: string
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  rfmSegment: 'CHAMPION' | 'LOYAL' | 'NEW' | 'AT_RISK'
  insurance: InsuranceRecord
  treatmentHistory: string[]
  allergens: string[]
  medications: string[]
  createdAt: string
}

export interface Appointment {
  id: string
  tenantId: string
  patientId: string
  patientName: string
  patientPhone: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  duration: number // minutes
  status: AppointmentStatus
  type: AppointmentType
  providerName: string
  totalAmount: number
  notes?: string
  createdAt: string
  insuranceVerified: boolean
}

export interface CallLog {
  id: string
  tenantId: string
  patientName: string
  phone: string
  timestamp: string
  duration: string // e.g. "2m 14s"
  status: 'completed' | 'missed' | 'answered'
  recordingUrl?: string
  transcript?: string
  summary?: string
  actionRequired: boolean
}

export interface Campaign {
  id: string
  tenantId: string
  name: string
  channel: 'VOICE' | 'WHATSAPP' | 'SMS'
  status: 'DRAFT' | 'SCHEDULED' | 'SENT'
  segment: string
  recipientCount: number
  sentCount: number
  revenue?: number
  message: string
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}
