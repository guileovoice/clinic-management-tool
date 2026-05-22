'use client'

import { useState, useEffect } from 'react'
import { 
  Phone, 
  Search, 
  Play, 
  Pause, 
  Clock, 
  X,
  CalendarDays,
  DollarSign,
  Filter,
  RotateCcw,
  RotateCw,
  Zap,
  Download,
  FileText,
  ArrowUpRight
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useClinicStore, useFilteredCallLogs } from '@/lib/stores/clinicStore'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface ParsedMessage {
  speaker: 'AI' | 'USER'
  speakerName: string
  text: string
}

export default function CallLogsPage() {
  // Filter by Date Range - uses timestamp (mapped from created_at)
  const dateFilteredLogs = useFilteredCallLogs()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Selected Call Details modal
  const [activeCallDetails, setActiveCallDetails] = useState<any | null>(null)
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Calculations for the 4 cards:
  // 1. CALLS TODAY: count of calls today.
  const todayStr = new Date().toISOString().split('T')[0]
  const callsTodayCount = dateFilteredLogs.filter(log => {
    if (!log.timestamp) return false
    return log.timestamp.split('T')[0] === todayStr
  }).length

  // 2. TOTAL COST (USD): sum of cost of calls in selected date range.
  const totalCost = dateFilteredLogs.reduce((sum, log) => sum + (log.costUsd || 0), 0)

  // 3. SUCCESSFUL CALLS: status === 'completed' or 'answered' in the filtered logs.
  const successfulCallsCount = dateFilteredLogs.filter(log => log.status === 'completed').length

  // 4. AVG DURATION: average duration in filtered logs.
  const totalDurationSeconds = dateFilteredLogs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0)
  const avgDurationSeconds = dateFilteredLogs.length > 0 ? totalDurationSeconds / dateFilteredLogs.length : 0
  const avgMins = Math.floor(avgDurationSeconds / 60)
  const avgSecs = Math.floor(avgDurationSeconds % 60)
  const avgDurationDisplay = avgMins > 0 ? `${avgMins}m ${avgSecs}s` : `${avgSecs}s`

  // Search and status filter
  const filteredCalls = dateFilteredLogs.filter(log => {
    const matchesSearch = 
      log.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.phone.includes(searchQuery) ||
      (log.summary && log.summary.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = 
      statusFilter === 'all' || 
      log.status === statusFilter ||
      (statusFilter === 'completed' && log.status === 'completed') ||
      (statusFilter === 'missed' && log.status === 'missed')

    return matchesSearch && matchesStatus
  })

  // Audio playback simulated ticking
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && activeCallDetails) {
      const max = activeCallDetails.durationSeconds || (() => {
        if (!activeCallDetails.duration) return 100
        const parts = activeCallDetails.duration.match(/(\d+)m\s*(\d+)s/)
        if (parts) return parseInt(parts[1]) * 60 + parseInt(parts[2])
        return 100
      })()

      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= max) {
            setIsPlaying(false)
            return 0
          }
          return Math.min(prev + 1, max)
        })
      }, 1000 / playbackSpeed)
    }
    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed, activeCallDetails])

  const durationSec = activeCallDetails ? (activeCallDetails.durationSeconds || (() => {
    if (!activeCallDetails.duration) return 100
    const parts = activeCallDetails.duration.match(/(\d+)m\s*(\d+)s/)
    if (parts) return parseInt(parts[1]) * 60 + parseInt(parts[2])
    return 100
  })()) : 100

  const formatSecondsToMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const parseTranscript = (text?: string, name?: string): ParsedMessage[] => {
    if (!text) return []

    // Try parsing as JSON array
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          const role = item.role || item.speaker || ''
          const isAI = /arthur|ai|assistant|sophia|agent|bot/i.test(String(role))
          const content = item.message || item.text || item.content || item.transcript || ''
          return {
            speaker: (isAI ? 'AI' : 'USER') as 'AI' | 'USER',
            speakerName: isAI ? 'GUILEO AI' : (String(role).toLowerCase() === 'user' ? 'USER' : String(role).toUpperCase()),
            text: String(content).trim()
          }
        }).filter(m => m.text)
      }
    } catch {
      // Fall through to plain text parsing
    }

    return text.split('\n').map(line => {
      const colonIdx = line.indexOf(':')
      if (colonIdx !== -1) {
        const rawSpeaker = line.substring(0, colonIdx).trim()
        const content = line.substring(colonIdx + 1).trim()
        
        // Normalize speaker
        const isAI = /arthur|ai|assistant|sophia|system/i.test(rawSpeaker)
        return {
          speaker: (isAI ? 'AI' : 'USER') as 'AI' | 'USER',
          speakerName: isAI ? 'GUILEO AI' : (rawSpeaker.toLowerCase() === 'user' ? 'USER' : rawSpeaker.toUpperCase()),
          text: content
        }
      }
      return {
        speaker: 'USER' as 'AI' | 'USER',
        speakerName: 'USER',
        text: line.trim()
      }
    }).filter(m => m.text)
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Call & Message Logs" 
        subtitle="Review AI agent interactions and performance metrics from Vapi."
        actions={
          <div className="flex items-center gap-3">
            <DateRangeFilter />
          </div>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CALLS TODAY */}
        <Card className="p-5 bg-surface border-border flex items-center justify-between relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Calls Today</p>
            <h3 className="text-3xl font-black text-text-primary mt-2">{callsTodayCount}</h3>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 transition-transform group-hover:scale-110">
            <Phone className="w-5 h-5" />
          </div>
        </Card>
        
        {/* TOTAL COST (USD) */}
        <Card className="p-5 bg-surface border-border flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Cost (USD)</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-2">${totalCost.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 transition-transform group-hover:scale-110">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        {/* SUCCESSFUL CALLS */}
        <Card className="p-5 bg-surface border-border flex items-center justify-between relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300">
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Successful Calls</p>
            <h3 className="text-3xl font-black text-text-primary mt-2">{successfulCallsCount}</h3>
          </div>
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0 transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </Card>

        {/* AVG DURATION */}
        <Card className="p-5 bg-surface border-border flex items-center justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Avg Duration</p>
            <h3 className="text-3xl font-black text-text-primary mt-2">{avgDurationDisplay}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0 transition-transform group-hover:scale-110">
            <Clock className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter bar & table */}
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Search logs by customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface2 border-border h-10 w-full text-xs" 
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

          <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-surface2 text-text-muted hover:text-text-primary">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-border rounded-xl bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted/60 bg-surface2/30">
                <th className="p-4 pl-6">Customer</th>
                <th className="p-4">Time</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Summary</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCalls.length > 0 ? (
                filteredCalls.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-surface2/20 transition-colors group">
                      {/* Customer */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-extrabold uppercase shrink-0">
                            {log.patientName ? log.patientName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-text-primary leading-none">{log.patientName}</p>
                            <p className="text-[10px] text-text-muted font-mono mt-1.5">{log.phone}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Time */}
                      <td className="p-4 text-xs text-text-muted">
                        {log.timestamp ? format(new Date(log.timestamp), 'MMM d, h:mm a') : '—'}
                      </td>
                      
                      {/* Duration */}
                      <td className="p-4 text-xs font-mono text-text-muted">
                        {log.duration || '0s'}
                      </td>
                      
                      {/* Status */}
                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border tracking-wider shrink-0 inline-block ${
                          log.rawStatus?.toLowerCase() === 'assistant-ended-call' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                            : log.rawStatus?.toLowerCase() === 'customer-ended-call'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : log.status === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {log.rawStatus ? log.rawStatus.toUpperCase() : log.status.toUpperCase()}
                        </span>
                      </td>
                      
                      {/* Cost */}
                      <td className="p-4 text-xs font-mono text-text-primary">
                        ${log.costUsd.toFixed(2)}
                      </td>
                      
                      {/* Summary */}
                      <td className="p-4 text-xs text-text-muted max-w-xs truncate">
                        {log.summary ? (
                          <span className="font-semibold text-text-muted/80">{log.summary}</span>
                        ) : (
                          <span className="italic text-text-muted/40">No summary available</span>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={() => {
                            setActiveCallDetails(log)
                            // Initialize audio player states
                            setIsPlaying(false)
                            setCurrentTime(0)
                            setPlaybackSpeed(1)
                          }}
                          className="text-xs font-extrabold uppercase text-primary hover:text-primary-dark tracking-wider transition-colors cursor-pointer"
                        >
                          Details &gt;
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                    No telemetry call records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Dialog Modal */}
      <Dialog open={!!activeCallDetails} onOpenChange={(open) => { if (!open) setActiveCallDetails(null) }}>
        <DialogContent className="bg-[#12121A] border border-border/80 p-6 rounded-2xl shadow-2xl max-w-xl text-text-primary outline-none max-h-[90vh] overflow-y-auto">
          {activeCallDetails && (
            <div className="space-y-6">
              {/* Badges and Call ID */}
              <div className="flex items-center justify-between">
                <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
                  {activeCallDetails.type === 'webcall' || activeCallDetails.vapiAccount === 'clinic-calls' ? 'WEBCALL · VAPI' : 'INBOUND · VAPI'}
                </span>
                <span className="text-[10px] font-mono text-text-muted select-all">
                  ID: {activeCallDetails.id}
                </span>
              </div>

              {/* Title and Timestamp */}
              <div>
                <h3 className="text-2xl font-black text-text-primary tracking-wider uppercase">
                  Call Analysis
                </h3>
                <p className="text-xs text-text-muted font-semibold mt-1">
                  {activeCallDetails.timestamp ? format(new Date(activeCallDetails.timestamp), 'MMMM d, yyyy · h:mm a') : '—'}
                </p>
              </div>

              {/* Metrics cards row (Duration, Cost) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="bg-surface2/40 border border-border/80 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Duration</span>
                  <span className="text-lg font-bold text-text-primary mt-1">{activeCallDetails.duration}</span>
                </div>

                {/* Cost */}
                <div className="bg-surface2/40 border border-border/80 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mb-2">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Cost</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1">${activeCallDetails.costUsd.toFixed(2)}</span>
                </div>
              </div>

              {/* AI Summary Card */}
              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> AI Summary
                </h5>
                <div className="p-4 bg-surface2/30 border border-border/80 rounded-xl">
                  <p className="text-xs font-semibold italic text-text-primary leading-relaxed">
                    "{activeCallDetails.summary || 'No summary available'}"
                  </p>
                </div>
              </div>

              {/* Interactive Audio Player */}
              <div className="p-4 bg-surface2/30 border border-border/80 rounded-xl space-y-4">
                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center gap-3">
                    {/* Skip Back 15s */}
                    <button 
                      onClick={() => setCurrentTime(prev => Math.max(0, prev - 15))}
                      className="p-2 text-text-muted hover:text-text-primary hover:bg-surface2 rounded-lg transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Play / Pause */}
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all active:scale-95 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>

                    {/* Skip Forward 15s */}
                    <button 
                      onClick={() => setCurrentTime(prev => Math.min(durationSec, prev + 15))}
                      className="p-2 text-text-muted hover:text-text-primary hover:bg-surface2 rounded-lg transition-all cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Speed Multiplier */}
                    <button 
                      onClick={() => {
                        setPlaybackSpeed(prev => {
                          if (prev === 1) return 1.5
                          if (prev === 1.5) return 2
                          return 1
                        })
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-surface border border-border rounded-lg text-[10px] font-black text-text-primary uppercase tracking-wider hover:bg-surface2 transition-all cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> {playbackSpeed}x
                    </button>
                  </div>

                  {/* Right Controls */}
                  <div>
                    <button 
                      onClick={() => {
                        toast.success("Downloading decrypted recording file...")
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-[10px] font-black text-text-primary uppercase tracking-wider hover:bg-surface2 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>

                {/* Timeline slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-text-muted min-w-[30px]">
                    {formatSecondsToMinutes(currentTime)}
                  </span>
                  <div className="flex-1 relative flex items-center">
                    <input 
                      type="range"
                      min={0}
                      max={durationSec}
                      value={currentTime}
                      onChange={(e) => setCurrentTime(Number(e.target.value))}
                      className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {formatSecondsToMinutes(durationSec)}
                  </span>
                </div>
              </div>

              {/* Speaker Transcript */}
              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Transcript
                </h5>
                <div className="max-h-[220px] overflow-y-auto bg-surface2/10 border border-border/60 rounded-xl p-4 space-y-4 pr-2">
                  {parseTranscript(activeCallDetails.transcript, activeCallDetails.patientName).map((msg, idx) => (
                    <div key={idx} className={`space-y-1 ${msg.speaker === 'AI' ? 'text-left' : 'text-right'}`}>
                      <span className="text-[8px] font-black uppercase text-text-muted tracking-wider block">
                        {msg.speakerName}
                      </span>
                      <div className={`inline-block p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        msg.speaker === 'AI' 
                          ? 'bg-primary/10 border border-primary/20 text-text-primary rounded-tl-none text-left' 
                          : 'bg-surface2 border border-border text-text-primary rounded-tr-none text-left'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {(!activeCallDetails.transcript || activeCallDetails.transcript.trim() === '') && (
                    <p className="text-xs text-text-muted italic text-center py-4">No transcript available for this call</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
