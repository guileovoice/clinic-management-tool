import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { supabase } from '@/lib/supabaseClient'

const servicesJsonPath = path.join(process.cwd(), 'src/app/services.json')
const defaultCsvPath = path.join(process.cwd(), 'src/app/clinic_services.csv')

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/)
  if (lines.length === 0) return []
  
  // Find header row (first line with content)
  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      headerIndex = i
      break
    }
  }
  if (headerIndex === -1) return []

  const headers = lines[headerIndex].split(',').map(h => h.trim().toLowerCase())
  
  const parsed: any[] = []
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Split line by comma, respecting quotes
    const columns: string[] = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    columns.push(current.trim())
    
    const row: any = {}
    headers.forEach((header, idx) => {
      let val = columns[idx] || ''
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1)
      }
      
      // Parse data types appropriately
      if (header === 'duration_min') {
        row[header] = parseInt(val, 10) || 0
      } else if (header === 'price_usd') {
        row[header] = parseFloat(val) || 0
      } else if (header === 'enabled' || header === 'requires_consultation') {
        row[header] = val.toLowerCase() === 'true'
      } else {
        row[header] = val
      }
    })
    parsed.push(row)
  }
  return parsed
}

export async function GET() {
  try {
    // Try to get from Supabase services table first
    const { data: dbData, error: dbError } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', '395b50b9-9504-4bda-bd38-7ce5b53e7aa0')
      .order('created_at', { ascending: true })

    if (!dbError && dbData) {
      // If table exists but is empty, seed it with default CSV data
      if (dbData.length === 0 && fs.existsSync(defaultCsvPath)) {
        console.log("Seeding Supabase services with default CSV...");
        const csvText = fs.readFileSync(defaultCsvPath, 'utf8')
        const parsed = parseCSV(csvText)
        const dbRows = parsed.map(s => ({
          tenant_id: '395b50b9-9504-4bda-bd38-7ce5b53e7aa0',
          service_type: s.service_type,
          service_label: s.service_label,
          category: s.category,
          duration_min: s.duration_min,
          price_usd: s.price_usd,
          price_note: s.price_note,
          enabled: s.enabled,
          requires_consultation: s.requires_consultation
        }))
        await supabase.from('services').insert(dbRows)
        return NextResponse.json(dbRows)
      }
      return NextResponse.json(dbData)
    }

    // Fallback to local services.json file if Supabase table is not ready
    if (fs.existsSync(servicesJsonPath)) {
      const data = fs.readFileSync(servicesJsonPath, 'utf8')
      return NextResponse.json(JSON.parse(data))
    }
    
    // Fallback to default CSV
    if (fs.existsSync(defaultCsvPath)) {
      const csvText = fs.readFileSync(defaultCsvPath, 'utf8')
      const parsed = parseCSV(csvText)
      fs.writeFileSync(servicesJsonPath, JSON.stringify(parsed, null, 2), 'utf8')
      return NextResponse.json(parsed)
    }

    return NextResponse.json([])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let csvText = ''
    
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 })
      }
      csvText = await file.text()
    } else {
      csvText = await req.text()
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'Empty CSV content' }, { status: 400 })
    }

    const parsed = parseCSV(csvText)
    if (parsed.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV or no valid rows found' }, { status: 400 })
    }

    // Save parsed services locally
    fs.writeFileSync(servicesJsonPath, JSON.stringify(parsed, null, 2), 'utf8')
    
    // Try to write to Supabase table if it exists
    const dbRows = parsed.map(s => ({
      tenant_id: '395b50b9-9504-4bda-bd38-7ce5b53e7aa0',
      service_type: s.service_type,
      service_label: s.service_label,
      category: s.category,
      duration_min: s.duration_min,
      price_usd: s.price_usd,
      price_note: s.price_note,
      enabled: s.enabled,
      requires_consultation: s.requires_consultation
    }))

    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('tenant_id', '395b50b9-9504-4bda-bd38-7ce5b53e7aa0')

    let supabaseConnected = false
    if (!deleteError) {
      const { error: insertError } = await supabase
        .from('services')
        .insert(dbRows)
      if (!insertError) {
        supabaseConnected = true
      }
    }

    // Real-time synchronization:
    // 1. Map dynamic prices to all matching appointments in the backend database
    let updateStats = { appointmentsUpdated: 0, patientsRecalculated: 0 }
    
    for (const service of parsed) {
      const { data: updatedApts, error: updateError } = await supabase
        .from('appointments')
        .update({ total_amount: service.price_usd })
        .eq('tenant_id', '395b50b9-9504-4bda-bd38-7ce5b53e7aa0')
        .eq('type', service.service_type)
        .select('id')
      
      if (!updateError && updatedApts) {
        updateStats.appointmentsUpdated += updatedApts.length
      }
    }

    // 2. Recalculate patients' total spent (LTV) and average values in the database based on updated appointment prices
    const { data: apts, error: aptError } = await supabase
      .from('appointments')
      .select('patient_id, total_amount')
      .eq('tenant_id', '395b50b9-9504-4bda-bd38-7ce5b53e7aa0')

    if (!aptError && apts) {
      const patientStats: Record<string, { totalSpent: number, count: number }> = {}
      apts.forEach(apt => {
        const pid = apt.patient_id
        if (!pid) return
        if (!patientStats[pid]) {
          patientStats[pid] = { totalSpent: 0, count: 0 }
        }
        patientStats[pid].totalSpent += Number(apt.total_amount || 0)
        patientStats[pid].count += 1
      })

      for (const [patientId, stats] of Object.entries(patientStats)) {
        const avgVal = stats.count > 0 ? stats.totalSpent / stats.count : 0
        const { error: patUpdateError } = await supabase
          .from('patients')
          .update({
            total_spent: stats.totalSpent,
            average_appointment_value: avgVal,
            total_appointments: stats.count
          })
          .eq('id', patientId)
          .eq('tenant_id', '395b50b9-9504-4bda-bd38-7ce5b53e7aa0')
        
        if (!patUpdateError) {
          updateStats.patientsRecalculated++
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: parsed.length, 
      services: parsed,
      supabaseSynced: supabaseConnected,
      updates: updateStats
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
