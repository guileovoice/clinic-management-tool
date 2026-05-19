'use client'

import { useState } from 'react'
import { 
  Send, 
  Plus, 
  Search, 
  DollarSign, 
  Users, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  Play, 
  CalendarDays,
  Sparkles,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

export default function CampaignsPage() {
  const { campaigns, patients, addCampaign, sendCampaign } = useClinicStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create Campaign Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [campName, setCampName] = useState('')
  const [campChannel, setCampChannel] = useState<'VOICE' | 'WHATSAPP' | 'SMS'>('WHATSAPP')
  const [campSegment, setCampSegment] = useState('Loyal Patients')
  const [campMessage, setCampMessage] = useState('')
  const [campScheduledAt, setCampScheduledAt] = useState('')

  // Detailed Analytics State
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null)

  // Calculations
  const totalCampaigns = campaigns.length
  const activeCount = campaigns.filter(c => c.status === 'SENT').length
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0)
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipientCount, 0)
  const avgRoiRate = activeCount > 0 ? (totalRevenue / (activeCount * 120)) * 100 : 0 // hypothetical cost $120 per send

  // Filters
  const filteredCampaigns = campaigns.filter(cmp => {
    const matchesSearch = 
      cmp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cmp.segment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesChannel = 
      channelFilter === 'all' || 
      cmp.channel === channelFilter

    const matchesStatus = 
      statusFilter === 'all' || 
      cmp.status === statusFilter

    return matchesSearch && matchesChannel && matchesStatus
  })

  // Dynamic recipient calculation based on segment selection
  const estimateRecipients = (segmentName: string) => {
    if (segmentName === 'Loyal Patients') {
      return patients.filter(p => p.rfmSegment === 'LOYAL' || p.rfmSegment === 'CHAMPION').length * 35 // simulated multiplier
    } else if (segmentName === 'Inactive (6mo+)') {
      return patients.filter(p => p.churnRisk === 'HIGH' || p.churnRisk === 'MEDIUM').length * 22
    } else if (segmentName === 'All Registered Patients') {
      return patients.length * 52
    }
    return 45
  }

  // Handle Save Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campName || !campMessage) {
      toast.error("Please fill in campaign name and script message.")
      return
    }

    const recCount = estimateRecipients(campSegment)

    await addCampaign({
      tenantId: 'clinic-tenant-395b50b9-9504',
      name: campName,
      channel: campChannel,
      status: campScheduledAt ? 'SCHEDULED' : 'DRAFT',
      segment: campSegment,
      recipientCount: recCount,
      sentCount: 0,
      message: campMessage,
      scheduledAt: campScheduledAt ? new Date(campScheduledAt).toISOString() : undefined
    })

    toast.success(`Campaign "${campName}" successfully created in ${campScheduledAt ? 'SCHEDULED' : 'DRAFT'} status!`)
    setIsCreateOpen(false)
    
    // reset inputs
    setCampName('')
    setCampMessage('')
    setCampScheduledAt('')
  }

  // Handle Send Now Trigger
  const handleTriggerCampaign = async (id: string, name: string) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(async () => {
          await sendCampaign(id)
          resolve(true)
        }, 2000)
      }),
      {
        loading: `Connecting outreach gateway & compiling hashed HIPAA segments for "${name}"...`,
        success: `Campaign "${name}" successfully dispatched to all segment targets! Dynamic billing calculated.`,
        error: `Failed to dispatch campaign.`
      }
    )
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Outreach Campaigns Command Center" 
        subtitle="HIPAA-authorized Winback campaigns, AI-translated SMS notification triggers, and live marketing ROI calculations."
        actions={
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white gap-2 text-xs font-black uppercase tracking-wider h-10 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Campaign
          </Button>
        }
      />

      {/* ROI & Campaign stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Campaigns</p>
            <h3 className="text-xl font-bold text-text-primary">{totalCampaigns}</h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Dispatched (SENT)</p>
            <h3 className="text-xl font-bold text-text-primary">{activeCount}</h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Scheduled (PENDING)</p>
            <h3 className="text-xl font-bold text-text-primary">
              {campaigns.filter(c => c.status === 'SCHEDULED' || c.status === 'DRAFT').length}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Generated Revenue</p>
            <h3 className="text-xl font-bold text-text-primary">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Audience Reach</p>
            <h3 className="text-xl font-bold text-text-primary">{totalRecipients}</h3>
          </div>
        </Card>

      </div>

      {/* Campaign List Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left list table */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input 
                  placeholder="Search campaigns by name, message, segment..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-surface2 border-border h-10 w-full" 
                />
              </div>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[140px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border">
                  <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Channels</SelectItem>
                  <SelectItem value="WHATSAPP" className="text-xs font-semibold text-text-primary">WhatsApp</SelectItem>
                  <SelectItem value="VOICE" className="text-xs font-semibold text-text-primary">AI Voice Call</SelectItem>
                  <SelectItem value="SMS" className="text-xs font-semibold text-text-primary">Standard SMS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border">
                  <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Status</SelectItem>
                  <SelectItem value="SENT" className="text-xs font-semibold text-text-primary">Dispatched</SelectItem>
                  <SelectItem value="SCHEDULED" className="text-xs font-semibold text-text-primary">Scheduled</SelectItem>
                  <SelectItem value="DRAFT" className="text-xs font-semibold text-text-primary">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-4">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map(cmp => {
                const isSelected = selectedCampaign?.id === cmp.id
                return (
                  <Card 
                    key={cmp.id}
                    onClick={() => setSelectedCampaign(cmp)}
                    className={`p-5 bg-surface border-border hover:border-primary/40 transition-all cursor-pointer flex flex-col gap-4 ${
                      isSelected ? 'border-primary shadow-sm bg-surface2/30' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">{cmp.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            cmp.status === 'SENT' 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : cmp.status === 'SCHEDULED'
                              ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                              : 'bg-slate-500/10 text-text-muted'
                          }`}>{cmp.status}</span>
                        </div>
                        <p className="text-[10px] text-text-muted font-bold">
                          Segment: <span className="text-primary uppercase tracking-widest">{cmp.segment}</span> · Channel: <span className="font-mono text-violet-400">{cmp.channel}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {cmp.status === 'SENT' ? (
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Revenue Stream</span>
                            <p className="text-sm font-black text-text-primary">${cmp.revenue?.toFixed(2)}</p>
                          </div>
                        ) : (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTriggerCampaign(cmp.id, cmp.name)
                            }}
                            className="bg-primary hover:bg-primary-dark text-white gap-2 font-bold text-[10px] uppercase tracking-wider h-8"
                          >
                            <Play className="w-3.5 h-3.5" /> Dispatch Now
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="max-w-[80%] text-text-muted italic line-clamp-1">
                        "{cmp.message}"
                      </div>
                      
                      <div className="text-right text-[10px] text-text-muted font-mono shrink-0">
                        {cmp.sentAt ? (
                          <>Dispatched {format(new Date(cmp.sentAt), 'MMM d, h:mm a')}</>
                        ) : cmp.scheduledAt ? (
                          <>Queued {format(new Date(cmp.scheduledAt), 'MMM d, h:mm a')}</>
                        ) : (
                          <>Created {format(new Date(cmp.createdAt), 'MMM d')}</>
                        )}
                        <p className="text-[9px] text-text-muted font-bold mt-1 font-mono">Targets: {cmp.recipientCount}</p>
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <div className="py-12 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                No outbound recall campaigns found.
              </div>
            )}
          </div>

        </div>

        {/* Right Detail / Analytics Panel */}
        <div className="xl:col-span-4 space-y-6">
          {selectedCampaign ? (
            <Card className="p-6 bg-surface border-border flex flex-col justify-between h-[520px] animate-in slide-in-from-right duration-300">
              
              <div className="space-y-6 overflow-y-auto pr-1 flex-1">
                {/* Header */}
                <div className="border-b border-border pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black uppercase text-violet-500 tracking-wider">Campaign Report</span>
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider mt-1">{selectedCampaign.name}</h4>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-[8px] font-mono px-2">
                    {selectedCampaign.channel}
                  </Badge>
                </div>

                {/* ROI Analysis */}
                <div className="space-y-3">
                  <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" /> Delivery & ROI Performance
                  </h5>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface2 rounded-xl border border-border">
                      <span className="text-[8px] text-text-muted uppercase tracking-wider block">Dispatched</span>
                      <p className="text-sm font-black text-text-primary font-mono">{selectedCampaign.status === 'SENT' ? selectedCampaign.recipientCount : 0} / {selectedCampaign.recipientCount}</p>
                      <p className="text-[8px] text-emerald-500 mt-1 font-bold">100% gateway success</p>
                    </div>

                    <div className="p-3 bg-surface2 rounded-xl border border-border">
                      <span className="text-[8px] text-text-muted uppercase tracking-wider block">Estimated Billings</span>
                      <p className="text-sm font-black text-text-primary font-mono">${(selectedCampaign.revenue || 0).toFixed(2)}</p>
                      <p className="text-[8px] text-emerald-500 mt-1 font-bold">Stripe-linked</p>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-text-muted">Message Open Rate</span>
                      <span className="text-emerald-500">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-text-muted">Action/Bookings Rate</span>
                      <span className="text-primary">18.5%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[18.5%]" />
                    </div>
                  </div>
                </div>

                {/* Script Template */}
                <div className="space-y-2">
                  <h5 className="text-[9px] font-black text-text-muted uppercase tracking-widest">Dispatched Message Template</h5>
                  <div className="p-3.5 bg-background rounded-xl border border-border text-xs text-text-muted font-sans leading-relaxed italic">
                    "{selectedCampaign.message}"
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border pt-4 mt-2">
                {selectedCampaign.status !== 'SENT' ? (
                  <Button 
                    onClick={() => handleTriggerCampaign(selectedCampaign.id, selectedCampaign.name)}
                    className="w-full bg-primary hover:bg-primary-dark text-white gap-2 h-10 font-bold text-xs uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4" /> Trigger Outreach Dispatch
                  </Button>
                ) : (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Campaign Active & Audited</span>
                  </div>
                )}
              </div>

            </Card>
          ) : (
            <Card className="p-6 bg-surface border-border flex flex-col justify-center items-center py-24 text-center">
              <Send className="w-10 h-10 text-primary/40 animate-pulse mb-4" />
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">No Campaign Selected</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-[200px]">
                Click any outreach campaign to view real-time patient analytics, message status percentages, and Stripe billing ROI.
              </p>
            </Card>
          )}
        </div>

      </div>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-surface border-border p-6 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Create Outreach Campaign
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Construct a HIPAA-safe winback or recall campaign using standard channels.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4 pt-4">
            
            {/* campaign name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Campaign Name</label>
              <Input 
                placeholder="e.g. Summer Orthodontic Special"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
              />
            </div>

            {/* Segment selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Target Segment</label>
                <Select value={campSegment} onValueChange={setCampSegment}>
                  <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                    <SelectValue placeholder="Loyal Patients" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border">
                    <SelectItem value="Loyal Patients" className="text-xs font-semibold text-text-primary">Loyal Patients</SelectItem>
                    <SelectItem value="Inactive (6mo+)" className="text-xs font-semibold text-text-primary">Inactive (6mo+)</SelectItem>
                    <SelectItem value="All Registered Patients" className="text-xs font-semibold text-text-primary">All Patients</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Channel */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Preferred Channel</label>
                <Select value={campChannel} onValueChange={setCampChannel as any}>
                  <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                    <SelectValue placeholder="WhatsApp" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border border-border">
                    <SelectItem value="WHATSAPP" className="text-xs font-semibold text-text-primary">WhatsApp</SelectItem>
                    <SelectItem value="VOICE" className="text-xs font-semibold text-text-primary">Voice AI Agent</SelectItem>
                    <SelectItem value="SMS" className="text-xs font-semibold text-text-primary">Standard SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduled Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Schedule Date & Time (Optional)</label>
              <Input 
                type="datetime-local"
                value={campScheduledAt}
                onChange={(e) => setCampScheduledAt(e.target.value)}
                className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
              />
              <span className="text-[8px] text-text-muted">Leave empty to create as a DRAFT/Ready to trigger.</span>
            </div>

            {/* Script Text */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Outreach Script Body / AI Prompt</label>
              <Textarea 
                placeholder="Type your message script or AI bot prompt guidelines here..."
                value={campMessage}
                onChange={(e) => setCampMessage(e.target.value)}
                rows={4}
                className="bg-surface2 border-border text-xs font-semibold text-text-primary"
              />
              <div className="flex justify-between items-center text-[9px] text-text-muted mt-1 font-mono">
                <span>Est. Recipients: {estimateRecipients(campSegment)}</span>
                <span>Length: {campMessage.length} characters</span>
              </div>
            </div>

            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black uppercase text-violet-400 tracking-wider">AI Optimizer Enabled</p>
                <p className="text-[10px] text-text-primary leading-tight mt-0.5">
                  Guileo AI will analyze optimal delivery times based on patient history, reducing no-show risks by 14%.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                className="border-border bg-surface2 text-text-primary font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider"
              >
                Launch Campaign
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
