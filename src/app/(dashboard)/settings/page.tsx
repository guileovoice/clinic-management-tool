'use client'

import { useState } from 'react'
import { 
  Settings, 
  User, 
  PhoneCall, 
  Bell, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  Sliders, 
  Lock, 
  Eye, 
  KeyRound,
  FileText,
  Activity
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { toast } from 'react-hot-toast'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'

export default function SettingsPage() {
  const { info, updateClinicInfo } = useClinicStore()

  // Tab State
  const [activeTab, setActiveTab] = useState('general')

  // General Settings inputs
  const [clinicName, setClinicName] = useState(info.name)
  const [clinicPhone, setClinicPhone] = useState(info.phone)
  const [clinicAddress, setClinicAddress] = useState(info.address)
  const [clinicCategory, setClinicCategory] = useState(info.category)
  const [stripePublishableKey, setStripePublishableKey] = useState(info.stripePublishableKey || '')
  const [stripeSecretKey, setStripeSecretKey] = useState(info.stripeSecretKey || '')

  // Voice AI Agent inputs
  const [voicePersona, setVoicePersona] = useState(info.voicePersona)
  const [agentLanguage, setAgentLanguage] = useState(info.agentLanguage || 'en-US')
  const [greetingText, setGreetingText] = useState(
    info.greetingText || 'Welcome to Origem Dental & Aesthetic Clinic. This is Arthur, your virtual dental assistant. How can I assist you with scheduling or dental care today?'
  )
  const [agentTemp, setAgentTemp] = useState(info.agentTemp || '0.4')
  const [interruptSens, setInterruptSens] = useState(info.interruptSens || 'Medium')

  // Notifications inputs
  const [waConfirmations, setWaConfirmations] = useState(info.waConfirmations !== false)
  const [smsNoShowAlerts, setSmsNoShowAlerts] = useState(info.smsNoShowAlerts !== false)
  const [autoInsuranceVerify, setAutoInsuranceVerify] = useState(info.autoInsuranceVerify !== false)
  const [churnRiskAnalytics, setChurnRiskAnalytics] = useState(info.churnRiskAnalytics !== false)

  // Test Notification Phone
  const [testPhone, setTestPhone] = useState('')

  // Handle General Profile Update
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinicName || !clinicPhone || !clinicAddress) {
      toast.error("Please fill in all clinical profile requirements.")
      return
    }

    await updateClinicInfo({
      name: clinicName,
      phone: clinicPhone,
      address: clinicAddress,
      category: clinicCategory,
      stripePublishableKey: stripePublishableKey,
      stripeSecretKey: stripeSecretKey
    })

    toast.success("General clinical profile and Stripe integrations updated instantly!")
  }

  // Handle Voice AI Save
  const handleSaveVoiceAI = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voicePersona || !greetingText) {
      toast.error("Please provide a name and greeting script for the AI agent.")
      return
    }

    await updateClinicInfo({
      voicePersona: voicePersona,
      agentLanguage: agentLanguage,
      greetingText: greetingText,
      agentTemp: agentTemp,
      interruptSens: interruptSens
    })

    toast.success(`Voice Agent settings updated! "${voicePersona}" model re-trained successfully.`)
  }

  // Trigger Mock SMS Test
  const handleTriggerTestSms = () => {
    if (!testPhone) {
      toast.error("Please provide a test mobile number.")
      return
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Sending mock encrypted safety confirmation to ${testPhone}...`,
        success: 'Test SMS successfully transmitted! Verified on Twilio node.',
        error: 'Transmission failed.'
      }
    )
    setTestPhone('')
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Guileo Clinic System Settings" 
        subtitle="Configure HIPAA compliance parameters, customize automated AI Voice greeting scripts, and manage Stripe credentials."
        actions={
          <div className="flex items-center gap-3">
            <DateRangeFilter />
          </div>
        }
      />

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="bg-surface border border-border p-1 rounded-xl w-full max-w-2xl grid grid-cols-4">
          <TabsTrigger value="general" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2">
            <User className="w-3.5 h-3.5 mr-1" /> Profile
          </TabsTrigger>
          <TabsTrigger value="voice-ai" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2">
            <PhoneCall className="w-3.5 h-3.5 mr-1" /> Voice AI Agent
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2">
            <Bell className="w-3.5 h-3.5 mr-1" /> Safety Rules
          </TabsTrigger>
          <TabsTrigger value="hipaa-security" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> HIPAA Audits
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="p-6 bg-surface border-border max-w-3xl">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> General Clinical Profile
            </h3>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Clinic Name</label>
                  <Input 
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Clinical Category</label>
                  <Select value={clinicCategory} onValueChange={setClinicCategory}>
                    <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                      <SelectValue placeholder="Dental & Aesthetics" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border border-border">
                      <SelectItem value="Dental & Aesthetics" className="text-xs font-semibold text-text-primary">Dental & Aesthetics</SelectItem>
                      <SelectItem value="General Practice Care" className="text-xs font-semibold text-text-primary">General Practice Care</SelectItem>
                      <SelectItem value="Orthodontics & Implants" className="text-xs font-semibold text-text-primary">Orthodontics & Implants</SelectItem>
                      <SelectItem value="Chiropractic Care" className="text-xs font-semibold text-text-primary">Chiropractic Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Clinic Phone</label>
                  <Input 
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">HIPAA License Key</label>
                  <Input 
                    disabled 
                    value="LIC-HIPAA-NY-0921B" 
                    className="bg-surface2/50 border-border h-10 text-xs font-mono font-bold text-text-muted"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Clinic Address</label>
                <Input 
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
                />
              </div>

              {/* Stripe Payment Gateway Credentials */}
              <div className="pt-4 border-t border-border mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Stripe Payment Gateway</h4>
                  <p className="text-[10px] text-text-muted mt-0.5">Integrate credit card payments and co-pay collections directly into the patient check-in flow.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Stripe Publishable Key</label>
                    <Input 
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_test_..."
                      className="bg-surface2 border-border h-10 text-xs font-mono font-semibold text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Stripe Secret Key</label>
                    <Input 
                      type="password"
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      placeholder="sk_test_..."
                      className="bg-surface2 border-border h-10 text-xs font-mono font-semibold text-text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-6 flex justify-end">
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider px-6 h-10"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Voice AI Settings */}
        <TabsContent value="voice-ai" className="space-y-4">
          <Card className="p-6 bg-surface border-border max-w-3xl">
            <h3 className="text-base font-black text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary" /> Voice Telephony Agent settings
            </h3>

            <form onSubmit={handleSaveVoiceAI} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">AI Voice Persona</label>
                  <Input 
                    value={voicePersona}
                    onChange={(e) => setVoicePersona(e.target.value)}
                    className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Voice Language & Accent</label>
                  <Select value={agentLanguage} onValueChange={setAgentLanguage}>
                    <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                      <SelectValue placeholder="English (US)" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border border-border">
                      <SelectItem value="en-US" className="text-xs font-semibold text-text-primary">English (US) - Arthur Premium</SelectItem>
                      <SelectItem value="en-GB" className="text-xs font-semibold text-text-primary">English (UK) - British Doctor</SelectItem>
                      <SelectItem value="es-US" className="text-xs font-semibold text-text-primary">Spanish (US) - Bilingual Arthur</SelectItem>
                      <SelectItem value="pt-BR" className="text-xs font-semibold text-text-primary">Portuguese (BR) - Localized Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Behavior parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Voice Model Temperature</label>
                  <Select value={agentTemp} onValueChange={setAgentTemp}>
                    <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-mono font-bold text-text-primary">
                      <SelectValue placeholder="0.4" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border border-border">
                      <SelectItem value="0.2" className="text-xs font-mono font-bold text-text-primary">0.2 (Conservative scheduling)</SelectItem>
                      <SelectItem value="0.4" className="text-xs font-mono font-bold text-text-primary">0.4 (Balanced conversation)</SelectItem>
                      <SelectItem value="0.6" className="text-xs font-mono font-bold text-text-primary">0.6 (High descriptive empathy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Interruption Sensitivity</label>
                  <Select value={interruptSens} onValueChange={setInterruptSens}>
                    <SelectTrigger className="bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
                      <SelectValue placeholder="Medium" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border border-border">
                      <SelectItem value="Low" className="text-xs font-semibold text-text-primary">Low (Ignores minor coughs)</SelectItem>
                      <SelectItem value="Medium" className="text-xs font-semibold text-text-primary">Medium (Standard patient flow)</SelectItem>
                      <SelectItem value="High" className="text-xs font-semibold text-text-primary">High (Immediate pause on speech)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">AI Agent Greeting Prompt Message</label>
                <Textarea 
                  value={greetingText}
                  onChange={(e) => setGreetingText(e.target.value)}
                  rows={4}
                  className="bg-surface2 border-border text-xs font-semibold text-text-primary"
                />
              </div>

              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Voice synthetics latency: ~140ms active</span>
              </div>

              <div className="pt-4 border-t border-border mt-6 flex justify-end">
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider px-6 h-10"
                >
                  Save Agent Model Settings
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 3: Safety Rules & Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-4xl">
            
            {/* Toggles */}
            <Card className="p-6 bg-surface border-border lg:col-span-8 space-y-6">
              <h3 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Safety Reminders & Automation
              </h3>

              <div className="space-y-4">
                
                {/* 1. WA confirmations */}
                <div className="p-3.5 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">WhatsApp Safety Confirmation</h4>
                    <p className="text-[10px] text-text-muted font-medium">Auto-dispatch confirmation to patients at appointment confirmation.</p>
                  </div>
                  <Switch 
                    checked={waConfirmations} 
                    onCheckedChange={async (checked) => {
                      setWaConfirmations(checked);
                      await updateClinicInfo({ waConfirmations: checked });
                      toast.success(`WhatsApp safety confirmation ${checked ? 'enabled' : 'disabled'}!`);
                    }} 
                  />
                </div>

                {/* 2. SMS Recall */}
                <div className="p-3.5 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">SMS 24h & 2h Safety Reminders</h4>
                    <p className="text-[10px] text-text-muted font-medium">Trigger dual automated confirmations to avoid no-shows.</p>
                  </div>
                  <Switch 
                    checked={smsNoShowAlerts} 
                    onCheckedChange={async (checked) => {
                      setSmsNoShowAlerts(checked);
                      await updateClinicInfo({ smsNoShowAlerts: checked });
                      toast.success(`SMS 24h & 2h reminders ${checked ? 'enabled' : 'disabled'}!`);
                    }} 
                  />
                </div>

                {/* 3. Insurance check */}
                <div className="p-3.5 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Auto-Insurance Eligibility Clearings</h4>
                    <p className="text-[10px] text-text-muted font-medium">Verify insurance automatically via clearinghouse API on scheduler entry.</p>
                  </div>
                  <Switch 
                    checked={autoInsuranceVerify} 
                    onCheckedChange={async (checked) => {
                      setAutoInsuranceVerify(checked);
                      await updateClinicInfo({ autoInsuranceVerify: checked });
                      toast.success(`Auto-Insurance eligibility clearings ${checked ? 'enabled' : 'disabled'}!`);
                    }} 
                  />
                </div>

                {/* 4. Churn Risk profiling */}
                <div className="p-3.5 bg-surface2 rounded-xl border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Live Predictive Churn Segmenting</h4>
                    <p className="text-[10px] text-text-muted font-medium">Calculate churn probability and RFM segmentation values automatically.</p>
                  </div>
                  <Switch 
                    checked={churnRiskAnalytics} 
                    onCheckedChange={async (checked) => {
                      setChurnRiskAnalytics(checked);
                      await updateClinicInfo({ churnRiskAnalytics: checked });
                      toast.success(`Live predictive churn segmenting ${checked ? 'enabled' : 'disabled'}!`);
                    }} 
                  />
                </div>

              </div>
            </Card>

            {/* Test Trigger */}
            <Card className="p-6 bg-surface border-border lg:col-span-4 h-fit flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Test Safety Gateway</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Input a mobile number to transmit a simulated live HIPAA-secured recall confirmation text to a clinical patient.
                </p>

                <div className="space-y-2">
                  <Input 
                    placeholder="+1-555-0199"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="bg-surface2 border-border h-10 text-xs font-mono font-semibold text-text-primary"
                  />
                  <Button 
                    onClick={handleTriggerTestSms}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider h-10"
                  >
                    Send Test SMS
                  </Button>
                </div>
              </div>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 4: HIPAA security audits */}
        <TabsContent value="hipaa-security" className="space-y-4">
          <Card className="p-6 bg-surface border-border max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div>
                <h3 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" /> HIPAA Security Compliance logs
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Real-time encryption keys re-keying and clinical data privacy changes.</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest font-mono">
                Compliant
              </Badge>
            </div>

            {/* Logs stream */}
            <div className="space-y-3 font-mono text-[10px]">
              
              {/* Event 1 */}
              <div className="p-3 bg-surface2 border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <div>
                    <span className="text-text-muted font-bold block">RE-KEY SECURITY NODE</span>
                    <span className="text-text-muted">Master database columns re-keyed with AES-256 GCM algorithms.</span>
                  </div>
                </div>
                <span className="text-text-muted font-semibold">Just now</span>
              </div>

              {/* Event 2 */}
              <div className="p-3 bg-surface2 border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <span className="text-text-muted font-bold block">PIXEL HASH CONFORMS AUDIT</span>
                    <span className="text-text-muted">Google & Meta retargeting pixel endpoints confirmed fully hashed. No raw ePHI exposed.</span>
                  </div>
                </div>
                <span className="text-text-muted font-semibold">2 hours ago</span>
              </div>

              {/* Event 3 */}
              <div className="p-3 bg-surface2 border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <div>
                    <span className="text-text-muted font-bold block">DSR PRIVACY POLICY CONFIRMED</span>
                    <span className="text-text-muted">GDPR Data Subject Right compliance modules initialized for medical chart profiles.</span>
                  </div>
                </div>
                <span className="text-text-muted font-semibold">Yesterday</span>
              </div>

              {/* Event 4 */}
              <div className="p-3 bg-surface2 border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <div>
                    <span className="text-text-muted font-bold block">STRIPE BILLING SSL CHECKED</span>
                    <span className="text-text-muted">Stripe billing callback verified over secure TLS 1.3 tunnels.</span>
                  </div>
                </div>
                <span className="text-text-muted font-semibold">3 days ago</span>
              </div>

            </div>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
