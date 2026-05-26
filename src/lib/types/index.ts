export type Channel = 'VOICE' | 'WHATSAPP' | 'SMS' | 'WEB'

export type AppointmentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'CANCELLED'

export type AppointmentType = string

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
  createdAt: string
  startedAt: string
  durationSeconds: number
  duration: string // computed display e.g. "1m 45s"
  status: 'completed' | 'missed' | 'answered'
  rawStatus?: string
  costUsd: number
  source: string
  recordingUrl?: string
  transcript?: string
  summary?: string
  type?: string
  assistantId?: string
  vapiAccount: string
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

export interface ClinicService {
  service_type: string
  service_label: string
  category: string
  duration_min: number
  price_usd: number
  price_note?: string
  enabled: boolean
  requires_consultation: boolean
}

export interface WhatsAppMessage {
  id: string
  tenant_id: string
  contact_name: string
  phone_number: string
  direction: 'outbound' | 'inbound'
  message_body: string
  status: 'sent' | 'delivered' | 'read'
  appointment_status: string
  timestamp: string
}

export interface WhatsAppInbound {
  id: string
  tenant_id: string
  phone_number: string
  message_body: string
  is_read: boolean
  timestamp: string
}

export interface WhatsAppConfig {
  id: string
  tenant_id: string
  api_url: string
  auth_token: string
  phone_number_id: string
  webhook_verify_token: string
  status: 'CONNECTED' | 'NOT_CONNECTED'
  created_at: string
  updated_at: string
}
