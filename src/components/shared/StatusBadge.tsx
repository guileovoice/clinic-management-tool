import { AppointmentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
  },
  PAID: {
    label: 'Paid',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/20'
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-violet-500/20 text-violet-400 border-violet-500/20'
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
  },
  NO_SHOW: {
    label: 'No Show',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/20'
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-500/20 text-red-400 border-red-500/20'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}
