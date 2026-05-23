'use client'

import { useState, useEffect } from 'react'
import { Search, Upload, CheckCircle2, AlertCircle, Clock, DollarSign, ListFilter, Sparkles, FileText, Check, HelpCircle } from 'lucide-react'
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
import { toast } from 'react-hot-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { ClinicService } from '@/lib/types'

export default function ServicesPage() {
  const [services, setServices] = useState<ClinicService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // CSV upload states
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Fetch services from the backend
  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data)
      } else {
        toast.error("Failed to load services database.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred while loading services.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file.")
      return
    }
    setUploadFile(file)
  }

  // Handle CSV file upload submission
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error("Please select a file first.")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Successfully uploaded and parsed ${data.count} services!`)
        setServices(data.services)
        setIsUploadOpen(false)
        setUploadFile(null)
      } else {
        const errData = await res.json()
        toast.error(errData.error || "Failed to upload services CSV.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network error. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Categories list for filtering
  const categories = Array.from(new Set(services.map(s => s.category)))

  // Statistics
  const totalCount = services.length
  const enabledCount = services.filter(s => s.enabled).length
  const avgPrice = totalCount > 0 
    ? services.reduce((sum, s) => sum + s.price_usd, 0) / totalCount 
    : 0
  const consultRequiredCount = services.filter(s => s.requires_consultation).length

  // Filtered Services List
  const filteredServices = services.filter(s => {
    const matchesSearch = 
      s.service_label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.service_type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = 
      categoryFilter === 'all' || 
      s.category.toLowerCase() === categoryFilter.toLowerCase()

    return matchesSearch && matchesCategory
  })

  return (
    <div suppressHydrationWarning className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Clinic Services & Treatments" 
        subtitle="Manage available treatments, service pricing, appointment durations, and booking requirements."
        actions={
          <div className="flex items-center gap-3">
            <Button 
              suppressHydrationWarning
              onClick={() => setIsUploadOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white gap-2 text-xs font-bold uppercase tracking-wider h-9 px-4 rounded-xl"
            >
              <Upload className="w-4 h-4" />
              Upload Services CSV
            </Button>
          </div>
        }
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Services</p>
            <h3 className="text-xl font-bold text-text-primary">{totalCount}</h3>
          </div>
        </Card>
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active/Enabled</p>
            <h3 className="text-xl font-bold text-text-primary">{enabledCount}</h3>
          </div>
        </Card>
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Avg Price</p>
            <h3 className="text-xl font-bold text-text-primary">${avgPrice.toFixed(2)}</h3>
          </div>
        </Card>
        <Card className="p-4 bg-surface border-border flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Needs Consult</p>
            <h3 className="text-xl font-bold text-text-primary">{consultRequiredCount}</h3>
          </div>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Search treatments by label or type code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface2 border-border h-10 w-full" 
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-surface2 border-border h-10 text-xs font-semibold text-text-primary">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-surface border border-border">
              <SelectItem value="all" className="text-xs font-semibold text-text-primary">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat.toLowerCase()} className="text-xs font-semibold text-text-primary">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Services Data Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface2/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="py-4 px-6">Service Name</th>
                <th className="py-4 px-6">Type Code</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Requires Consult</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                    Loading services database...
                  </td>
                </tr>
              ) : filteredServices.length > 0 ? (
                filteredServices.map((s, idx) => (
                  <tr 
                    key={idx}
                    className="border-b border-border hover:bg-surface2/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-xs font-black text-text-primary leading-none">{s.service_label}</p>
                        {s.price_note && <p className="text-[9px] text-text-muted mt-1 font-mono">{s.price_note}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-mono font-black uppercase text-primary tracking-wider">{s.service_type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[10px] font-bold text-text-primary uppercase tracking-wide">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-black text-text-primary flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-text-muted" /> {s.duration_min} mins
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-black text-text-primary">${s.price_usd.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        s.requires_consultation
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {s.requires_consultation ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        s.enabled
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {s.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted text-xs font-bold uppercase tracking-wider">
                    No services found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-surface border-border p-6 rounded-2xl shadow-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Upload Services Schema
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Upload a `.csv` file formatted with headers: `service_type, service_label, category, duration_min, price_usd, price_note, enabled, requires_consultation`.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Dropzone area */}
            <div className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-8 text-center cursor-pointer transition-all bg-background/35 relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2" />
              <p className="text-xs font-black uppercase text-text-primary tracking-wide">
                {uploadFile ? uploadFile.name : 'Select or drag your CSV file here'}
              </p>
              <p className="text-[10px] text-text-muted mt-1">Accepts comma-separated values (CSV).</p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
            <Button 
              onClick={() => {
                setIsUploadOpen(false)
                setUploadFile(null)
              }}
              variant="outline" 
              className="border-border bg-surface2 text-text-primary text-[10px] font-bold uppercase tracking-widest h-9"
            >
              Cancel
            </Button>
            <Button 
              disabled={!uploadFile || uploading}
              onClick={handleUploadSubmit}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-[10px] uppercase tracking-wider h-9"
            >
              {uploading ? 'Processing...' : 'Upload & Parse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
