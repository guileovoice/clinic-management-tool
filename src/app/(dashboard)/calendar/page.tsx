'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  UserX,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { toast } from 'react-hot-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

const TIMES = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
]

export default function ClinicalCalendarPage() {
  const { appointments, patients, addAppointment, updateAppointmentStatus, deleteAppointment, info } = useClinicStore()
  const [selectedDate, setSelectedDate] = useState('2026-05-18')
  
  // View mode and current month selection state
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day')
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1)) // May 2026

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const formatDateString = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Get days for the currentMonth view
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDayOfWeek = firstDay.getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  
  const monthDays = []
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i)
    monthDays.push({ date: prevDate, isCurrentMonth: false })
  }
  for (let i = 1; i <= totalDays; i++) {
    monthDays.push({ date: new Date(year, month, i), isCurrentMonth: true })
  }

  // Modals & drawers state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ time: string } | null>(null)
  const [selectedApt, setSelectedApt] = useState<any | null>(null)

  // Booking fields
  const [patientId, setPatientId] = useState('')
  const [aptType, setAptType] = useState<'CHECKUP' | 'CONSULTATION' | 'PROCEDURE' | 'EMERGENCY'>('CHECKUP')
  const [providerName, setProviderName] = useState('Dr. Arthur Mendes')
  const [duration, setDuration] = useState('45')
  const [notes, setNotes] = useState('')
  const [amount, setAmount] = useState('150')

  // Group appointments by time slot for the selected date
  const filteredApts = appointments.filter(apt => apt.date === selectedDate)

  // Triggered when an empty time slot is clicked to book
  const handleSlotClick = (time: string) => {
    // Check if slot already has a booking
    const occupied = filteredApts.find(apt => apt.time === time)
    if (occupied) {
      setSelectedApt(occupied)
      return
    }
    
    setSelectedSlot({ time })
    setIsNewModalOpen(true)
  }

  // Handle clinical booking save with conflict detection
  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !selectedSlot) {
      toast.error("Please select a registered patient.")
      return
    }

    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    // Conflict detection engine
    const conflict = appointments.find(
      apt => apt.date === selectedDate && apt.time === selectedSlot.time
    )
    if (conflict) {
      toast.error(`Conflict detected! Dr. Mendes already has an active checkup booked at ${selectedSlot.time}.`)
      return
    }

    await addAppointment({
      tenantId: '395b50b9-9504-4bda-bd38-7ce5b53e7aa0',
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      date: selectedDate,
      time: selectedSlot.time,
      duration: Number(duration),
      status: 'PENDING',
      type: aptType,
      providerName,
      totalAmount: Number(amount),
      insuranceVerified: patient.insurance.status === 'VERIFIED',
      notes
    })

    toast.success(`Clinical ${aptType} appointment scheduled successfully at ${selectedSlot.time}!`)
    setIsNewModalOpen(false)
    
    // Reset inputs
    setPatientId('')
    setNotes('')
  }

  // Toggle status
  const handleUpdateStatus = async (id: string, status: any) => {
    await updateAppointmentStatus(id, status)
    setSelectedApt(null)
    toast.success(`Appointment status updated to ${status}!`)
  }

  // Cancel / Delete schedule
  const handleCancelApt = async (id: string) => {
    await deleteAppointment(id)
    setSelectedApt(null)
    toast.success("Appointment canceled and deleted from schedule.")
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Clinical Booking Calendar" 
        subtitle="Real-time appointment scheduler, automated conflict checks, and SMS/WhatsApp reminder triggers."
        actions={
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface border border-border p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  viewMode === 'day' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Day View
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  viewMode === 'month' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Month View
              </button>
            </div>
            
            {/* Today/Tomorrow shortcut (Only in Day View) */}
            {viewMode === 'day' && (
              <div className="flex items-center bg-surface border border-border p-1.5 rounded-xl">
                <button 
                  onClick={() => setSelectedDate('2026-05-18')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedDate === '2026-05-18' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Today (May 18)
                </button>
                <button 
                  onClick={() => setSelectedDate('2026-05-19')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedDate === '2026-05-19' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Tomorrow (May 19)
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Calendar Grid */}
        <div className="xl:col-span-8 space-y-4">
          {viewMode === 'day' ? (
            <Card className="p-6 bg-surface border-border overflow-hidden">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" /> Care Schedule Grid
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Click any free slot to schedule a patient booking.</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest font-mono">
                  {selectedDate}
                </Badge>
              </div>

              {/* Time Slot list */}
              <div className="space-y-3">
                {TIMES.map(time => {
                  const apt = filteredApts.find(a => a.time === time)
                  return (
                    <div 
                      key={time}
                      onClick={() => handleSlotClick(time)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        apt 
                          ? 'bg-surface2 border-border hover:border-primary/40' 
                          : 'bg-background/40 border-dashed border-border hover:bg-surface2/30 hover:border-primary/30'
                      }`}
                    >
                      {/* Time slot header */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold font-mono">
                          <Clock className="w-3.5 h-3.5" /> {time}
                        </div>
                        <div className="w-px h-5 bg-border hidden sm:block" />
                        
                        {apt ? (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-text-primary">{apt.patientName}</p>
                            <p className="text-[9px] text-text-muted font-mono font-bold uppercase">
                              Procedure: {apt.type} · Doctor: {apt.providerName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-text-muted group-hover:text-primary" /> Free Slot
                          </span>
                        )}
                      </div>

                      {/* Right side Badge state */}
                      {apt && (
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            apt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>{apt.status}</span>
                          {apt.insuranceVerified && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Benefits Verified
                            </span>
                          )}
                          <span className="text-xs font-black text-text-primary">${apt.totalAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-surface border-border overflow-hidden">
              {/* Monthly Calendar View */}
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" /> Month Schedule Calendar
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Click any date to inspect visits or manage bookings.</p>
                </div>
                
                {/* Month Selector Controls */}
                <div className="flex items-center gap-2 border border-border rounded-xl p-1 bg-surface2">
                  <Button 
                    type="button"
                    size="icon" 
                    variant="ghost" 
                    onClick={handlePrevMonth}
                    className="h-7 w-7 text-text-muted hover:text-text-primary hover:bg-surface"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-black uppercase tracking-wider text-text-primary px-2 font-mono">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button 
                    type="button"
                    size="icon" 
                    variant="ghost" 
                    onClick={handleNextMonth}
                    className="h-7 w-7 text-text-muted hover:text-text-primary hover:bg-surface"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Weekday labels */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-text-muted pb-2 border-b border-border">
                    {day}
                  </div>
                ))}

                {/* Day cells */}
                {monthDays.map((day, idx) => {
                  const dateStr = formatDateString(day.date)
                  const dayApts = appointments.filter(a => a.date === dateStr)
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === '2026-05-18'
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : day.isCurrentMonth 
                          ? 'bg-background/40 border-border hover:bg-surface2/50 hover:border-primary/30'
                          : 'bg-background/10 border-border/40 opacity-40 hover:opacity-75'
                      }`}
                    >
                      {/* Day number & status */}
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-black font-mono ${
                          isToday 
                            ? 'w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center'
                            : isSelected
                            ? 'text-primary'
                            : 'text-text-primary'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        
                        {dayApts.length > 0 && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-mono">
                            {dayApts.length} visit{dayApts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Display small appointment cards if they exist */}
                      <div className="mt-2 space-y-1 flex-1 flex flex-col justify-end">
                        {dayApts.slice(0, 2).map((apt) => (
                          <div 
                            key={apt.id} 
                            className={`p-1 rounded text-[8px] font-black uppercase truncate border ${
                              apt.status === 'CONFIRMED'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : apt.status === 'COMPLETED'
                                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                : apt.status === 'NO_SHOW'
                                ? 'bg-danger/10 text-danger border-danger/20'
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}
                          >
                            {apt.time} · {apt.patientName.split(' ')[0]}
                          </div>
                        ))}
                        {dayApts.length > 2 && (
                          <div className="text-[7px] font-bold text-text-muted text-center uppercase tracking-widest pt-0.5">
                            + {dayApts.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Predictive intelligence & Patient check-in panel */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Booking / Appointment detail info card */}
          {selectedApt ? (
            <Card className="p-6 bg-surface border-border animate-in slide-in-from-right duration-300">
              <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Visit Management
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Patient Name</p>
                  <p className="text-sm font-black text-text-primary">{selectedApt.patientName}</p>
                  <p className="text-[10px] text-text-muted font-mono">{selectedApt.patientPhone}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Time Slot</p>
                    <p className="text-xs font-bold text-text-primary">{selectedApt.time} ({selectedApt.duration} mins)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Procedural Bill</p>
                    <p className="text-xs font-bold text-text-primary">${selectedApt.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Clinical Notes</p>
                  <p className="text-xs text-text-muted bg-surface2 p-3 rounded-lg border border-border italic">
                    "{selectedApt.notes || 'No treatment details added.'}"
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Clinic Status Actions</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleUpdateStatus(selectedApt.id, 'COMPLETED')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-bold text-[10px] uppercase tracking-wider"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Check-in Complete
                    </Button>
                    <Button 
                      onClick={() => handleUpdateStatus(selectedApt.id, 'NO_SHOW')}
                      className="bg-danger hover:bg-danger-dark text-white gap-2 font-bold text-[10px] uppercase tracking-wider"
                    >
                      <UserX className="w-3.5 h-3.5" /> Tag No-Show
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => {
                        toast.success("24h safety reminder queued to send via WhatsApp!")
                      }}
                      variant="outline" 
                      className="border-border bg-surface2 text-text-primary text-[9px] font-bold uppercase tracking-widest"
                    >
                      Send SMS Reminder
                    </Button>
                    <Button 
                      onClick={() => handleCancelApt(selectedApt.id)}
                      variant="outline" 
                      className="border-border bg-surface2 text-danger hover:bg-danger/10 hover:border-danger/30 text-[9px] font-bold uppercase tracking-widest"
                    >
                      Cancel Schedule
                    </Button>
                  </div>

                  <Button 
                    onClick={() => setSelectedApt(null)}
                    variant="ghost"
                    className="w-full mt-2 text-text-muted hover:text-text-primary text-[9px] font-bold uppercase tracking-widest"
                  >
                    ← Back to Schedule
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            viewMode === 'month' ? (
              <Card className="p-6 bg-surface border-border space-y-4">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                      Schedule for {selectedDate}
                    </h3>
                    <p className="text-[10px] text-text-muted mt-0.5">Visits scheduled for this day.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      const occupiedTimes = appointments.filter(a => a.date === selectedDate).map(a => a.time)
                      const freeTime = TIMES.find(t => !occupiedTimes.includes(t)) || '09:00'
                      setSelectedSlot({ time: freeTime })
                      setIsNewModalOpen(true)
                    }}
                    size="sm"
                    className="bg-primary/20 hover:bg-primary/30 text-primary border-none text-[9px] font-black uppercase tracking-widest h-7 gap-1"
                  >
                    <Plus className="w-3 h-3" /> Book Day
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {appointments.filter(a => a.date === selectedDate).length > 0 ? (
                    appointments.filter(a => a.date === selectedDate).map(apt => (
                      <div 
                        key={apt.id}
                        onClick={() => setSelectedApt(apt)}
                        className="p-3 rounded-xl border border-border bg-surface2 hover:bg-background/40 hover:border-primary/30 transition-all cursor-pointer flex justify-between items-center gap-2"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-black text-text-primary leading-none">{apt.patientName}</p>
                          <p className="text-[9px] text-text-muted font-mono font-bold uppercase">
                            {apt.time} · {apt.type}
                          </p>
                        </div>
                        <Badge className={`text-[8px] font-black uppercase border-none px-2 py-0.5 ${
                          apt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>{apt.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-text-muted text-[10px] uppercase font-bold tracking-wider">
                      No visits scheduled.
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => setViewMode('day')}
                  className="w-full bg-surface2 hover:bg-surface border border-border text-text-primary text-[9px] font-bold uppercase tracking-widest h-9"
                >
                  Switch to Hourly Day View
                </Button>
              </Card>
            ) : (
              <Card className="p-6 bg-surface border-border flex flex-col justify-center items-center py-16 text-center">
                <Sparkles className="w-10 h-10 text-primary/40 animate-pulse mb-4" />
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">No Appointment Selected</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-[200px]">
                  Click an existing appointment slot in the schedule grid to manage patient status, reminders, and billing.
                </p>
              </Card>
            )
          )}

          {/* No Show prevention indicator summary */}
          <Card className="p-6 bg-surface border-border">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldAlert className={`w-5 h-5 shrink-0 ${info.smsNoShowAlerts || info.waConfirmations ? 'text-emerald-500' : 'text-amber-500'}`} /> 
              Safety Reminders {info.smsNoShowAlerts || info.waConfirmations ? 'Active' : 'Paused'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {info.smsNoShowAlerts || info.waConfirmations ? (
                <>Guileo AI's **no-show prevention engine** triggers automated confirmations to patients prior to booking time.</>
              ) : (
                <>Guileo AI's automated reminders are currently **paused**. Reactivate safety confirmation protocols under System Settings.</>
              )}
            </p>
            <div className="mt-4 space-y-2">
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                info.smsNoShowAlerts 
                  ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                  : 'bg-amber-500/5 border-amber-500/10 text-amber-500'
              }`}>
                <CheckCircle className={`w-4 h-4 shrink-0 ${info.smsNoShowAlerts ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  SMS 24h & 2h confirmations: {info.smsNoShowAlerts ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                info.waConfirmations 
                  ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                  : 'bg-amber-500/5 border-amber-500/10 text-amber-500'
              }`}>
                <CheckCircle className={`w-4 h-4 shrink-0 ${info.waConfirmations ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  WhatsApp Safety confirm: {info.waConfirmations ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* dialog to schedule new appointments */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="bg-surface border-border p-6 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> Book Clinical Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Select a registered patient and set treatment details for the {selectedSlot?.time} slot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBooking} className="space-y-4 pt-4">
            
            {/* patient selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Select Patient</label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="w-full bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border">
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-semibold text-text-primary">
                      {p.name} ({p.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* doctor / provider */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Clinical Provider</label>
              <Input 
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="bg-surface2 border-border h-10 text-xs font-bold text-text-primary"
              />
            </div>

            {/* procedure type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Procedure Type</label>
                <Select value={aptType} onValueChange={setAptType as any}>
                  <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-bold text-text-primary">
                    <SelectValue placeholder="Checkup" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border">
                    <SelectItem value="CHECKUP" className="text-xs font-semibold text-text-primary">Checkup</SelectItem>
                    <SelectItem value="CONSULTATION" className="text-xs font-semibold text-text-primary">Consultation</SelectItem>
                    <SelectItem value="PROCEDURE" className="text-xs font-semibold text-text-primary">Procedure</SelectItem>
                    <SelectItem value="EMERGENCY" className="text-xs font-semibold text-text-primary">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* total procedural charge */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Estimated Bill ($)</label>
                <Input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-surface2 border-border h-10 text-xs font-mono font-bold text-text-primary"
                />
              </div>
            </div>

            {/* duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Duration (min)</label>
                <Input 
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-surface2 border-border h-10 text-xs font-mono font-bold text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Time Slot</label>
                <Input 
                  disabled
                  value={selectedSlot?.time || ''}
                  className="bg-surface2/50 border-border h-10 text-xs font-mono font-bold text-text-muted"
                />
              </div>
            </div>

            {/* clinical notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Clinical Notes</label>
              <Input 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Treatment symptoms, teeth codes..."
                className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNewModalOpen(false)}
                className="border-border bg-surface2 text-text-primary font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider"
              >
                Schedule Visit
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
