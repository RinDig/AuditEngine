'use client'

import { useState, useEffect } from 'react'
import { ProgressBar, Button } from '@/components/ui'
import type { Job } from '@/lib/types'
import { formatNumber, formatDuration } from '@/lib/utils'

interface JobProgressProps {
  job: Job
  startTime: Date
  onCancel: () => void
}

export function JobProgress({ job, startTime, onCancel }: JobProgressProps) {
  // Compute initial elapsed time only on mount using a lazy initializer
  const [elapsed, setElapsed] = useState(() => Date.now() - startTime.getTime())

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime.getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const rate =
    job.progress.completed_calls > 0
      ? job.progress.completed_calls / (elapsed / 1000)
      : 0
  const remaining =
    rate > 0
      ? (job.progress.total_calls - job.progress.completed_calls) / rate
      : 0

  const percentComplete = job.progress.total_calls > 0
    ? (job.progress.completed_calls / job.progress.total_calls) * 100
    : 0

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Animated spinner */}
          <div className="w-12 h-12 rounded bg-accent/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Assessment in Progress
            </h2>
            <p className="text-sm text-text-secondary flex items-center gap-2 font-mono">
              <span className="status-dot-loading w-2 h-2 rounded-full" />
              {job.progress.current_phase || 'Initializing...'}
            </p>
          </div>
        </div>
        <Button variant="danger" onClick={onCancel}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </Button>
      </div>

      {/* Progress section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-text-muted uppercase tracking-wide">Progress</span>
          <span className="font-semibold text-accent">{percentComplete.toFixed(1)}%</span>
        </div>
        <ProgressBar
          value={job.progress.completed_calls}
          max={job.progress.total_calls}
          showSegments
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-muted rounded border border-border">
          <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-semibold text-accent font-mono">
            {formatNumber(job.progress.completed_calls)}
          </p>
        </div>
        <div className="p-4 bg-surface-muted rounded border border-border">
          <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Remaining</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {formatNumber(job.progress.total_calls - job.progress.completed_calls)}
          </p>
        </div>
        <div className="p-4 bg-surface-muted rounded border border-border">
          <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Rate</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {rate > 0 ? `${rate.toFixed(1)}/s` : '--'}
          </p>
        </div>
        <div className="p-4 bg-surface-muted rounded border border-border">
          <p className="text-xs text-text-muted font-mono uppercase tracking-wide">ETA</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {remaining > 0 ? formatDuration(remaining * 1000) : '--'}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {job.progress.failed_calls > 0 && (
        <div className="flex items-center gap-3 p-3 bg-status-warning/10 border border-status-warning/20 rounded">
          <svg className="w-5 h-5 text-status-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-status-warning font-mono">
            {job.progress.failed_calls} call{job.progress.failed_calls !== 1 ? 's' : ''}{' '}
            failed (will retry)
          </p>
        </div>
      )}
    </div>
  )
}
