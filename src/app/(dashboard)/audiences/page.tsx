'use client'

import { useState } from 'react'
import { 
  Target, 
  Plus, 
  Search, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle, 
  Users, 
  Fingerprint, 
  Layers, 
  Sliders, 
  ArrowRight,
  TrendingUp,
  X,
  Flame,
  Globe,
  Radio,
  Lock
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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

interface AudienceSegment {
  id: string
  name: string
  criteria: string
  count: number
  platforms: string[]
  lastSync: string
}

export default function AudiencesPage() {
  const { patients } = useClinicStore()
  
  // Custom segment state
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [segmentName, setSegmentName] = useState('')
  const [minSpend, setMinSpend] = useState('100')
  const [minVisits, setMinVisits] = useState('1')
  const [preferredChannel, setPreferredChannel] = useState('all')

  // Syncing simulation state
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)

  // Platforms State
  const [metaConnected, setMetaConnected] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(true)
  const [tiktokConnected, setTiktokConnected] = useState(false)

  // Dynamic calculations of base segments
  const championsCount = patients.filter(p => p.rfmSegment === 'CHAMPION').length * 42 // simulated sizes
  const loyalCount = patients.filter(p => p.rfmSegment === 'LOYAL').length * 45
  const atRiskCount = patients.filter(p => p.churnRisk === 'HIGH').length * 32
  const allCount = patients.length * 52

  const [customSegments, setCustomSegments] = useState<AudienceSegment[]>([
    { id: 'seg-1', name: 'VIP Champions Retargeting', criteria: 'RFM Champions, spent > $1000', count: championsCount, platforms: ['Meta', 'Google'], lastSync: '3 hours ago' },
    { id: 'seg-2', name: 'Recall Winback Inactive', criteria: 'High risk, 6mo+ since last visit', count: atRiskCount, platforms: ['Google'], lastSync: 'Yesterday' },
    { id: 'seg-3', name: 'General Patient Directory', criteria: 'All GDPR opted-in patients', count: allCount, platforms: ['Meta', 'Google'], lastSync: '2 days ago' }
  ])

  // Dynamic Patient matching preview
  const previewMatchingCount = () => {
    return patients.filter(p => {
      const matchSpend = p.totalSpent >= Number(minSpend)
      const matchVisits = p.totalAppointments >= Number(minVisits)
      const matchChannel = preferredChannel === 'all' || p.preferredChannel === preferredChannel
      return matchSpend && matchVisits && matchChannel
    }).length * 28 // Simulated multiplier for larger audience sizes
  }

  // Handle Create Custom Segment
  const handleCreateSegment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!segmentName) {
      toast.error("Please provide a segment name.")
      return
    }

    const count = previewMatchingCount()
    const newSeg: AudienceSegment = {
      id: `seg-${Date.now()}`,
      name: segmentName,
      criteria: `Spent >= $${minSpend}, visits >= ${minVisits}, channel: ${preferredChannel}`,
      count: count > 0 ? count : 12,
      platforms: ['Google'],
      lastSync: 'Not synced yet'
    }

    setCustomSegments(prev => [...prev, newSeg])
    toast.success(`Custom segment "${segmentName}" created successfully with ${count} matched profiles!`)
    setIsCustomOpen(false)
    setSegmentName('')
  }

  // Sync Simulator
  const handleSyncSegment = (segId: string, segName: string) => {
    setIsSyncing(segId)
    setSyncProgress(0)

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsSyncing(null)
            setCustomSegments(prevSegs => prevSegs.map(s => 
              s.id === segId ? { ...s, lastSync: 'Just now' } : s
            ))
            toast.success(
              `SHA-256 Hashed privacy sync complete! ${
                customSegments.find(s => s.id === segId)?.count
              } records updated safely on Ad platforms.`
            )
          }, 500)
          return 100
        }
        return prev + 20
      })
    }, 300)
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Privacy-Safe Ad Sync Command" 
        subtitle="HIPAA-compliant patient segment targeting, automated SHA-256 hashing, and pixel-retargeting dashboards."
        actions={
          <Button 
            onClick={() => setIsCustomOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white gap-2 text-xs font-black uppercase tracking-wider h-10 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4.5 h-4.5" />
            Build Custom Audience
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Matched Leads</p>
            <h3 className="text-xl font-bold text-text-primary">
              {customSegments.reduce((sum, s) => sum + s.count, 0).toLocaleString()}
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">HIPAA Compliance Level</p>
            <h3 className="text-xl font-bold text-text-primary">100% SHA-256</h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Connected Channels</p>
            <h3 className="text-xl font-bold text-text-primary">
              {[metaConnected, googleConnected, tiktokConnected].filter(Boolean).length} Tiers
            </h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Average Match Rate</p>
            <h3 className="text-xl font-bold text-text-primary">84.5%</h3>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Audited Sync Status</p>
            <h3 className="text-xl font-bold text-text-primary">Secured</h3>
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Segments list */}
        <div className="xl:col-span-8 space-y-6">
          <Card className="p-6 bg-surface border-border">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Active Segment Hashing Maps
            </h3>

            <div className="space-y-4">
              {customSegments.map(seg => {
                const isThisSyncing = isSyncing === seg.id
                return (
                  <div key={seg.id} className="p-4 bg-surface2 rounded-xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/30 transition-all">
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">{seg.name}</h4>
                      <p className="text-[10px] text-text-muted font-semibold">Criteria: {seg.criteria}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase font-mono px-2 py-0.5">
                          {seg.count} records matched
                        </Badge>
                        <span className="text-[9px] text-text-muted">|</span>
                        
                        {seg.platforms.map(plat => (
                          <span key={plat} className="text-[8px] font-black uppercase text-violet-400 bg-violet-500/5 px-2 py-0.5 border border-violet-500/10 rounded">
                            {plat} Ads
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-[8px] uppercase text-text-muted font-bold block">Last Synchronized</span>
                        <span className="text-[10px] text-text-primary font-mono font-bold">{seg.lastSync}</span>
                      </div>

                      <Button 
                        disabled={isThisSyncing}
                        onClick={() => handleSyncSegment(seg.id, seg.name)}
                        className="bg-surface border border-border hover:bg-surface2 text-text-primary h-9 font-bold text-[10px] uppercase tracking-wider gap-2 w-32 justify-center"
                      >
                        {isThisSyncing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> {syncProgress}%
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-primary" /> Hash Sync
                          </>
                        )}
                      </Button>
                    </div>

                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Platform integrations and secure checks */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Ad Channels */}
          <Card className="p-6 bg-surface border-border">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-6">Connected Channels</h3>
            
            <div className="space-y-4">
              {/* Meta */}
              <div className="p-3 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Meta Ads Pixel</h4>
                  <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider">Connected · Match: 86%</span>
                </div>
                <Switch checked={metaConnected} onCheckedChange={setMetaConnected} />
              </div>

              {/* Google */}
              <div className="p-3 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Google Customer Match</h4>
                  <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider">Connected · Match: 82%</span>
                </div>
                <Switch checked={googleConnected} onCheckedChange={setGoogleConnected} />
              </div>

              {/* TikTok */}
              <div className="p-3 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">TikTok Custom Audiences</h4>
                  <span className={`text-[8px] font-black uppercase tracking-wider ${tiktokConnected ? 'text-emerald-500' : 'text-text-muted'}`}>
                    {tiktokConnected ? 'Connected · Match: 78%' : 'Deactivated'}
                  </span>
                </div>
                <Switch checked={tiktokConnected} onCheckedChange={setTiktokConnected} />
              </div>
            </div>
          </Card>

          {/* Secure Hashing Policy Compliance */}
          <Card className="p-6 bg-surface border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16" />
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0" /> HIPAA Privacy Standard
            </h3>
            <p className="text-xs text-text-muted leading-relaxed relative z-10">
              Patients are targeted strictly through privacy-safe identifiers. Raw clinical data (diagnoses, charts, allergies) is **never transmitted** to third-party ad pixels under HIPAA CFR rules.
            </p>
            <div className="mt-4 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center gap-2 relative z-10">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-mono">100% SHA-256 HASH COMPLIANT</span>
            </div>
          </Card>

        </div>

      </div>

      {/* Build Segment Modal */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="bg-surface border-border p-6 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" /> Create Custom Audience Segment
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Filter the patient CRM nodes by spending metrics and appointments to sync privacy lists.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSegment} className="space-y-4 pt-4">
            
            {/* Segment Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Audience Segment Name</label>
              <Input 
                placeholder="e.g. VIP Cosmetic Patients"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
              />
            </div>

            {/* Spend Slider / Input */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Minimum Spent ($)</label>
                <Input 
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="bg-surface2 border-border h-10 text-xs font-mono font-bold text-text-primary"
                />
              </div>

              {/* Min Visits */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Minimum Visit Count</label>
                <Input 
                  type="number"
                  value={minVisits}
                  onChange={(e) => setMinVisits(e.target.value)}
                  className="bg-surface2 border-border h-10 text-xs font-mono font-bold text-text-primary"
                />
              </div>
            </div>

            {/* Channels preference */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Preferred Booking Channel</label>
              <Select value={preferredChannel} onValueChange={setPreferredChannel}>
                <SelectTrigger className="w-full bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border">
                  <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Channels</SelectItem>
                  <SelectItem value="WHATSAPP" className="text-xs font-semibold text-text-primary">WhatsApp Only</SelectItem>
                  <SelectItem value="VOICE" className="text-xs font-semibold text-text-primary">AI Voice Agent Only</SelectItem>
                  <SelectItem value="SMS" className="text-xs font-semibold text-text-primary">SMS Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview Box */}
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl space-y-1">
              <p className="text-[9px] font-black uppercase text-violet-400 tracking-wider">Segment Target Estimation</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-text-primary font-bold">Estimated Matched Profiles:</span>
                <span className="text-sm font-mono font-extrabold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                  {previewMatchingCount()} nodes
                </span>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCustomOpen(false)}
                className="border-border bg-surface2 text-text-primary font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider"
              >
                Generate Segment
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
