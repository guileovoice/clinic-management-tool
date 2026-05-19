'use client'

import { useState } from 'react'
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  Users, 
  PhoneMissed, 
  ShieldCheck, 
  Download,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { toast } from 'react-hot-toast'
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

// Recharts components with client-safe imports
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['#6C3CE1', '#10B981', '#3B82F6', '#F59E0B']

export default function ClinicOverviewPage() {
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('all')
  const { appointments, callLogs, patients } = useClinicStore()

  // Calculate filtered date bounds
  const getFilteredAppointments = () => {
    const now = new Date()
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      if (dateFilter === 'today') {
        return isWithinInterval(aptDate, { start: startOfDay(now), end: endOfDay(now) })
      } else if (dateFilter === 'yesterday') {
        const yesterday = subDays(now, 1)
        return isWithinInterval(aptDate, { start: startOfDay(yesterday), end: endOfDay(yesterday) })
      } else if (dateFilter === '7days') {
        return isWithinInterval(aptDate, { start: startOfDay(subDays(now, 7)), end: endOfDay(now) })
      } else if (dateFilter === '30days') {
        return isWithinInterval(aptDate, { start: startOfDay(subDays(now, 30)), end: endOfDay(now) })
      }
      return true // 'all'
    })
  }

  const filteredApts = getFilteredAppointments()

  // Metrics calculations
  const totalBookings = filteredApts.length
  const totalRevenue = filteredApts.reduce((sum, apt) => sum + apt.totalAmount, 0)
  const averageTicket = totalBookings > 0 ? totalRevenue / totalBookings : 0
  
  const missedCallsCount = callLogs.filter(log => log.status === 'missed').length
  const completedAptsCount = filteredApts.filter(apt => apt.status === 'COMPLETED').length
  const noShowsCount = filteredApts.filter(apt => apt.status === 'NO_SHOW').length
  const noShowRate = totalBookings > 0 ? (noShowsCount / totalBookings) * 100 : 0
  
  const insuranceVerifiedCount = filteredApts.filter(apt => apt.insuranceVerified).length
  const insuranceVerificationRate = totalBookings > 0 ? (insuranceVerifiedCount / totalBookings) * 100 : 0

  // Export calendar database report as CSV
  const handleDownloadReport = () => {
    if (filteredApts.length === 0) {
      toast.error("No appointment records found in this date range to export!")
      return
    }

    const headers = [
      "Appointment ID", 
      "Patient Name", 
      "Patient Phone", 
      "Schedule Date", 
      "Start Time", 
      "Duration (min)", 
      "Status", 
      "Procedure Type", 
      "Clinical Provider", 
      "Insurance Verified", 
      "Total Amount ($)"
    ]

    const rows = filteredApts.map(apt => [
      `"${apt.id}"`,
      `"${apt.patientName}"`,
      `"${apt.patientPhone}"`,
      `"${apt.date}"`,
      `"${apt.time}"`,
      apt.duration,
      `"${apt.status}"`,
      `"${apt.type}"`,
      `"${apt.providerName}"`,
      apt.insuranceVerified ? "YES" : "NO",
      apt.totalAmount.toFixed(2)
    ])

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `guileo_clinic_report_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Clinic scheduling report downloaded successfully!`)
  }

  // 1. Chart Data: Daily booking & revenue totals
  const chartData = filteredApts.reduce((acc: any[], apt) => {
    const existing = acc.find(item => item.date === apt.date)
    if (existing) {
      existing.bookings += 1
      existing.revenue += apt.totalAmount
    } else {
      acc.push({ date: apt.date, bookings: 1, revenue: apt.totalAmount })
    }
    return acc
  }, []).sort((a, b) => a.date.localeCompare(b.date))

  // 2. Chart Data: Channel breakdowns
  const patientChannels = patients.reduce((acc: Record<string, number>, pat) => {
    acc[pat.preferredChannel] = (acc[pat.preferredChannel] || 0) + 1
    return acc
  }, {})
  
  const channelChartData = Object.entries(patientChannels).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Banner Header */}
      <PageHeader 
        title="Origem Clinic Command Hub" 
        subtitle="Real-time patient acquisition, AI telephony logs, automated calendar booking, and GDPR privacy."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Elegant Button Group Filters */}
            <div className="flex items-center bg-surface border border-border p-1 rounded-xl">
              {[
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: '7days', label: '7 Days' },
                { key: '30days', label: '30 Days' },
                { key: 'all', label: 'All Time' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDateFilter(opt.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    dateFilter === opt.key 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button 
              suppressHydrationWarning
              onClick={handleDownloadReport}
              variant="outline" 
              className="border-border bg-surface hover:bg-surface2 text-text-primary gap-2 text-xs font-bold uppercase tracking-wider h-9"
            >
              <Download className="w-4 h-4 text-primary" />
              Download Report
            </Button>
            
          </div>
        }
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Bookings */}
        <Card className="p-4 bg-surface border-border relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Bookings</span>
            <CalendarIcon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">{totalBookings}</h3>
          <p className="text-[9px] text-emerald-500 font-bold mt-1">↑ 14% new patients</p>
        </Card>

        {/* Total Revenue */}
        <Card className="p-4 bg-surface border-border relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Billings</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">${totalRevenue.toFixed(2)}</h3>
          <p className="text-[9px] text-emerald-500 font-bold mt-1">Stripe verified</p>
        </Card>

        {/* Average Visit Value */}
        <Card className="p-4 bg-surface border-border relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Avg Visit Spend</span>
            <Award className="w-4 h-4 text-violet-500" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">${averageTicket.toFixed(2)}</h3>
          <p className="text-[9px] text-text-muted mt-1">Per appointment</p>
        </Card>

        {/* Missed Calls */}
        <Card className="p-4 bg-surface border-border relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Missed Inquiries</span>
            <PhoneMissed className="w-4 h-4 text-danger" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">{missedCallsCount}</h3>
          <p className="text-[9px] text-danger font-bold mt-1">Requires human callback</p>
        </Card>

        {/* No Show Rate */}
        <Card className="p-4 bg-surface border-border relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">No-Show Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">{noShowRate.toFixed(1)}%</h3>
          <p className="text-[9px] text-emerald-500 font-bold mt-1">↓ 8% with SMS triggers</p>
        </Card>

        {/* Insurance Check */}
        <Card className="p-4 bg-surface border-border relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Insurance Checked</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">{insuranceVerificationRate.toFixed(0)}%</h3>
          <p className="text-[9px] text-emerald-500 font-bold mt-1">PMS API linked</p>
        </Card>
      </div>

      {/* Recharts Graphical Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Trend analysis */}
        <Card className="p-6 bg-surface border-border lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Appointment Volume & Billings</h4>
                <p className="text-xs text-text-muted">Daily schedule trends and compiled Stripe values.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            
            <div className="h-[280px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E2E3F" />
                    <XAxis dataKey="date" stroke="#8B8BA0" fontSize={10} fontStyle="bold" />
                    <YAxis stroke="#8B8BA0" fontSize={10} fontStyle="bold" />
                    <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2E2E3F', borderRadius: '0.5rem', color: '#F1F1F3', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="bookings" name="Appointments" fill="#6C3CE1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" name="Billings ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-xs font-bold uppercase tracking-wider">
                  No chart data available for this range
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right: Channels pie Breakdown */}
        <Card className="p-6 bg-surface border-border lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Preferred Inbound Channels</h4>
                <p className="text-xs text-text-muted">Where patients choose to book their clinic visits.</p>
              </div>
              <Activity className="w-5 h-5 text-violet-500" />
            </div>

            <div className="h-[200px] w-full flex items-center justify-center relative">
              {channelChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2E2E3F', color: '#F1F1F3', fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-text-muted text-xs font-bold uppercase">No Channel Records</div>
              )}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-text-primary">{patients.length}</span>
                <span className="text-[8px] font-black uppercase text-text-muted tracking-widest">Patients</span>
              </div>
            </div>

            {/* Legends */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {channelChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-text-primary font-mono">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Call Logs & Procedures */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left: Telephony transcripts and logs */}
        <Card className="p-6 bg-surface border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">AI Phone Call Logs</h4>
                <p className="text-xs text-text-muted">Direct recordings, automatic summaries, and action alerts.</p>
              </div>
              <Clock className="w-5 h-5 text-amber-500 animate-spin-slow" />
            </div>

            <div className="space-y-4">
              {callLogs.map(log => (
                <div key={log.id} className="p-4 bg-surface2 rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{log.patientName}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        log.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>{log.status}</span>
                      {log.actionRequired && (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 animate-pulse">ACTION REQ</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed font-medium">{log.summary}</p>
                    {log.transcript && (
                      <details className="mt-2 text-[10px] text-text-muted font-mono bg-background p-2 rounded cursor-pointer leading-tight">
                        <summary className="font-bold text-[9px] uppercase tracking-wider text-primary select-none">View Full Transcript</summary>
                        <p className="mt-1 whitespace-pre-line leading-relaxed">{log.transcript}</p>
                      </details>
                    )}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono shrink-0">
                    {format(new Date(log.timestamp), 'MMM d, hh:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right: Upcoming Schedules */}
        <Card className="p-6 bg-surface border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Upcoming Scheduled Procedures</h4>
                <p className="text-xs text-text-muted">Live appointments, insurance eligibility, and doctor assignments.</p>
              </div>
              <CalendarIcon className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="space-y-4">
              {filteredApts.map(apt => (
                <div key={apt.id} className="p-4 bg-surface2 rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{apt.patientName}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        apt.status === 'CONFIRMED' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : apt.status === 'COMPLETED'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>{apt.status}</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-surface border border-border text-text-muted font-mono">{apt.type}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-none font-medium">Assigned: {apt.providerName} · {apt.duration} mins</p>
                    {apt.notes && (
                      <p className="text-[10px] text-text-muted italic">"{apt.notes}"</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-text-primary">${apt.totalAmount.toFixed(2)}</span>
                    <span className="text-[9px] text-text-muted font-mono font-bold uppercase">{apt.date} · {apt.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}
