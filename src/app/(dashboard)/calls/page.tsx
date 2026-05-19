'use client'

import { useState } from 'react'
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Search, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Sparkles,
  Volume2,
  X,
  User,
  Activity,
  Mic,
  CalendarDays
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface SimulatedMessage {
  speaker: 'AI' | 'Patient' | 'System'
  text: string
  time: string
}

export default function CallLogsPage() {
  const { callLogs, patients, addCallLog, addAppointment, updateCallLogAction } = useClinicStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [alertFilter, setAlertFilter] = useState('all')

  // Dialer & Call Simulator State
  const [isDialerOpen, setIsDialerOpen] = useState(false)
  const [targetPatientId, setTargetPatientId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  
  const [isCallActive, setIsCallActive] = useState(false)
  const [callPhase, setCallPhase] = useState<'dialing' | 'connected' | 'completed'>('dialing')
  const [simMessages, setSimMessages] = useState<SimulatedMessage[]>([])
  const [activeSpeech, setActiveSpeech] = useState<string>('')
  
  // Audio Player State
  const [playingCallId, setPlayingCallId] = useState<string | null>(null)
  const [activeCallDetails, setActiveCallDetails] = useState<any | null>(null)

  // Filters
  const filteredCalls = callLogs.filter(log => {
    const matchesSearch = 
      log.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.phone.includes(searchQuery) ||
      (log.summary && log.summary.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = 
      statusFilter === 'all' || 
      log.status === statusFilter

    const matchesAlert = 
      alertFilter === 'all' || 
      (alertFilter === 'action' && log.actionRequired) || 
      (alertFilter === 'resolved' && !log.actionRequired)

    return matchesSearch && matchesStatus && matchesAlert
  })

  // Audio Playback simulation
  const togglePlayAudio = (callId: string) => {
    if (playingCallId === callId) {
      setPlayingCallId(null)
      toast.success("Audio playback paused.")
    } else {
      setPlayingCallId(callId)
      toast.success("Playing call audio recording (AES-256 decrypted stream)...")
      setTimeout(() => {
        setPlayingCallId(null)
      }, 5000) // Auto end after 5 seconds simulation
    }
  }

  // Resolve Alert action
  const handleResolveAlert = async (id: string) => {
    await updateCallLogAction(id, false)
    toast.success("Call action-item marked as resolved!")
  }

  // Start Call Simulation
  const handleStartCallSimulation = () => {
    let name = customName
    let phone = customPhone
    let patientId = targetPatientId

    if (patientId) {
      const pat = patients.find(p => p.id === patientId)
      if (pat) {
        name = pat.name
        phone = pat.phone
      }
    }

    if (!name || !phone) {
      toast.error("Please select a patient or fill in phone details.")
      return
    }

    setIsCallActive(true)
    setCallPhase('dialing')
    setSimMessages([{ speaker: 'System', text: `Initiating secure HIPAA-secured call connection to ${phone}...`, time: '00:00' }])

    // Phased script execution
    const script: SimulatedMessage[] = [
      { speaker: 'AI', text: `Hello ${name}! This is Dr. Arthur from Origem Dental Clinic. I see you are due for a Teeth Whitening touch-up. Would you like me to schedule a visit?`, time: '00:04' },
      { speaker: 'Patient', text: 'Oh, hi Arthur! Yes, absolutely, I actually wanted to schedule that. Do you have any openings next week?', time: '00:08' },
      { speaker: 'AI', text: 'Wonderful! I have a slot on Tuesday, May 19th at 2:00 PM, or Wednesday at 11:00 AM. Do either of those work?', time: '00:12' },
      { speaker: 'Patient', text: 'Let\'s go with Tuesday, May 19th at 2:00 PM. That works great.', time: '00:16' },
      { speaker: 'AI', text: 'Fantastic! I have booked your teeth whitening for Tuesday, May 19th at 2:00 PM with Dr. Mendes. Your Delta Dental benefits have been verified for this procedure. A text confirmation is on its way.', time: '00:21' },
      { speaker: 'Patient', text: 'Wow, that was super easy. Thank you, Arthur!', time: '00:25' },
      { speaker: 'AI', text: 'My pleasure, Maria! Have a beautiful day, goodbye!', time: '00:28' },
      { speaker: 'System', text: 'Call finished by patient. Connection closed safely.', time: '00:30' }
    ]

    // 1. Dialing Phase (2.5s)
    setTimeout(() => {
      setCallPhase('connected')
      setSimMessages(prev => [...prev, { speaker: 'System', text: 'Call answered. Connected to Guileo Inbound Voice Node.', time: '00:02' }])

      // 2. Play out script bubbles sequentially
      script.forEach((item, index) => {
        setTimeout(() => {
          setSimMessages(prev => [...prev, item])
          if (item.speaker === 'AI') {
            setActiveSpeech(item.text)
          } else {
            setActiveSpeech('')
          }

          // Trigger state inserts on last System message
          if (index === script.length - 1) {
            setCallPhase('completed')
            setActiveSpeech('')
            
            // Add appointment dynamically to calendar
            addAppointment({
              tenantId: 'clinic-tenant-395b50b9-9504',
              patientId: patientId || 'pat-custom',
              patientName: name,
              patientPhone: phone,
              date: '2026-05-19',
              time: '14:00',
              duration: 45,
              status: 'CONFIRMED',
              type: 'PROCEDURE',
              providerName: 'Dr. Arthur Mendes',
              totalAmount: 220.00,
              insuranceVerified: true,
              notes: 'Teeth whitening scheduled via automated outbound call campaign.'
            })

            // Add call log dynamically to telephony
            addCallLog({
              tenantId: 'clinic-tenant-395b50b9-9504',
              patientName: name,
              phone: phone,
              duration: '30s',
              status: 'completed',
              recordingUrl: 'https://vapi-recordings.s3.amazonaws.com/origem/simulated-call.mp3',
              transcript: `Arthur: Hello ${name}! This is Dr. Arthur from Origem Dental. I see you are due for a Teeth Whitening touch-up.\nPatient: Oh, yes, absolutely!\nArthur: I have booked you for Tuesday, May 19th at 2:00 PM with Dr. Mendes. Your insurance has been verified.`,
              summary: 'Outbound AI callback completed. Patient scheduled a Teeth Whitening procedure for May 19th, 2 PM.',
              actionRequired: false
            })

            toast.success("Outbound call finished! Appointment booked & call log archived.")
          }
        }, (index + 1) * 3000)
      })

    }, 2500)
  }

  // Close Call Simulator
  const handleCloseCallSimulator = () => {
    setIsCallActive(false)
    setIsDialerOpen(false)
    setTargetPatientId('')
    setCustomName('')
    setCustomPhone('')
    setSimMessages([])
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Call Logs" 
        subtitle="Auditable transcripts, secure AES recording streams, active clinician alerts, and outbound AI campaign agents."
      />

      {/* Real-time Telephony Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Logs</p>
            <h3 className="text-xl font-bold text-text-primary">{callLogs.length}</h3>
          </div>
        </Card>
        
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
            <PhoneIncoming className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Inbound Resolved</p>
            <h3 className="text-xl font-bold text-text-primary">
              {callLogs.filter(l => l.status === 'completed' || l.status === 'answered').length}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500 shrink-0">
            <PhoneMissed className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Missed / Dropped</p>
            <h3 className="text-xl font-bold text-text-primary">
              {callLogs.filter(l => l.status === 'missed').length}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Action Alerts</p>
            <h3 className="text-xl font-bold text-text-primary">
              {callLogs.filter(l => l.actionRequired).length}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">AI Call Minutes</p>
            <h3 className="text-xl font-bold text-text-primary">1,482</h3>
          </div>
        </Card>
      </div>

      {/* Grid: Search / Filter & Call Log Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Call Grid */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input 
                  placeholder="Search logs by patient or phone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-surface2 border-border h-10 w-full" 
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border">
                  <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Status</SelectItem>
                  <SelectItem value="completed" className="text-xs font-semibold text-text-primary">Completed</SelectItem>
                  <SelectItem value="missed" className="text-xs font-semibold text-text-primary">Missed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={alertFilter} onValueChange={setAlertFilter}>
                <SelectTrigger className="w-[150px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                  <SelectValue placeholder="All Alerts" />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border">
                  <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Alerts</SelectItem>
                  <SelectItem value="action" className="text-xs font-semibold text-text-primary">Action Required</SelectItem>
                  <SelectItem value="resolved" className="text-xs font-semibold text-text-primary">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {filteredCalls.length > 0 ? (
              filteredCalls.map(log => {
                const isSelected = activeCallDetails?.id === log.id
                return (
                  <Card 
                    key={log.id} 
                    onClick={() => setActiveCallDetails(log)}
                    className={`p-4 bg-surface border-border hover:border-primary/40 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      isSelected ? 'border-primary shadow-sm bg-surface2/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl border ${
                        log.status === 'completed' 
                          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                          : 'bg-danger/5 border-danger/10 text-danger'
                      }`}>
                        {log.status === 'completed' ? <PhoneIncoming className="w-4 h-4" /> : <PhoneMissed className="w-4 h-4" />}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-text-primary">{log.patientName}</p>
                          <span className="text-[9px] text-text-muted font-mono">{log.phone}</span>
                          
                          {log.actionRequired && (
                            <Badge className="bg-danger/10 text-danger border-none text-[8px] font-black uppercase px-2 py-0.5 animate-pulse">
                              Action Alert
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-muted font-medium line-clamp-1">{log.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <p className="text-[10px] text-text-muted font-mono">{format(new Date(log.timestamp), 'MMM d, hh:mm a')}</p>
                        <p className="text-[9px] text-text-muted font-mono font-bold mt-0.5">Duration: {log.duration}</p>
                      </div>

                      {log.recordingUrl && (
                        <Button 
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePlayAudio(log.id)
                          }}
                          className={`h-8 w-8 rounded-full border border-border bg-surface hover:bg-surface2 ${
                            playingCallId === log.id ? 'text-primary border-primary animate-pulse' : 'text-text-muted'
                          }`}
                        >
                          {playingCallId === log.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })
            ) : (
              <div className="py-12 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                No telemetry call records found.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Active Transcript / Alert resolution panel */}
        <div className="xl:col-span-4 space-y-6">
          {activeCallDetails ? (
            <Card className="p-6 bg-surface border-border flex flex-col h-[580px] justify-between animate-in slide-in-from-right duration-300">
              
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Header info */}
                <div className="border-b border-border pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">{activeCallDetails.patientName}</h4>
                    <p className="text-[9px] font-mono text-text-muted">{activeCallDetails.phone}</p>
                  </div>
                  <X 
                    className="w-4 h-4 text-text-muted hover:text-text-primary cursor-pointer" 
                    onClick={() => setActiveCallDetails(null)}
                  />
                </div>

                {/* AI Summary Card */}
                <div className="p-3 bg-surface2 rounded-xl border border-border space-y-1">
                  <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Call Summary
                  </h5>
                  <p className="text-xs text-text-primary leading-relaxed font-semibold">
                    {activeCallDetails.summary}
                  </p>
                </div>

                {/* Speaker Transcript */}
                <div className="space-y-3">
                  <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest">Call Transcript</h5>
                  
                  {activeCallDetails.transcript ? (
                    <div className="space-y-3 font-sans text-xs bg-background/50 border border-border p-3.5 rounded-xl max-h-[260px] overflow-y-auto">
                      {activeCallDetails.transcript.split('\n').map((line: string, i: number) => {
                        const isAI = line.startsWith('Arthur:')
                        const text = line.replace(/^(Arthur:|Maria:|Patient:)/, '').trim()
                        const speaker = isAI ? 'Dr. Arthur (AI)' : activeCallDetails.patientName
                        
                        return (
                          <div key={i} className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                            <span className="text-[9px] font-black uppercase text-text-muted mb-0.5 tracking-wider">{speaker}</span>
                            <span className={`px-3 py-2 rounded-xl max-w-[85%] leading-relaxed ${
                              isAI 
                                ? 'bg-primary/10 text-text-primary rounded-tl-none border border-primary/20' 
                                : 'bg-surface2 text-text-primary rounded-tr-none border border-border'
                            }`}>
                              {text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-text-muted text-[10px] uppercase font-bold italic">
                      No voice agent transcript available.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-border pt-4 mt-2 space-y-3">
                {activeCallDetails.recordingUrl && (
                  <Button 
                    onClick={() => togglePlayAudio(activeCallDetails.id)}
                    className="w-full bg-surface2 hover:bg-surface border border-border text-text-primary gap-2 h-10 font-bold text-xs uppercase tracking-wider"
                  >
                    {playingCallId === activeCallDetails.id ? (
                      <>
                        <Pause className="w-4 h-4 text-primary" /> Pause Call Stream
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-primary" /> Play Voice Recording
                      </>
                    )}
                  </Button>
                )}

                {activeCallDetails.actionRequired ? (
                  <Button 
                    onClick={() => handleResolveAlert(activeCallDetails.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-10 font-bold text-xs uppercase tracking-wider"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve Inbound Alert
                  </Button>
                ) : (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">No Pending Actions</span>
                  </div>
                )}
              </div>

            </Card>
          ) : (
            <Card className="p-6 bg-surface border-border flex flex-col justify-center items-center py-24 text-center">
              <Phone className="w-10 h-10 text-primary/40 animate-pulse mb-4" />
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">No Call Log Selected</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-[200px]">
                Click an inbound or outbound call item to audit speaker transcripts, playback secure audio streams, and resolve alerts.
              </p>
            </Card>
          )}
        </div>

      </div>

      {/* Outbound AI Dialer Modal */}
      <Dialog open={isDialerOpen} onOpenChange={setIsDialerOpen}>
        <DialogContent className="bg-surface border-border p-6 rounded-2xl shadow-xl max-w-lg overflow-hidden">
          
          {!isCallActive ? (
            // Form Selection
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-primary" /> Place Outbound AI Call Campaign
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-1">
                  Connect the HIPAA-secured Guileo voice bot to a patient to trigger recall campaigns or checkup confirmations.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Select Registered Patient</label>
                  <Select value={targetPatientId} onValueChange={setTargetPatientId}>
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

                <div className="flex items-center gap-4">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest shrink-0">Or Custom Dial</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Full Name</label>
                    <Input 
                      placeholder="Jane Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Phone Number</label>
                    <Input 
                      placeholder="+1-555-0000"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="bg-surface2 border-border h-10 text-xs font-mono font-semibold text-text-primary"
                    />
                  </div>
                </div>

                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Outbound Call Objective
                  </p>
                  <p className="text-[11px] text-text-primary leading-relaxed font-semibold">
                    Trigger the winback flow. The AI bot will verify insurance, identify Teeth Whitening recall need, and schedule a 2 PM appointment on Tuesday, May 19th dynamically.
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialerOpen(false)}
                  className="border-border bg-surface2 text-text-primary font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleStartCallSimulation}
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider"
                >
                  Initiate AI Outbound
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Dialing & calling animation screen
            <div className="py-6 flex flex-col items-center justify-between min-h-[420px]">
              
              {/* Dial status */}
              <div className="text-center space-y-2">
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest py-1 px-3">
                  HIPAA Secured Connection
                </Badge>
                <h3 className="text-base font-black text-text-primary uppercase tracking-wider mt-2">
                  {callPhase === 'dialing' ? 'Dialing Patient Node...' : callPhase === 'connected' ? 'Call Session Active' : 'Call Log Completed'}
                </h3>
              </div>

              {/* Calling animated graphic */}
              <div className="relative my-8 flex items-center justify-center">
                {callPhase === 'dialing' ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-primary/5 absolute animate-ping duration-1000" />
                    <div className="w-20 h-20 rounded-full bg-primary/10 absolute animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-lg shadow-primary/30">
                      <Phone className="w-6 h-6 animate-bounce" />
                    </div>
                  </>
                ) : callPhase === 'connected' ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-emerald-500/5 absolute animate-ping duration-700" />
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 absolute animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white z-10 shadow-lg shadow-emerald-500/30">
                      <Mic className="w-6 h-6 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-white z-10">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Live transcript visual box */}
              <div className="w-full bg-background/50 border border-border rounded-xl p-4 max-h-[160px] overflow-y-auto flex flex-col gap-2 font-mono text-[10px]">
                {simMessages.map((msg, i) => {
                  let color = 'text-text-muted'
                  if (msg.speaker === 'AI') color = 'text-primary font-bold'
                  if (msg.speaker === 'Patient') color = 'text-emerald-400 font-bold'
                  
                  return (
                    <div key={i} className="flex gap-2">
                      <span className="text-[8px] text-text-muted shrink-0">[{msg.time}]</span>
                      <p className={color}>
                        <span className="font-extrabold uppercase shrink-0">{msg.speaker}:</span> {msg.text}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* AI speaking active marquee hint */}
              {activeSpeech && (
                <div className="w-full text-center mt-2">
                  <p className="text-[10px] text-primary italic leading-none animate-pulse">
                    🎤 Dr. Arthur (AI Voice) is speaking...
                  </p>
                </div>
              )}

              {/* End session buttons */}
              <div className="w-full pt-6 flex justify-center">
                <Button 
                  onClick={handleCloseCallSimulator}
                  className="bg-danger hover:bg-danger-dark text-white gap-2 font-bold text-xs uppercase tracking-wider px-6 h-10"
                >
                  <X className="w-4 h-4" /> Close Session
                </Button>
              </div>

            </div>
          )}

        </DialogContent>
      </Dialog>

    </div>
  )
}
