'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
  showSegments?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  className,
  showSegments = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('space-y-2', className)}>
      <div className="progress-bar relative">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
        {/* Segment markers */}
        {showSegments && (
          <div className="absolute inset-0 flex">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-surface/20 last:border-r-0"
              />
            ))}
          </div>
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-secondary font-mono">
          <span className="text-accent">{Math.round(percentage)}%</span>
          <span>
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}
