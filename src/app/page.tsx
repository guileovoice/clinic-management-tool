'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  HeartHandshake, 
  LockKeyhole,
  Check,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '@/lib/stores/clinicStore'

const SERVICES = [
  { id: 'CHECKUP', name: 'Routine Checkup & Cleaning', duration: 45, price: 150, description: 'Comprehensive oral exam, polishing, and standard screening.' },
  { id: 'PROCEDURE', name: 'Teeth Whitening Touch-up', duration: 60, price: 320, description: 'Premium in-office whitening procedure for a radiant smile.' },
  { id: 'CONSULTATION', name: 'Crown & Aesthetic Consultation', duration: 30, price: 90, description: 'Personalized treatment plan for porcelain crowns and veneers.' },
  { id: 'EMERGENCY', name: 'Emergency Toothache Relief', duration: 45, price: 200, description: 'Urgent diagnostic examination and immediate pain alleviation.' }
]

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
]

export default function LandingPage() {
  const { addPatient, addAppointment } = useClinicStore()

  const [dynamicServices, setDynamicServices] = useState<any[]>([])

  React.useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.filter(s => s.enabled !== false).map(s => ({
            id: s.service_type,
            name: s.service_label,
            duration: s.duration_min,
            price: s.price_usd,
            description: s.price_note || `${s.category} treatment`
          }))
          setDynamicServices(mapped)
          setSelectedService(mapped[0])
        }
      })
      .catch(err => console.warn("Failed to load dynamic services:", err))
  }, [])

  const activeServices = dynamicServices.length > 0 ? dynamicServices : SERVICES

  // Form Booking Wizard States
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(SERVICES[0])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [insuranceProvider, setInsuranceProvider] = useState('Uninsured')
  const [insurancePolicy, setInsurancePolicy] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookedDetails, setBookedDetails] = useState<any>(null)

  // Custom Calendar Picker States & Helpers
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ]

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const blankDays = Array(firstDayIndex).fill(null)
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1)

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day)
    const yyyy = selected.getFullYear()
    const mm = String(selected.getMonth() + 1).padStart(2, '0')
    const dd = String(selected.getDate()).padStart(2, '0')
    setSelectedDate(`${yyyy}-${mm}-${dd}`)
    // Reset time selection if changing date
    setSelectedTime('')
  }

  const isPast = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(year, month, day)
    return checkDate < today
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const checkDate = new Date(year, month, day)
    const yyyy = checkDate.getFullYear()
    const mm = String(checkDate.getMonth() + 1).padStart(2, '0')
    const dd = String(checkDate.getDate()).padStart(2, '0')
    return selectedDate === `${yyyy}-${mm}-${dd}`
  }

  const prevMonth = () => {
    const today = new Date()
    if (year === today.getFullYear() && month === today.getMonth()) {
      return
    }
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !patientName || !patientPhone) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      const patientId = generateUUID()
      const tenantId = '395b50b9-9504-4bda-bd38-7ce5b53e7aa0'

      // 1. Add patient record to store and Supabase
      const resolvedPatientId = await addPatient({
        id: patientId,
        tenantId,
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
        preferredChannel: 'VOICE',
        consents: { essential: true, marketing: true, intelligence: true },
        totalAppointments: 1,
        totalSpent: selectedService.price,
        averageAppointmentValue: selectedService.price,
        lastAppointmentAt: new Date().toISOString(),
        firstAppointmentAt: new Date().toISOString(),
        churnRisk: 'LOW',
        rfmSegment: 'NEW',
        insurance: {
          provider: insuranceProvider,
          policyNumber: insurancePolicy,
          status: insuranceProvider === 'Uninsured' ? 'FAILED' : 'PENDING'
        },
        treatmentHistory: [selectedService.name],
        allergens: [],
        medications: []
      })

      // 2. Add appointment record
      await addAppointment({
        tenantId,
        patientId: resolvedPatientId,
        patientName,
        patientPhone,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration,
        status: 'PENDING',
        type: selectedService.id as any,
        providerName: 'Dr. Arthur Mendes',
        totalAmount: selectedService.price,
        insuranceVerified: insuranceProvider !== 'Uninsured',
        notes: `Online booking from public clinic website.`
      })

      setBookedDetails({
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        doctor: 'Dr. Arthur Mendes',
        price: selectedService.price
      })
      setBookingSuccess(true)
      toast.success('Appointment booked successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Booking failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setBookingSuccess(false)
    setBookedDetails(null)
    setSelectedDate('')
    setSelectedTime('')
    setPatientName('')
    setPatientPhone('')
    setPatientEmail('')
    setInsuranceProvider('Uninsured')
    setInsurancePolicy('')
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-primary selection:text-white font-sans overflow-x-hidden">
      
      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-x-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-md border border-white/10">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider uppercase font-mono block">Origem Dental</span>
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest block -mt-0.5">Aesthetic Clinic</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-text-muted">
            <a href="#services" className="hover:text-white transition-colors">Treatments</a>
            <a href="#about" className="hover:text-white transition-colors">Our Standard</a>
            <a href="#scheduler" className="hover:text-white transition-colors">Book Online</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 border border-white/10 hover:border-white/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 hover:bg-white/5"
            >
              <LockKeyhole className="w-3.5 h-3.5 text-primary" /> Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
            <Activity className="w-3.5 h-3.5" /> Next-Gen Dental & Aesthetic Care
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] text-white">
            Transforming Smiles <br/>
            With <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Digital Precision</span>.
          </h1>
          <p className="text-text-muted text-sm leading-relaxed max-w-xl">
            Welcome to Origem. We combine premium dental operations, AI-assisted screening procedures, and patient-first diagnostics to deliver dental care of the highest aesthetic standard.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <a 
              href="#scheduler" 
              className="px-8 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              Book Appointment Now <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="#services" 
              className="px-8 h-12 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center"
            >
              Explore Services
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5 max-w-md">
            <div>
              <span className="text-2xl font-black text-white font-mono block">99.4%</span>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Satisfaction</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white font-mono block">15k+</span>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Procedures</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white font-mono block">HIPAA</span>
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Secured Records</span>
            </div>
          </div>
        </div>

        {/* Hero Features Card */}
        <div className="lg:col-span-5 p-8 bg-surface border border-border/80 rounded-2xl relative shadow-2xl">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
            <HeartHandshake className="w-4.5 h-4.5 text-primary" /> Premium Operations
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-surface2/60 border border-border/40 rounded-xl flex gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Automated Verification</h4>
                <p className="text-[10px] text-text-muted mt-1 leading-normal">Instant insurance policy eligibility verification upon online booking.</p>
              </div>
            </div>
            <div className="p-4 bg-surface2/60 border border-border/40 rounded-xl flex gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Voice AI Assistant</h4>
                <p className="text-[10px] text-text-muted mt-1 leading-normal">Virtual assistant Dr. Arthur provides 24/7 reminder adjustments and recall support.</p>
              </div>
            </div>
            <div className="p-4 bg-surface2/60 border border-border/40 rounded-xl flex gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Clinical Standards</h4>
                <p className="text-[10px] text-text-muted mt-1 leading-normal">Elite dental technicians operating under maximum sanitary safety guidelines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TREATMENTS / SERVICES SECTION */}
      <section id="services" className="py-24 border-y border-white/5 bg-surface/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Treatments Menu</span>
            <h2 className="text-3xl font-black uppercase tracking-wider">Aesthetic & Dental Procedures</h2>
            <p className="text-text-muted text-xs leading-relaxed">
              Discover our core service menu. We perform aesthetic refinements, restorative corrections, and routine cleanings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeServices.map((srv) => (
              <div 
                key={srv.id} 
                className="p-6 bg-surface border border-border/60 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all group"
              >
                <div className="space-y-4">
                  <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider text-text-muted block w-max">
                    {srv.duration} mins duration
                  </span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-primary transition-colors">
                    {srv.name}
                  </h4>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    {srv.description}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Clinic Price</span>
                  <span className="text-sm font-black text-white font-mono">${srv.price}.00</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING SCHEDULER WIZARD */}
      <section id="scheduler" className="py-24 max-w-3xl mx-auto px-6 relative">
        
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center space-y-3 mb-10 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Interactive Booking</span>
          <h2 className="text-3xl font-black uppercase tracking-wider">Schedule Your Treatment</h2>
          <p className="text-text-muted text-xs leading-relaxed max-w-md mx-auto">
            Reserve your clinical slot instantly. Our automated system handles insurance validation and dispatches scheduling confirmations.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 relative z-10 shadow-2xl">
          
          {/* Progress Indicators */}
          <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8 text-[9px] font-black uppercase tracking-wider text-text-muted">
            <button 
              onClick={() => !bookingSuccess && setStep(1)} 
              className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : ''}`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-mono">1</span> Choose Service
            </button>
            <div className="h-[1px] bg-white/5 flex-1 mx-4" />
            <button 
              onClick={() => !bookingSuccess && step >= 2 && setStep(2)} 
              className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : ''}`}
              disabled={step < 2}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-mono">2</span> Date & Time
            </button>
            <div className="h-[1px] bg-white/5 flex-1 mx-4" />
            <span className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : ''}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-mono">3</span> Patient Details
            </span>
          </div>

          {bookingSuccess ? (
            /* SUCCESS VIEW */
            <div className="text-center py-10 space-y-6 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-wider">Appointment Reserved!</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                  Your appointment is registered in our database under PENDING verification status. You will receive WhatsApp / SMS alerts shortly.
                </p>
              </div>

              <div className="p-4 bg-surface2 border border-border/80 rounded-xl max-w-md mx-auto text-left space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-muted uppercase">Treatment:</span>
                  <span className="text-white font-bold">{bookedDetails?.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted uppercase">Date & Time:</span>
                  <span className="text-white font-bold">{bookedDetails?.date} at {bookedDetails?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted uppercase">Clinical Provider:</span>
                  <span className="text-primary font-bold">{bookedDetails?.doctor}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                  <span className="text-text-muted uppercase">Est. Amount:</span>
                  <span className="text-white font-bold">${bookedDetails?.price}.00</span>
                </div>
              </div>

              <button 
                onClick={resetForm}
                className="px-8 h-11 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Book Another Appointment
              </button>
            </div>
          ) : (
            /* WIZARD FORM */
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              
              {/* STEP 1: SELECT SERVICE */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Select Your Required Treatment:</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {activeServices.map((srv) => (
                      <button
                        type="button"
                        key={srv.id}
                        onClick={() => setSelectedService(srv)}
                        className={`p-4 bg-surface2/60 border rounded-xl text-left transition-all flex justify-between items-center ${
                          selectedService.id === srv.id 
                            ? 'border-primary shadow-lg shadow-primary/5 bg-primary/5' 
                            : 'border-border/60 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{srv.name}</h4>
                          <p className="text-[10px] text-text-muted leading-tight">{srv.description}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="text-xs font-black text-white font-mono block">${srv.price}</span>
                          <span className="text-[8px] text-text-muted uppercase font-bold">{srv.duration} mins</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 h-11 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                    >
                      Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DATE & TIME */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Choose Date & Time:</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* CALENDAR COLUMN */}
                    <div className="md:col-span-7 space-y-3.5">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Select Visit Date
                      </label>
                      
                      <div className="p-4 bg-surface2 border border-border/80 rounded-xl space-y-4 shadow-sm">
                        {/* Month Selector */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1 hover:bg-white/5 rounded-lg border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            disabled={year === new Date().getFullYear() && month === new Date().getMonth()}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] font-black uppercase tracking-wider text-white font-mono">
                            {monthNames[month]} {year}
                          </span>
                          <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1 hover:bg-white/5 rounded-lg border border-white/10 text-white"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Weekday Header */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-text-muted font-mono">
                          <div>Su</div>
                          <div>Mo</div>
                          <div>Tu</div>
                          <div>We</div>
                          <div>Th</div>
                          <div>Fr</div>
                          <div>Sa</div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {blankDays.map((_, index) => (
                            <div key={`blank-${index}`} className="h-8" />
                          ))}
                          {daysInMonth.map((day) => {
                            const past = isPast(day)
                            const selected = isSelected(day)
                            return (
                              <button
                                key={`day-${day}`}
                                type="button"
                                disabled={past}
                                onClick={() => handleSelectDay(day)}
                                className={`h-8 w-8 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center mx-auto ${
                                  selected 
                                    ? 'bg-primary text-white border border-primary/50 shadow-md shadow-primary/20 font-black' 
                                    : past 
                                      ? 'text-white/20 cursor-not-allowed' 
                                      : 'text-white hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Display Selected Date */}
                      {selectedDate && (
                        <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                          <Check className="w-3.5 h-3.5" /> Selected: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                    </div>

                    {/* TIME SLOTS COLUMN */}
                    <div className="md:col-span-5 space-y-3.5">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Available Slots
                      </label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            type="button"
                            key={slot}
                            disabled={!selectedDate}
                            onClick={() => setSelectedTime(slot)}
                            className={`h-11 bg-surface2/60 border rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                              selectedTime === slot 
                                ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5' 
                                : 'border-border/60 hover:border-white/20 text-white'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      {!selectedDate && (
                        <p className="text-[9px] text-text-muted italic leading-normal font-mono">
                          Please select a date on the calendar first to view available time slots.
                        </p>
                      )}
                    </div>

                  </div>

                  <div className="pt-4 flex justify-between border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 h-11 border border-white/10 hover:bg-white/5 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => setStep(3)}
                      className="px-6 h-11 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PATIENT INFORMATION */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Patient Details & Verification:</h3>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Full Name
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-surface2 border border-border h-11 px-4 text-xs font-semibold rounded-xl text-white focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Phone Number
                      </label>
                      <input 
                        type="tel"
                        required
                        placeholder="+1-212-555-0199"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full bg-surface2 border border-border h-11 px-4 text-xs font-mono font-semibold rounded-xl text-white focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email Address
                      </label>
                      <input 
                        type="email"
                        required
                        placeholder="john.doe@gmail.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full bg-surface2 border border-border h-11 px-4 text-xs font-mono font-semibold rounded-xl text-white focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" /> Insurance Provider
                      </label>
                      <select 
                        value={insuranceProvider}
                        onChange={(e) => setInsuranceProvider(e.target.value)}
                        className="w-full bg-surface2 border border-border h-11 px-4 text-xs font-semibold rounded-xl text-white focus:border-primary transition-all"
                      >
                        <option value="Uninsured">No Insurance (Self Pay)</option>
                        <option value="Delta Dental">Delta Dental</option>
                        <option value="Cigna Dental">Cigna Dental</option>
                        <option value="MetLife Dental">MetLife Dental</option>
                        <option value="Guardian Dental">Guardian Dental</option>
                      </select>
                    </div>

                    {insuranceProvider !== 'Uninsured' && (
                      <div className="space-y-1.5 animate-in slide-in-from-left duration-200">
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Policy Number
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. DD-88219"
                          value={insurancePolicy}
                          onChange={(e) => setInsurancePolicy(e.target.value)}
                          className="w-full bg-surface2 border border-border h-11 px-4 text-xs font-mono font-semibold rounded-xl text-white focus:border-primary transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 h-11 border border-white/10 hover:bg-white/5 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 h-11 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-primary/10"
                    >
                      {isSubmitting ? 'Securing Spot...' : 'Confirm Appointment'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          )}

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 bg-[#050507]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-text-muted font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <span>© 2026 Origem Dental Aesthetics. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span>HIPAA-COMPLIANT GATEWAY</span>
            <span>·</span>
            <span>VAPI CONTEXT ROUTING ACTIVE</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
