'use client'

import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'error' | 'neutral' | 'loading'

interface StatusIndicatorProps {
  status: StatusType
  label: string
  className?: string
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const dotStyles = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    error: 'bg-status-error',
    neutral: 'bg-text-tertiary',
    loading: 'bg-accent animate-pulse',
  }

  const labelStyles = {
    success: 'text-status-success',
    warning: 'text-status-warning',
    error: 'text-status-error',
    neutral: 'text-text-tertiary',
    loading: 'text-accent',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('w-2 h-2 rounded-full', dotStyles[status])} />
      <span className={cn('text-xs font-medium', labelStyles[status])}>
        {label}
      </span>
    </div>
  )
}
