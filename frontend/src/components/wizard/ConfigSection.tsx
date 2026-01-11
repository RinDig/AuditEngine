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
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="icon-container-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Run Configuration</h3>
            <p className="text-sm text-text-secondary">Fine-tune your assessment parameters</p>
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
            />
            <p className="text-xs text-text-tertiary">
              Higher values enable variance analysis (1-20)
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              Assessment Summary
            </h4>
            <span className="badge-neutral">
              {formatNumber(totalCalls)} calls
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="stat-label">Items</p>
              <p className="stat-value text-2xl">
                {formatNumber(totalItems)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Models</p>
              <p className="stat-value text-2xl">
                {formatNumber(totalModels)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Personas</p>
              <p className="stat-value text-2xl">
                {formatNumber(totalPersonas)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Runs</p>
              <p className="stat-value text-2xl">
                {formatNumber(runsPerItem)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
            <div>
              <p className="text-sm text-text-primary">
                <span className="text-lg font-bold text-accent-gradient">{formatNumber(totalCalls)}</span>{' '}
                <span className="text-text-secondary">total API calls</span>
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {totalItems} x {totalModels} x {totalPersonas} x {runsPerItem}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Est. time</p>
              <p className="text-lg font-bold text-text-primary">
                {totalCalls > 0 ? estimatedTime : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {temperature > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/50 rounded-lg">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700">
              Temperature {`>`} 0 introduces randomness. Consider multiple runs per item to measure response variance.
            </p>
          </div>
        )}

        {temperature === 0 && runsPerItem > 1 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200/50 rounded-lg">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">
              With temperature = 0, responses are deterministic. Multiple runs will produce identical results.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
