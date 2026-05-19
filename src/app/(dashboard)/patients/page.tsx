'use client'

import { useState, useEffect } from 'react'
import { Search, Download, Users, UserCheck, UserX, Heart, ShieldAlert, CheckCircle, Clock, Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

export default function PatientsCRMPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [consentFilter, setConsentFilter] = useState('all')
  const router = useRouter()
  
  const { patients, fetchPatients, addPatient } = useClinicStore()

  // Import file and preview states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewPatients, setPreviewPatients] = useState<any[]>([])

  // Load sample CSV data
  const handleLoadSampleData = () => {
    setPreviewPatients([
      {
        name: 'Olivia Vance',
        phone: '+1-212-555-9011',
        email: 'olivia.vance@gmail.com',
        preferredChannel: 'VOICE',
        consents: { essential: true, marketing: true, intelligence: true },
        totalAppointments: 1,
        totalSpent: 120.0,
        averageAppointmentValue: 120.0,
        lastAppointmentAt: '2026-05-15',
        firstAppointmentAt: '2026-05-15',
        churnRisk: 'LOW',
        rfmSegment: 'NEW',
        insurance: { provider: 'Aetna Dental', policyNumber: 'AE-99382', status: 'VERIFIED' },
        treatmentHistory: ['Routine checkup and cleaning'],
        allergens: ['Penicillin'],
        medications: []
      },
      {
        name: 'Mason Miller',
        phone: '+1-516-555-8822',
        email: 'mason.miller@yahoo.com',
        preferredChannel: 'WHATSAPP',
        consents: { essential: true, marketing: false, intelligence: true },
        totalAppointments: 3,
        totalSpent: 450.0,
        averageAppointmentValue: 150.0,
        lastAppointmentAt: '2026-04-20',
        firstAppointmentAt: '2026-01-10',
        churnRisk: 'LOW',
        rfmSegment: 'LOYAL',
        insurance: { provider: 'UnitedHealthcare', policyNumber: 'UHC-44021', status: 'VERIFIED' },
        treatmentHistory: ['Fillings', 'Consultation'],
        allergens: [],
        medications: ['Ibuprofen']
      },
      {
        name: 'Sofia Rodriguez',
        phone: '+1-305-555-7733',
        email: 'sofia.rodriguez@outlook.com',
        preferredChannel: 'SMS',
        consents: { essential: true, marketing: true, intelligence: false },
        totalAppointments: 5,
        totalSpent: 980.0,
        averageAppointmentValue: 196.0,
        lastAppointmentAt: '2026-03-05',
        firstAppointmentAt: '2025-08-14',
        churnRisk: 'MEDIUM',
        rfmSegment: 'LOYAL',
        insurance: { provider: 'Cigna Dental', policyNumber: 'CG-88129', status: 'VERIFIED' },
        treatmentHistory: ['Crown replacement', 'Root canal'],
        allergens: ['Sulfa drugs'],
        medications: []
      }
    ])
    toast.success("Loaded sample patient records for import preview!")
  }

  // Parse CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n')
        const parsed: any[] = []

        // Simple CSV Parser
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const columns = line.split(',')
          if (columns.length < 3) continue

          const name = columns[0]?.trim() || ''
          const phone = columns[1]?.trim() || ''
          const email = columns[2]?.trim() || ''
          const preferredChannel = (columns[3]?.trim().toUpperCase() || 'VOICE') as any
          const provider = columns[4]?.trim() || 'Uninsured'
          const policyNumber = columns[5]?.trim() || ''

          if (name && phone) {
            parsed.push({
              name,
              phone,
              email,
              preferredChannel,
              consents: { essential: true, marketing: true, intelligence: true },
              totalAppointments: 0,
              totalSpent: 0,
              averageAppointmentValue: 0,
              lastAppointmentAt: '',
              firstAppointmentAt: '',
              churnRisk: 'LOW',
              rfmSegment: 'NEW',
              insurance: { provider, policyNumber, status: 'PENDING' },
              treatmentHistory: [],
              allergens: [],
              medications: []
            })
          }
        }

        if (parsed.length > 0) {
          setPreviewPatients(parsed)
          toast.success(`Successfully parsed ${parsed.length} patient records!`)
        } else {
          toast.error("Could not find valid rows in the CSV. Make sure headers are: Name, Phone, Email...")
        }
      } catch (err) {
        toast.error("Failed to parse file. Please upload a valid CSV.")
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    if (previewPatients.length === 0) return

    for (const patient of previewPatients) {
      await addPatient({
        tenantId: 'clinic-tenant-395b50b9-9504',
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        preferredChannel: patient.preferredChannel,
        consents: patient.consents,
        totalAppointments: patient.totalAppointments,
        totalSpent: patient.totalSpent,
        averageAppointmentValue: patient.averageAppointmentValue,
        lastAppointmentAt: patient.lastAppointmentAt,
        firstAppointmentAt: patient.firstAppointmentAt,
        churnRisk: patient.churnRisk,
        rfmSegment: patient.rfmSegment,
        insurance: patient.insurance,
        treatmentHistory: patient.treatmentHistory,
        allergens: patient.allergens,
        medications: patient.medications
      })
    }

    toast.success(`Successfully imported ${previewPatients.length} patient records into CRM database!`)
    setIsImportModalOpen(false)
    setPreviewPatients([])
    setImportFile(null)
  }

  // Calculate dynamic stats
  const totalCount = patients.length
  const activeCount = patients.filter(p => p.churnRisk === 'LOW').length
  const atRiskCount = patients.filter(p => p.churnRisk === 'HIGH').length
  const marketingCount = patients.filter(p => p.consents?.marketing).length

  // Filter patients dynamically
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.phone.includes(searchQuery) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSegment = 
      segmentFilter === 'all' ||
      (segmentFilter === 'champions' && p.rfmSegment === 'CHAMPION') ||
      (segmentFilter === 'loyal' && p.rfmSegment === 'LOYAL') ||
      (segmentFilter === 'at-risk' && p.churnRisk === 'HIGH')

    const matchesConsent = 
      consentFilter === 'all' ||
      (consentFilter === 'essential' && p.consents?.essential) ||
      (consentFilter === 'marketing' && p.consents?.marketing) ||
      (consentFilter === 'intelligence' && p.consents?.intelligence)

    return matchesSearch && matchesSegment && matchesConsent
  })

  // Export patient data to CSV
  const handleExportCSV = () => {
    if (filteredPatients.length === 0) {
      toast.error("No patient records available to export!")
      return
    }

    const headers = [
      "Patient ID", 
      "Name", 
      "Phone", 
      "Email", 
      "Preferred Channel", 
      "Total Appointments", 
      "Total Spent ($)", 
      "Insurance Provider", 
      "Policy Number",
      "Insurance Status",
      "Churn Risk", 
      "RFM Segment", 
      "Allergens",
      "Medications",
      "Marketing Consent"
    ]

    const rows = filteredPatients.map(p => [
      `"${p.id}"`,
      `"${p.name}"`,
      `"${p.phone}"`,
      `"${p.email}"`,
      `"${p.preferredChannel}"`,
      p.totalAppointments,
      p.totalSpent.toFixed(2),
      `"${p.insurance.provider}"`,
      `"${p.insurance.policyNumber}"`,
      `"${p.insurance.status}"`,
      `"${p.churnRisk}"`,
      `"${p.rfmSegment}"`,
      `"${p.allergens.join('; ')}"`,
      `"${p.medications.join('; ')}"`,
      p.consents?.marketing ? "YES" : "NO"
    ])

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `guileo_patients_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Patient database exported successfully!")
  }

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Patient CRM & Medical Records" 
        subtitle="HIPAA-compliant patient directory, treatment summaries, insurance verification, and privacy logs."
        actions={
          <div className="flex items-center gap-3">
            <Button 
              suppressHydrationWarning
              onClick={() => setIsImportModalOpen(true)}
              variant="outline" 
              className="border-border bg-surface text-text-primary gap-2 text-xs font-bold uppercase tracking-wider h-9"
            >
              <Upload className="w-4 h-4 text-primary" />
              Import from Excel/CSV
            </Button>
            <Button 
              suppressHydrationWarning
              onClick={handleExportCSV}
              variant="outline" 
              className="border-border bg-surface text-text-primary gap-2 text-xs font-bold uppercase tracking-wider h-9"
            >
              <Download className="w-4 h-4 text-primary" />
              Export Patient List
            </Button>
          </div>
        }
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Registered</p>
            <h3 className="text-xl font-bold text-text-primary">{totalCount}</h3>
          </div>
        </Card>
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Patients</p>
            <h3 className="text-xl font-bold text-text-primary">{activeCount}</h3>
          </div>
        </Card>
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500 shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">At-Risk Churn</p>
            <h3 className="text-xl font-bold text-text-primary">{atRiskCount}</h3>
          </div>
        </Card>
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">SMS/WA Opt-in</p>
            <h3 className="text-xl font-bold text-text-primary">{marketingCount}</h3>
          </div>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Search patients by name, phone or chart ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface2 border-border h-10 w-full" 
            />
          </div>
          
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[160px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent className="bg-surface border border-border">
              <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Segments</SelectItem>
              <SelectItem value="champions" className="text-xs font-semibold text-text-primary">Champions</SelectItem>
              <SelectItem value="loyal" className="text-xs font-semibold text-text-primary">Loyal Patients</SelectItem>
              <SelectItem value="at-risk" className="text-xs font-semibold text-text-primary">At Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={consentFilter} onValueChange={setConsentFilter}>
            <SelectTrigger className="w-[160px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
              <SelectValue placeholder="Consent Tier" />
            </SelectTrigger>
            <SelectContent className="bg-surface border border-border">
              <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Tiers</SelectItem>
              <SelectItem value="essential" className="text-xs font-semibold text-text-primary">Essential Only</SelectItem>
              <SelectItem value="marketing" className="text-xs font-semibold text-text-primary">Marketing</SelectItem>
              <SelectItem value="intelligence" className="text-xs font-semibold text-text-primary">Intelligence</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Patients Data Table Grid */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface2/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="py-4 px-6">Patient Name</th>
                <th className="py-4 px-6">Preferred Channel</th>
                <th className="py-4 px-6">Visits</th>
                <th className="py-4 px-6">LTV spent</th>
                <th className="py-4 px-6">Insurance Status</th>
                <th className="py-4 px-6">Churn Risk</th>
                <th className="py-4 px-6">GDPR Consent</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map(p => (
                  <tr 
                    key={p.id}
                    className="border-b border-border hover:bg-surface2/50 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/patients/${p.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-black text-text-primary leading-none">{p.name}</p>
                          <p className="text-[9px] text-text-muted mt-1 font-mono">{p.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">{p.preferredChannel}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-surface2 border border-border text-xs font-bold text-text-primary">{p.totalAppointments}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-black text-text-primary">${p.totalSpent.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        p.insurance.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {p.insurance.status === 'VERIFIED' ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {p.insurance.provider} ({p.insurance.status})
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        p.churnRisk === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : p.churnRisk === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>{p.churnRisk}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.consents.essential ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface2 text-text-muted'}`}>ESS</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.consents.marketing ? 'bg-violet-500/10 text-violet-500' : 'bg-surface2 text-text-muted'}`}>MKT</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.consents.intelligence ? 'bg-blue-500/10 text-blue-500' : 'bg-surface2 text-text-muted'}`}>INT</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 font-bold uppercase text-[9px] tracking-widest h-8"
                      >
                        Chart Profile
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                    No clinical patient records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel/CSV Import Dialog */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="bg-surface border-border p-6 rounded-2xl shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Import Patients Database
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Upload a `.csv` file formatted with column headers: `Name, Phone, Email, Preferred Channel, Insurance Provider, Policy Number`.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Dropzone / Upload area */}
            <div className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-8 text-center cursor-pointer transition-all bg-background/35 relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2" />
              <p className="text-xs font-black uppercase text-text-primary tracking-wide">
                {importFile ? importFile.name : 'Select or drag your CSV file here'}
              </p>
              <p className="text-[10px] text-text-muted mt-1">Accepts UTF-8 comma-separated list values.</p>
            </div>

            {/* Load Sample shortcut */}
            <div className="flex justify-between items-center bg-surface2 p-3 rounded-xl border border-border">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">No CSV file on hand?</span>
              <Button 
                onClick={handleLoadSampleData}
                type="button" 
                size="sm"
                className="bg-primary/20 hover:bg-primary/30 text-primary border-none text-[9px] font-black uppercase tracking-widest h-7"
              >
                Load Sample Mock Patients
              </Button>
            </div>

            {/* Preview table */}
            {previewPatients.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Preview Import ({previewPatients.length} record{previewPatients.length > 1 ? 's' : ''})
                </h4>
                <div className="max-h-[200px] overflow-y-auto rounded-xl border border-border bg-background/50">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-surface2/80 border-b border-border font-bold uppercase tracking-wider text-text-muted">
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3">Channel</th>
                        <th className="py-2 px-3">Insurance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewPatients.map((p, idx) => (
                        <tr key={idx} className="border-b border-border/40 hover:bg-surface2/30">
                          <td className="py-2 px-3 font-bold text-text-primary">{p.name}</td>
                          <td className="py-2 px-3 font-mono text-text-muted">{p.phone}</td>
                          <td className="py-2 px-3 text-primary uppercase font-bold">{p.preferredChannel}</td>
                          <td className="py-2 px-3 text-text-muted">{p.insurance.provider}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
            <Button 
              onClick={() => {
                setIsImportModalOpen(false)
                setPreviewPatients([])
                setImportFile(null)
              }}
              variant="outline" 
              className="border-border bg-surface2 text-text-primary text-[10px] font-bold uppercase tracking-widest h-9"
            >
              Cancel
            </Button>
            <Button 
              disabled={previewPatients.length === 0}
              onClick={handleConfirmImport}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase tracking-wider h-9"
            >
              Confirm Import ({previewPatients.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
