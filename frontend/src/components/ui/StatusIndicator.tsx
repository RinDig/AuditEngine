'use client'

import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'error' | 'neutral' | 'loading'

interface StatusIndicatorProps {
  status: StatusType
  label: string
  className?: string
  showGlow?: boolean
}

export function StatusIndicator({ status, label, className, showGlow = true }: StatusIndicatorProps) {
  const dotStyles = {
    success: showGlow ? 'status-dot-success' : 'bg-status-success',
    warning: showGlow ? 'status-dot-warning' : 'bg-status-warning',
    error: showGlow ? 'status-dot-error' : 'bg-status-error',
    neutral: 'bg-text-muted',
    loading: 'status-dot-loading',
  }

  const labelStyles = {
    success: 'text-status-success',
    warning: 'text-status-warning',
    error: 'text-status-error',
    neutral: 'text-text-muted',
    loading: 'text-accent',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('w-2 h-2 rounded-full', dotStyles[status])} />
      <span className={cn('text-xs font-medium font-mono uppercase tracking-wide', labelStyles[status])}>
        {label}
      </span>
    </div>
  )
}
