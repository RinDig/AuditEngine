'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import type { Scale } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ScalesSectionProps {
  scales: Scale[]
  selectedScales: string[]
  onSelectionChange: (selected: string[]) => void
  loading?: boolean
  onAddCustom?: () => void
  onRemoveCustom?: (scaleName: string) => void
}

export function ScalesSection({
  scales,
  selectedScales,
  onSelectionChange,
  loading,
  onAddCustom,
  onRemoveCustom,
}: ScalesSectionProps) {
  const [previewScale, setPreviewScale] = useState<Scale | null>(null)

  const toggleScale = (scaleName: string) => {
    if (selectedScales.includes(scaleName)) {
      onSelectionChange(selectedScales.filter((s) => s !== scaleName))
    } else {
      onSelectionChange([...selectedScales, scaleName])
    }
  }

  const totalItems = selectedScales.reduce((sum, name) => {
    const scale = scales.find((s) => s.name === name)
    return sum + (scale?.item_count || 0)
  }, 0)

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="icon-container-gray">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Scale Selection</h3>
              <p className="text-sm text-text-secondary">Loading scales...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container-accent">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Scale Selection</h3>
              <p className="text-sm text-text-secondary">
                {selectedScales.length > 0
                  ? `${selectedScales.length} scale${selectedScales.length !== 1 ? 's' : ''} selected (${totalItems} items)`
                  : 'Select the psychometric scales to include in this assessment'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedScales.length > 0 && (
              <span className="badge-info">
                {totalItems} items total
              </span>
            )}
            {onAddCustom && (
              <button
                type="button"
                onClick={onAddCustom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:text-accent-hover bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Custom
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scales List */}
      <div className="p-6">
        <div className="space-y-3">
          {scales.map((scale) => {
            const isSelected = selectedScales.includes(scale.name)
            const isPreviewOpen = previewScale?.name === scale.name
            const isCustom = scale.name.startsWith('Custom: ')

            return (
              <div
                key={scale.name}
                className={cn(
                  'rounded-xl border-2 transition-all cursor-pointer overflow-hidden',
                  isSelected
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                )}
                onClick={() => toggleScale(scale.name)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                      isSelected
                        ? 'bg-accent text-white'
                        : 'bg-white border-2 border-gray-200'
                    )}>
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-text-primary">
                          {scale.name}
                        </h4>
                        {isCustom && (
                          <span className="badge-info text-xs">Custom</span>
                        )}
                        <span className="badge-neutral text-xs">
                          {scale.item_count} items
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {scale.scale_range[0]}-{scale.scale_range[1]} scale
                        </span>
                      </div>
                      {scale.description && (
                        <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                          {scale.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isCustom && onRemoveCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isSelected) {
                              onSelectionChange(selectedScales.filter((s) => s !== scale.name))
                            }
                            onRemoveCustom(scale.name)
                          }}
                          className="p-1.5 text-text-tertiary hover:text-status-error hover:bg-red-50 rounded transition-colors"
                          title="Remove custom scale"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewScale(isPreviewOpen ? null : scale)
                        }}
                      >
                        <svg className={cn('w-4 h-4 mr-1 transition-transform', isPreviewOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {isPreviewOpen ? 'Hide' : 'Preview'}
                      </Button>
                    </div>
                  </div>
                </div>

                {isPreviewOpen && (
                  <div className="border-t border-gray-100 bg-white p-4">
                    {scale.citation && (
                      <p className="text-xs text-text-tertiary mb-3 italic px-2">
                        {scale.citation}
                      </p>
                    )}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {scale.items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-mono text-text-tertiary bg-white px-1.5 py-0.5 rounded flex-shrink-0">
                              {item.id}
                            </span>
                            <p className="text-text-primary flex-1">{item.text}</p>
                            {item.reverse_score && (
                              <span className="badge-warning text-xs flex-shrink-0">
                                R
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {scale.items.length > 5 && (
                        <p className="text-xs text-text-tertiary text-center py-2 bg-gray-50 rounded-lg">
                          + {scale.items.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {scales.length === 0 && (
            <div className="text-center py-12">
              <div className="icon-container-gray mx-auto mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary">
                No scales available. Check backend connection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
