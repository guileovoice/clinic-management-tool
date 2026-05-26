'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useClinicStore } from '@/lib/stores/clinicStore'
import { 
  format, 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  addMonths, 
  startOfWeek, 
  isSameMonth, 
  isSameDay, 
  isWithinInterval, 
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useClinicStore()
  const [isOpen, setIsOpen] = useState(false)
  const [tempStart, setTempStart] = useState(dateRange.start)
  const [tempEnd, setTempEnd] = useState(dateRange.end)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  
  // Left calendar's month
  const [leftMonth, setLeftMonth] = useState<Date>(() => startOfMonth(dateRange.start ? parseISO(dateRange.start) : new Date()))
  const rightMonth = addMonths(leftMonth, 1)

  // Track active preset
  const [activePreset, setActivePreset] = useState<string>('Today')

  // Synchronize internal state with store when popover opens
  useEffect(() => {
    if (isOpen) {
      setTempStart(dateRange.start)
      setTempEnd(dateRange.end)
      const parsed = dateRange.start ? parseISO(dateRange.start) : new Date()
      if (!isNaN(parsed.getTime())) {
        setLeftMonth(startOfMonth(parsed))
      }
    }
  }, [isOpen, dateRange])

  const presets = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date()
        const str = today.toISOString().split('T')[0]
        return { start: str, end: str }
      }
    },
    {
      label: 'Last 7 days',
      getValue: () => {
        const today = new Date()
        const start = subDays(today, 6).toISOString().split('T')[0]
        const end = today.toISOString().split('T')[0]
        return { start, end }
      }
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const today = new Date()
        const start = subDays(today, 29).toISOString().split('T')[0]
        const end = today.toISOString().split('T')[0]
        return { start, end }
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const today = new Date()
        const start = startOfMonth(today).toISOString().split('T')[0]
        const end = endOfMonth(today).toISOString().split('T')[0]
        return { start, end }
      }
    },
    {
      label: 'Last 3 Months',
      getValue: () => {
        const today = new Date()
        const start = startOfMonth(subMonths(today, 2)).toISOString().split('T')[0]
        const end = endOfMonth(today).toISOString().split('T')[0]
        return { start, end }
      }
    },
    {
      label: 'Last 6 Months',
      getValue: () => {
        const today = new Date()
        const start = startOfMonth(subMonths(today, 5)).toISOString().split('T')[0]
        const end = endOfMonth(today).toISOString().split('T')[0]
        return { start, end }
      }
    },
    {
      label: 'Last 1 year',
      getValue: () => {
        const today = new Date()
        const start = startOfMonth(subMonths(today, 11)).toISOString().split('T')[0]
        const end = endOfMonth(today).toISOString().split('T')[0]
        return { start, end }
      }
    },
    {
      label: 'Custom Range',
      getValue: null
    }
  ]

  const handlePresetClick = (preset: typeof presets[0]) => {
    setActivePreset(preset.label)
    if (preset.getValue) {
      const { start, end } = preset.getValue()
      setTempStart(start)
      setTempEnd(end)
      setLeftMonth(startOfMonth(parseISO(start)))
    }
  }

  const handlePrevMonth = () => {
    setLeftMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setLeftMonth(prev => addMonths(prev, 1))
  }

  const handleDayClick = (day: Date) => {
    const dateStr = day.toISOString().split('T')[0]
    
    // Switch to Custom Range preset
    setActivePreset('Custom Range')

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr)
      setTempEnd('')
    } else {
      if (dateStr < tempStart) {
        setTempStart(dateStr)
        setTempEnd('')
      } else {
        setTempEnd(dateStr)
      }
    }
  }

  const handleApply = () => {
    if (tempStart && tempEnd) {
      setDateRange({ start: tempStart, end: tempEnd })
    } else if (tempStart) {
      setDateRange({ start: tempStart, end: tempStart })
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const handleClear = () => {
    const today = new Date()
    const start = subDays(today, 6).toISOString().split('T')[0]
    const end = today.toISOString().split('T')[0]
    setDateRange({ start, end })
    setTempStart(start)
    setTempEnd(end)
    setActivePreset('Last 7 days')
    setLeftMonth(startOfMonth(today))
    setIsOpen(false)
  }

  const displayLabel = () => {
    if (!dateRange.start && !dateRange.end) return 'All time'
    const s = parseISO(dateRange.start)
    if (isNaN(s.getTime())) return 'Invalid date'
    if (!dateRange.end) {
      return format(s, 'MMMM d, yyyy') + ' –'
    }
    const e = parseISO(dateRange.end)
    if (isNaN(e.getTime())) return format(s, 'MMMM d, yyyy') + ' –'
    if (isSameDay(s, e)) {
      return format(s, 'MMMM d, yyyy')
    }
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
  }

  const getDaysForMonth = (monthDate: Date) => {
    const start = startOfWeek(startOfMonth(monthDate))
    const days = []
    let curr = start
    for (let i = 0; i < 42; i++) {
      days.push(new Date(curr))
      curr = addDays(curr, 1)
    }
    return days
  }

  const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const d = startOfDay(date)
    const s = startOfDay(parseISO(startStr))
    const e = endOfDay(parseISO(endStr))
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false
    return isWithinInterval(d, { start: s, end: e })
  }

  const isDateInHoverRange = (date: Date, startStr: string, hoverStr: string | null) => {
    if (!hoverStr) return false
    const d = startOfDay(date)
    const s = startOfDay(parseISO(startStr))
    const h = startOfDay(parseISO(hoverStr))
    if (isNaN(s.getTime()) || isNaN(h.getTime())) return false
    if (h < s) return false
    return isWithinInterval(d, { start: s, end: h })
  }

  const renderCalendarMonth = (monthDate: Date, showPrevArrow = false, showNextArrow = false) => {
    const isValid = monthDate && !isNaN(monthDate.getTime())
    const days = isValid ? getDaysForMonth(monthDate) : []
    const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    return (
      <div className="w-[280px]">
        {/* Month Header */}
        <div className="flex items-center justify-between h-9 mb-4 px-1 relative">
          {showPrevArrow ? (
            <button 
              onClick={handlePrevMonth} 
              className="p-1 rounded-lg hover:bg-surface2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6 h-6" />
          )}

          <span className="text-xs font-bold text-text-primary uppercase tracking-wider absolute left-1/2 -translate-x-1/2">
            {isValid ? format(monthDate, 'MMMM yyyy') : '—'}
          </span>

          {showNextArrow ? (
            <button 
              onClick={handleNextMonth} 
              className="p-1 rounded-lg hover:bg-surface2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6 h-6" />
          )}
        </div>

        {/* Weekdays Row */}
        <div className="grid grid-cols-7 gap-y-1 mb-2 text-center">
          {weekdayNames.map((name) => (
            <span key={name} className="text-[10px] font-bold text-text-muted/60 uppercase tracking-widest h-6 flex items-center justify-center">
              {name}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {days.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0]
            const isCurrentMonth = isValid && isSameMonth(day, monthDate)
            const isSelectedStart = tempStart && dateStr === tempStart
            const isSelectedEnd = tempEnd && dateStr === tempEnd
            
            let isInRange = false
            if (tempStart && tempEnd) {
              isInRange = isDateInRange(day, tempStart, tempEnd)
            } else if (tempStart && hoveredDate) {
              isInRange = isDateInHoverRange(day, tempStart, hoveredDate)
            }

            const isEdge = isSelectedStart || isSelectedEnd

            return (
              <div 
                key={idx}
                className={`h-8 relative flex items-center justify-center ${
                  isInRange && !isEdge ? 'bg-primary/10' : ''
                } ${
                  isSelectedStart && tempEnd ? 'bg-primary/10 rounded-l-full' : ''
                } ${
                  isSelectedEnd && tempStart ? 'bg-primary/10 rounded-r-full' : ''
                }`}
                onMouseEnter={() => {
                  if (tempStart && !tempEnd) {
                    setHoveredDate(dateStr)
                  }
                }}
                onMouseLeave={() => {
                  if (tempStart && !tempEnd) {
                    setHoveredDate(null)
                  }
                }}
              >
                <button
                  onClick={() => handleDayClick(day)}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    isEdge 
                      ? 'bg-primary text-white font-bold shadow-md shadow-primary/20 z-20' 
                      : isInRange 
                        ? 'text-text-primary z-10' 
                        : isCurrentMonth 
                          ? 'text-text-primary hover:bg-surface2' 
                          : 'text-text-muted/30 hover:bg-surface2/10'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-border bg-surface hover:bg-surface2 text-text-primary gap-2 text-xs font-bold h-9 shrink-0 px-4 rounded-xl cursor-pointer"
        >
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-semibold">{displayLabel()}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-auto p-0 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col md:flex-row"
      >
        {/* Left Sidebar Presets */}
        <div className="w-44 border-r border-border p-3 flex flex-col gap-1 bg-surface2/30 shrink-0">
          {presets.map((preset) => {
            const isActive = activePreset === preset.label
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-muted hover:bg-surface2 hover:text-text-primary'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {/* Right Calendar Section */}
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {renderCalendarMonth(leftMonth, true, false)}
            {renderCalendarMonth(rightMonth, false, true)}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-surface shrink-0">
            <button
              onClick={handleClear}
              className="text-xs font-bold text-danger hover:underline cursor-pointer"
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
