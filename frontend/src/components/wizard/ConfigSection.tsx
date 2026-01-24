'use client'

import { Slider, Input } from '@/components/ui'
import { formatNumber, estimateRunTime } from '@/lib/utils'

interface ConfigSectionProps {
  temperature: number
  runsPerItem: number
  totalItems: number
  totalModels: number
  totalPersonas: number
  onTemperatureChange: (value: number) => void
  onRunsPerItemChange: (value: number) => void
}

export function ConfigSection({
  temperature,
  runsPerItem,
  totalItems,
  totalModels,
  totalPersonas,
  onTemperatureChange,
  onRunsPerItemChange,
}: ConfigSectionProps) {
  const totalCalls = totalItems * totalModels * totalPersonas * runsPerItem
  const estimatedTime = estimateRunTime(totalCalls, totalModels > 0 ? 1 : 0)

  return (
    <div className="card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Run Configuration</h3>
            <p className="text-sm text-text-muted font-mono">Configure execution parameters</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Slider
              label="Temperature"
              value={temperature}
              min={0}
              max={1}
              step={0.1}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              valueFormatter={(v) => v.toFixed(1)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Runs per item
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={runsPerItem}
              onChange={(e) =>
                onRunsPerItemChange(
                  Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                )
              }
              className="w-full"
              mono
            />
            <p className="text-xs text-text-muted font-mono">
              Higher values enable variance analysis (1-20)
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-5 bg-surface-muted rounded border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              Assessment Summary
            </h4>
            <span className="badge-accent font-mono">
              {formatNumber(totalCalls)} CALLS
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-surface-raised rounded border border-border">
              <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Items</p>
              <p className="text-2xl font-semibold text-text-primary font-mono">
                {formatNumber(totalItems)}
              </p>
            </div>
            <div className="p-3 bg-surface-raised rounded border border-border">
              <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Models</p>
              <p className="text-2xl font-semibold text-text-primary font-mono">
                {formatNumber(totalModels)}
              </p>
            </div>
            <div className="p-3 bg-surface-raised rounded border border-border">
              <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Personas</p>
              <p className="text-2xl font-semibold text-text-primary font-mono">
                {formatNumber(totalPersonas)}
              </p>
            </div>
            <div className="p-3 bg-surface-raised rounded border border-border">
              <p className="text-xs text-text-muted font-mono uppercase tracking-wide">Runs</p>
              <p className="text-2xl font-semibold text-text-primary font-mono">
                {formatNumber(runsPerItem)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              <p className="text-sm text-text-primary">
                <span className="text-2xl font-bold text-accent font-mono">{formatNumber(totalCalls)}</span>{' '}
                <span className="text-text-secondary">total API calls</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                {totalItems} x {totalModels} x {totalPersonas} x {runsPerItem}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted uppercase tracking-wide font-mono">Est. time</p>
              <p className="text-lg font-bold text-text-primary font-mono">
                {totalCalls > 0 ? estimatedTime : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {temperature > 0 && (
          <div className="flex items-start gap-2 p-3 bg-status-warning/10 border border-status-warning/20 rounded">
            <svg className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-status-warning font-mono">
              Temperature {`>`} 0 introduces randomness. Consider multiple runs per item to measure response variance.
            </p>
          </div>
        )}

        {temperature === 0 && runsPerItem > 1 && (
          <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded">
            <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-accent font-mono">
              With temperature = 0, responses are deterministic. Multiple runs will produce identical results.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
