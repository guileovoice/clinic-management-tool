'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  AlertTriangle, 
  Plus, 
  X,
  Heart,
  BadgeAlert,
  Send,
  UserX,
  CreditCard
} from 'lucide-react'
import { useClinicStore, getServiceLabel } from '@/lib/stores/clinicStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

export default function PatientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { patients, appointments, callLogs, services } = useClinicStore()
  const [mounted, setMounted] = useState(false)

  const [newProcedure, setNewProcedure] = useState('')
  const [newAllergen, setNewAllergen] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const { updatePatient } = useClinicStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const patient = patients.find(p => p.id === id)
  const patientApts = appointments.filter(apt => apt.patientId === id)
  const patientCalls = callLogs.filter(call => call.phone === patient?.phone)

  const handleAddItem = async (field: 'treatmentHistory' | 'allergens' | 'medications', value: string) => {
    if (!value.trim() || !patient) return
    const updated = [...patient[field], value.trim()]
    await updatePatient(patient.id, { [field]: updated })
    if (field === 'treatmentHistory') setNewProcedure('')
    else if (field === 'allergens') setNewAllergen('')
    else setNewMedication('')
    toast.success(`${field === 'treatmentHistory' ? 'Procedure' : field === 'allergens' ? 'Allergen' : 'Medication'} added`)
  }

  const handleRemoveItem = async (field: 'treatmentHistory' | 'allergens' | 'medications', index: number) => {
    if (!patient) return
    const updated = patient[field].filter((_, i) => i !== index)
    await updatePatient(patient.id, { [field]: updated })
    toast.success('Item removed')
  }

  if (!patient) {
    return (
      <div className="py-24 text-center">
        <p className="text-text-muted font-bold">Patient record loading or not found...</p>
      </div>
    )
  }

  // Insurance check action simulation
  const handleVerifyInsurance = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Connecting to clearinghouse & verifying policy benefits...',
        success: 'Insurance pre-authorization verified! Copay confirmed.',
        error: 'Connection timeout. Please retry.'
      }
    )
  }

  return (
    <div suppressHydrationWarning className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header Back bar */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 border border-border bg-surface text-text-muted hover:text-text-primary active:scale-95"
          onClick={() => router.push('/patients')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em]">Patient Medical Chart</h2>
          <h1 className="text-2xl font-bold text-text-primary">{patient.name}</h1>
        </div>
      </div>

      {/* Patient demographics overview */}
      <Card className="p-6 bg-surface border-border">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
          <div className="flex items-start gap-6 pr-8 lg:border-r border-border flex-1">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-3xl font-black shrink-0">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                  {patient.rfmSegment}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-text-muted font-semibold">
                  <Phone className="w-3.5 h-3.5" /> {patient.phone}
                </div>
              </div>
              <p className="text-sm text-text-primary font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-muted" /> {patient.email}
              </p>
              
              {/* GDPR Privacy Consent checklist */}
              <div className="flex gap-1.5 pt-1">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${patient.consents.essential ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-surface2 text-text-muted'}`}>Essential: Confirmed</span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${patient.consents.marketing ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20' : 'bg-surface2 text-text-muted'}`}>SMS Marketing: {patient.consents.marketing ? 'Opted-in' : 'No'}</span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${patient.consents.intelligence ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-surface2 text-text-muted'}`}>AI Analytics: {patient.consents.intelligence ? 'Granted' : 'Withdrawn'}</span>
              </div>
            </div>
          </div>

          {/* Quick clinical stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Visits</p>
              <h4 className="text-xl font-bold text-text-primary">{patient.totalAppointments}</h4>
              <p className="text-[9px] text-emerald-500 font-bold">Loyal Care plan</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Lifetime value</p>
              <h4 className="text-xl font-bold text-text-primary">${patient.totalSpent.toFixed(2)}</h4>
              <p className="text-[9px] text-text-muted">Direct Stripe connect</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Avg Visit Cost</p>
              <h4 className="text-xl font-bold text-text-primary">${patient.averageAppointmentValue.toFixed(2)}</h4>
              <p className="text-[9px] text-text-muted">Calculated AOV</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Patient Since</p>
              <h4 className="text-xl font-bold text-text-primary">2025</h4>
              <p className="text-[9px] text-text-muted">
                {mounted && patient.firstAppointmentAt && !isNaN(new Date(patient.firstAppointmentAt).getTime())
                  ? format(new Date(patient.firstAppointmentAt), 'MMM yyyy')
                  : 'New Patient'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Left chart history vs Right Clinical stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: History */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Medical history & treatments checklist */}
          <Card className="p-6 bg-surface border-border">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Patient Clinical Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Treatment log */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest">Procedures Done</h4>
                <div className="space-y-1">
                  {patient.treatmentHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs font-bold text-text-primary p-2 bg-surface2 rounded-lg border border-border">
                      <span>{item}</span>
                      <button onClick={() => handleRemoveItem('treatmentHistory', idx)} className="text-danger hover:text-danger/80 shrink-0 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newProcedure}
                    onChange={e => setNewProcedure(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem('treatmentHistory', newProcedure)}
                    placeholder="Add procedure..."
                    className="flex-1 text-xs bg-surface2 border border-border rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={() => handleAddItem('treatmentHistory', newProcedure)}
                    className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Allergens log */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-danger tracking-widest flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Allergic Warnings
                </h4>
                <div className="space-y-1">
                  {patient.allergens.length > 0 ? (
                    patient.allergens.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs font-bold text-danger p-2 bg-danger/5 border border-danger/20 rounded-lg">
                        <span>{item}</span>
                        <button onClick={() => handleRemoveItem('allergens', idx)} className="text-danger hover:text-danger/80 shrink-0 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted italic">No allergies recorded</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newAllergen}
                    onChange={e => setNewAllergen(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem('allergens', newAllergen)}
                    placeholder="Add allergen..."
                    className="flex-1 text-xs bg-surface2 border border-border rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-danger/40"
                  />
                  <button
                    onClick={() => handleAddItem('allergens', newAllergen)}
                    className="p-1.5 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active medications */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Prescribed Medications</h4>
                <div className="space-y-1">
                  {patient.medications.length > 0 ? (
                    patient.medications.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs font-bold text-amber-500 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <span>{item}</span>
                        <button onClick={() => handleRemoveItem('medications', idx)} className="text-amber-500 hover:text-amber-500/80 shrink-0 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted italic">No active prescriptions</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newMedication}
                    onChange={e => setNewMedication(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem('medications', newMedication)}
                    placeholder="Add medication..."
                    className="flex-1 text-xs bg-surface2 border border-border rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-amber-500/40"
                  />
                  <button
                    onClick={() => handleAddItem('medications', newMedication)}
                    className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </Card>

          {/* Appointment history */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Clinic Visit History
            </h3>
            
            <div className="space-y-3">
              {patientApts.map(apt => (
                <Card key={apt.id} className="p-4 bg-surface border-border hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface2 flex items-center justify-center font-mono text-xs font-bold text-text-muted border border-border">
                        #{apt.id.split('-')[1] || '102'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-text-primary">{apt.date} · {apt.time}</p>
                        <p className="text-xs text-text-muted font-semibold">Assigned: {apt.providerName} · Procedure: {getServiceLabel(apt.type, services)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-black text-text-primary">${apt.totalAmount.toFixed(2)}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        apt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>{apt.status}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Predictive analytics and Quick actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Predictive scheduling card */}
          <Card className="p-6 bg-surface border-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
            <h3 className="text-base font-black text-text-primary flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" /> Predictive Care Profile
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-text-muted">No-Show Risk</span>
                  <span className="text-emerald-500 font-extrabold">LOW (2%)</span>
                </div>
                <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[2%]" />
                </div>
              </div>

              {/* Insurance status verification card */}
              <div className="p-4 bg-surface2 rounded-xl border border-border">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> Insurance Benefits
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-text-primary">Provider: {patient.insurance.provider}</p>
                  <p className="font-mono text-text-muted">Policy: {patient.insurance.policyNumber}</p>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed italic">"{patient.insurance.coverageDetails || 'Benefits verification pending.'}"</p>
                </div>
              </div>

              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <p className="text-xs font-black text-violet-400 mb-1.5 uppercase tracking-widest">Next Recommended Treatment</p>
                <p className="text-xs text-text-primary leading-relaxed">
                  Maria is due for her **Teeth Whitening touch-up** in 14 days. Mention on the next call to secure booking.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick HIPAA-compliant actions */}
          <Card className="p-6 bg-surface border-border">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={handleVerifyInsurance}
                className="w-full bg-primary hover:bg-primary-dark text-white gap-3 h-11 font-bold text-xs uppercase tracking-wider"
              >
                <ShieldCheck className="w-4 h-4" /> Verify Insurance Eligibility
              </Button>
              <Button variant="outline" className="w-full border-border bg-surface2 text-text-primary gap-3 h-11 font-bold text-xs uppercase tracking-wider">
                <Send className="w-4 h-4 text-violet-500" /> Send Appointment Prompt
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => toast.success("GDPR Patient Record export queued!")}
                  variant="outline" 
                  className="border-border bg-surface2 text-text-primary gap-2 h-10 font-bold text-[9px] uppercase tracking-widest"
                >
                  DSR Export
                </Button>
                <Button 
                  onClick={() => toast.error("HIPAA records are protected. Admin access required.")}
                  variant="outline" 
                  className="border-border bg-surface2 text-danger hover:bg-danger/10 hover:border-danger/30 gap-2 h-10 font-bold text-[9px] uppercase tracking-widest"
                >
                  Delete Profile
                </Button>
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  )
}
