'use client'

import type { ProviderType } from '@/lib/types'
import { PROVIDERS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface APIKeyState {
  key: string
  status: 'idle' | 'validating' | 'valid' | 'invalid'
  models?: string[]
}

interface ModelsSectionProps {
  apiKeys: Record<ProviderType, APIKeyState>
  selectedModels: string[]
  onSelectionChange: (selected: string[]) => void
}

export function ModelsSection({
  apiKeys,
  selectedModels,
  onSelectionChange,
}: ModelsSectionProps) {
  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      onSelectionChange(selectedModels.filter((m) => m !== model))
    } else {
      onSelectionChange([...selectedModels, model])
    }
  }

  const selectAllForProvider = (provider: ProviderType) => {
    const providerModels = apiKeys[provider].models || []
    const allSelected = providerModels.every((m) => selectedModels.includes(m))

    if (allSelected) {
      onSelectionChange(
        selectedModels.filter((m) => !providerModels.includes(m))
      )
    } else {
      const newModels = providerModels.filter((m) => !selectedModels.includes(m))
      onSelectionChange([...selectedModels, ...newModels])
    }
  }

  // Group models by provider
  const connectedProviders = PROVIDERS.filter(
    (p) => apiKeys[p.id]?.status === 'valid'
  )

  const noProvidersConnected = connectedProviders.length === 0

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container-accent">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Model Selection</h3>
              <p className="text-sm text-text-secondary">
                {selectedModels.length > 0
                  ? `${selectedModels.length} model${selectedModels.length !== 1 ? 's' : ''} selected`
                  : noProvidersConnected
                    ? 'Connect API keys above to see available models'
                    : 'Select models to include in this assessment'}
              </p>
            </div>
          </div>
          {selectedModels.length > 0 && (
            <span className="badge-info">
              {selectedModels.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {noProvidersConnected ? (
          <div className="text-center py-12">
            <div className="icon-container-gray mx-auto mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary mb-2">No providers connected</p>
            <p className="text-xs text-text-tertiary">
              Configure and validate API keys above to see available models.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {connectedProviders.map((provider) => {
              const keyState = apiKeys[provider.id]
              const models = keyState.models || provider.models

              if (models.length === 0) return null

              const selectedCount = models.filter((m) =>
                selectedModels.includes(m)
              ).length
              const allSelected = selectedCount === models.length

              return (
                <div key={provider.id} className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">
                          {provider.name}
                        </h4>
                        <p className="text-xs text-text-secondary">
                          {selectedCount} of {models.length} selected
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectAllForProvider(provider.id)}
                      className="text-xs font-medium text-accent hover:text-accent-hover px-3 py-1.5 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {models.map((model) => {
                      const isSelected = selectedModels.includes(model)
                      return (
                        <div
                          key={model}
                          onClick={() => toggleModel(model)}
                          className={cn(
                            'p-3 rounded-xl border-2 cursor-pointer transition-all',
                            isSelected
                              ? 'border-accent bg-accent/5'
                              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all',
                              isSelected
                                ? 'bg-accent text-white'
                                : 'bg-white border-2 border-gray-200'
                            )}>
                              {isSelected && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs text-text-primary font-mono truncate">
                              {model}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
