'use client'

import { useState } from 'react'
import type { Persona } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PersonasSectionProps {
  personas: Persona[]
  selectedPersonas: string[]
  onSelectionChange: (selected: string[]) => void
  loading?: boolean
  onAddCustom?: () => void
  onRemoveCustom?: (personaId: string) => void
  onAIGenerate?: () => void
  hasAIProviders?: boolean
}

export function PersonasSection({
  personas,
  selectedPersonas,
  onSelectionChange,
  loading,
  onAddCustom,
  onRemoveCustom,
  onAIGenerate,
  hasAIProviders = false,
}: PersonasSectionProps) {
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null)

  const togglePersona = (personaId: string) => {
    if (selectedPersonas.includes(personaId)) {
      onSelectionChange(selectedPersonas.filter((p) => p !== personaId))
    } else {
      onSelectionChange([...selectedPersonas, personaId])
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-surface-muted flex items-center justify-center">
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Persona Selection</h3>
              <p className="text-sm text-text-muted font-mono">Loading personas...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Group personas for visual organization
  const baselinePersonas = personas.filter((p) =>
    ['minimal', 'neutral'].includes(p.id)
  )
  const liberalPersonas = personas.filter((p) =>
    p.id.includes('liberal')
  )
  const conservativePersonas = personas.filter((p) =>
    p.id.includes('conservative')
  )
  const customPersonas = personas.filter((p) =>
    p.id.startsWith('custom_')
  )

  const renderPersonaGroup = (
    title: string,
    groupPersonas: Persona[],
    colorClass: string = 'bg-text-muted',
    isCustomGroup: boolean = false
  ) => {
    if (groupPersonas.length === 0) return null

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colorClass}`} />
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
            {title}
          </h4>
          {isCustomGroup && (
            <span className="badge-neutral text-xs font-mono">{groupPersonas.length}</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groupPersonas.map((persona) => {
            const isSelected = selectedPersonas.includes(persona.id)
            const isExpanded = expandedPersona === persona.id
            const isCustom = persona.id.startsWith('custom_')

            return (
              <div
                key={persona.id}
                className={cn(
                  'rounded border transition-all overflow-hidden',
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface-muted hover:border-border-focus hover:bg-surface-hover'
                )}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => togglePersona(persona.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                      isSelected
                        ? 'bg-accent text-surface'
                        : 'bg-surface border border-border'
                    )}>
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-text-primary">
                            {persona.name}
                          </h4>
                          {isCustom && (
                            <span className="badge-accent text-xs">CUSTOM</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isCustom && onRemoveCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Deselect if selected
                                if (isSelected) {
                                  onSelectionChange(selectedPersonas.filter((p) => p !== persona.id))
                                }
                                onRemoveCustom(persona.id)
                              }}
                              className="p-1 text-text-muted hover:text-status-error hover:bg-status-error/10 rounded transition-colors"
                              title="Remove custom persona"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          {persona.prompt_prefix && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedPersona(
                                  isExpanded ? null : persona.id
                                )
                              }}
                              className="text-xs font-mono font-medium text-text-muted hover:text-accent flex items-center gap-1 uppercase"
                            >
                              <svg className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {isExpanded ? 'Hide' : 'Prompt'}
                            </button>
                          )}
                        </div>
                      </div>
                      {persona.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {persona.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && persona.prompt_prefix && (
                  <div className="px-4 pb-4 border-t border-border bg-surface-raised">
                    <div className="pt-3">
                      <p className="text-xs font-mono text-text-muted mb-2 uppercase tracking-wide">
                        Prompt prefix:
                      </p>
                      <div className="p-3 bg-surface-muted rounded border border-border text-xs font-mono text-text-secondary">
                        {persona.prompt_prefix || '(none)'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Persona Selection</h3>
              <p className="text-sm text-text-muted font-mono">
                {selectedPersonas.length > 0
                  ? `${selectedPersonas.length} persona${selectedPersonas.length !== 1 ? 's' : ''} selected`
                  : 'Select ideological framings to test'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedPersonas.length > 0 && (
              <span className="badge-info font-mono">
                {selectedPersonas.length} SELECTED
              </span>
            )}
            {onAIGenerate && hasAIProviders && (
              <button
                type="button"
                onClick={onAIGenerate}
                className="btn-outline px-3 py-1.5 text-xs"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Generate
              </button>
            )}
            {onAddCustom && (
              <button
                type="button"
                onClick={onAddCustom}
                className="btn-outline px-3 py-1.5 text-xs"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Custom
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {renderPersonaGroup('Baseline', baselinePersonas, 'bg-text-muted')}
          {renderPersonaGroup('Liberal Spectrum', liberalPersonas, 'bg-blue-500')}
          {renderPersonaGroup('Conservative Spectrum', conservativePersonas, 'bg-red-500')}
          {renderPersonaGroup('Custom Personas', customPersonas, 'bg-accent', true)}

          {/* Add Custom CTA when no custom personas */}
          {customPersonas.length === 0 && onAddCustom && (
            <div className="border border-dashed border-border rounded p-6 text-center hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer"
              onClick={onAddCustom}
            >
              <div className="w-12 h-12 rounded bg-surface-muted flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">Add Custom Persona</p>
              <p className="text-xs text-text-muted font-mono">
                Create your own ideological framing with a custom prompt prefix
              </p>
            </div>
          )}

          {personas.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded bg-surface-muted flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary font-mono">
                No personas available. Check backend connection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
