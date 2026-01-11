'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import type { Persona, ProviderType } from '@/lib/types'
import { generatePersonas } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AIPersonaGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (personas: Persona[]) => void
  availableProviders: { provider: ProviderType; apiKey: string; baseUrl?: string }[]
}

export function AIPersonaGeneratorModal({
  isOpen,
  onClose,
  onAdd,
  availableProviders,
}: AIPersonaGeneratorModalProps) {
  const [description, setDescription] = useState('')
  const [count, setCount] = useState(3)
  const [selectedProvider, setSelectedProvider] = useState<string>(
    availableProviders[0]?.provider || 'openai'
  )
  const [generating, setGenerating] = useState(false)
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([])
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const providerConfig = availableProviders.find((p) => p.provider === selectedProvider)

  const handleGenerate = async () => {
    if (!description.trim() || !providerConfig) return

    setError(null)
    setGenerating(true)
    setGeneratedPersonas([])
    setSelectedToAdd(new Set())

    try {
      const response = await generatePersonas({
        description: description.trim(),
        count,
        provider: selectedProvider === 'anthropic' ? 'anthropic' : 'openai',
        api_key: providerConfig.apiKey,
        base_url: providerConfig.baseUrl,
      })

      setGeneratedPersonas(response.personas)
      // Auto-select all generated personas
      setSelectedToAdd(new Set(response.personas.map((p) => p.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate personas')
    } finally {
      setGenerating(false)
    }
  }

  const togglePersona = (personaId: string) => {
    const newSelected = new Set(selectedToAdd)
    if (newSelected.has(personaId)) {
      newSelected.delete(personaId)
    } else {
      newSelected.add(personaId)
    }
    setSelectedToAdd(newSelected)
  }

  const handleAddSelected = () => {
    const personasToAdd = generatedPersonas.filter((p) => selectedToAdd.has(p.id))
    onAdd(personasToAdd)
    handleClose()
  }

  const handleClose = () => {
    setDescription('')
    setCount(3)
    setGeneratedPersonas([])
    setSelectedToAdd(new Set())
    setError(null)
    onClose()
  }

  const noProviders = availableProviders.length === 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="AI Persona Generator"
      description="Describe a persona type and get AI-generated variations"
      size="xl"
    >
      <div className="space-y-5">
        {noProviders ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <svg className="w-10 h-10 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="font-semibold text-amber-800 mb-1">No API Keys Connected</h4>
            <p className="text-sm text-amber-700">
              Connect an OpenAI or Anthropic API key to use AI persona generation.
            </p>
          </div>
        ) : (
          <>
            {/* Description Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Describe the persona type
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., A scientist who is skeptical about claims that lack empirical evidence, values peer review, and takes a measured approach to new information"
                className="input-base min-h-[100px] resize-none"
                rows={3}
                disabled={generating}
              />
              <p className="text-xs text-text-tertiary">
                Be specific! The AI will generate variations based on your description.
              </p>
            </div>

            {/* Options Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  AI Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="input-base"
                  disabled={generating}
                >
                  {availableProviders.map((p) => (
                    <option key={p.provider} value={p.provider}>
                      {p.provider === 'openai' ? 'OpenAI' : p.provider === 'anthropic' ? 'Anthropic' : p.provider}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count Selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  Number of variations
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="input-base"
                  disabled={generating}
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} personas
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={!description.trim() || generating}
              loading={generating}
              className="w-full"
            >
              {generating ? (
                'Generating personas...'
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Personas
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Generated Personas */}
            {generatedPersonas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-text-primary">
                    Generated Personas
                  </h4>
                  <span className="text-xs text-text-tertiary">
                    {selectedToAdd.size} of {generatedPersonas.length} selected
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {generatedPersonas.map((persona) => {
                    const isSelected = selectedToAdd.has(persona.id)
                    return (
                      <div
                        key={persona.id}
                        onClick={() => togglePersona(persona.id)}
                        className={cn(
                          'p-4 rounded-xl border-2 cursor-pointer transition-all',
                          isSelected
                            ? 'border-accent bg-accent/5'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                            isSelected
                              ? 'bg-accent text-white'
                              : 'bg-white border-2 border-gray-300'
                          )}>
                            {isSelected && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-text-primary">
                              {persona.name}
                            </h5>
                            {persona.description && (
                              <p className="text-xs text-text-secondary mt-0.5">
                                {persona.description}
                              </p>
                            )}
                            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs text-text-tertiary">
                                <span className="font-medium">Prompt:</span> {persona.prompt_prefix}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          {generatedPersonas.length > 0 && (
            <Button
              variant="primary"
              onClick={handleAddSelected}
              disabled={selectedToAdd.size === 0}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add {selectedToAdd.size} Persona{selectedToAdd.size !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
