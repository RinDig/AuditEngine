'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button, Input, Slider } from '@/components/ui'
import {
  createVisualJob,
  fetchVisualJob,
  fetchVisualJobSummary,
  getVisualResultsDownloadUrl,
} from '@/lib/api'
import type {
  Persona,
  ProviderType,
  VisualJob,
  VisualJobSummary,
} from '@/lib/types'
import { PROVIDERS, VISION_MODELS as VisionModels } from '@/lib/types'
import { CustomPersonaModal } from './CustomPersonaModal'
import { AIPersonaGeneratorModal } from './AIPersonaGeneratorModal'
import { cn } from '@/lib/utils'

interface APIKeyState {
  key: string
  baseUrl?: string
  status: 'idle' | 'validating' | 'valid' | 'invalid'
  error?: string
  models?: string[]
}

interface VisualAssessmentProps {
  apiKeys: Record<ProviderType, APIKeyState>
}

// Built-in minimal persona for visual assessment
const MINIMAL_PERSONA: Persona = {
  id: 'minimal',
  name: 'Minimal',
  description: 'No specific framing - raw model response',
  prompt_prefix: '',
}

export function VisualAssessment({ apiKeys }: VisualAssessmentProps) {
  // Image state
  const [imageData, setImageData] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDescription, setImageDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configuration
  const [prompt, setPrompt] = useState('What do you see in this image?')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['minimal'])
  const [temperature, setTemperature] = useState(0.7)
  const [runsPerModel, setRunsPerModel] = useState(1)

  // Custom personas state
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([])
  const [showCustomPersonaModal, setShowCustomPersonaModal] = useState(false)
  const [showAIPersonaModal, setShowAIPersonaModal] = useState(false)

  // Combine built-in minimal with custom personas
  const allPersonas = useMemo(() => {
    return [MINIMAL_PERSONA, ...customPersonas]
  }, [customPersonas])

  // Job state
  const [currentJob, setCurrentJob] = useState<VisualJob | null>(null)
  const [jobSummary, setJobSummary] = useState<VisualJobSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State management
  type ViewState = 'configure' | 'running' | 'results'
  const [viewState, setViewState] = useState<ViewState>('configure')

  // Get AI-capable providers for persona generation
  const aiProviders = useMemo(() => {
    return (['openai', 'anthropic'] as ProviderType[])
      .filter((p) => apiKeys[p]?.status === 'valid')
      .map((p) => ({
        provider: p,
        apiKey: apiKeys[p].key,
        baseUrl: apiKeys[p].baseUrl,
      }))
  }, [apiKeys])

  // Handlers for custom personas
  const handleAddCustomPersona = (persona: Persona) => {
    setCustomPersonas((prev) => [...prev, persona])
  }

  const handleAddGeneratedPersonas = (personas: Persona[]) => {
    setCustomPersonas((prev) => [...prev, ...personas])
  }

  const handleRemoveCustomPersona = (personaId: string) => {
    setCustomPersonas((prev) => prev.filter((p) => p.id !== personaId))
    setSelectedPersonas((prev) => prev.filter((id) => id !== personaId))
  }

  // Get available vision models based on validated API keys
  const availableVisionModels = useCallback(() => {
    const models: { provider: ProviderType; model: string }[] = []

    for (const [providerKey, keyState] of Object.entries(apiKeys)) {
      const provider = providerKey as ProviderType
      if (keyState.status === 'valid') {
        const visionModels = VisionModels[provider] || []
        for (const model of visionModels) {
          models.push({ provider, model })
        }
      }
    }

    return models
  }, [apiKeys])

  // Get connected providers with vision models
  const connectedVisionProviders = useCallback(() => {
    return PROVIDERS.filter(p => {
      const keyState = apiKeys[p.id]
      const visionModels = VisionModels[p.id] || []
      return keyState?.status === 'valid' && visionModels.length > 0
    })
  }, [apiKeys])

  // Select/deselect all models for a provider
  const selectAllForProvider = (providerId: ProviderType) => {
    const providerModels = VisionModels[providerId] || []
    const allSelected = providerModels.every((m) => selectedModels.includes(m))

    if (allSelected) {
      setSelectedModels(prev => prev.filter((m) => !providerModels.includes(m)))
    } else {
      const newModels = providerModels.filter((m) => !selectedModels.includes(m))
      setSelectedModels(prev => [...prev, ...newModels])
    }
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageData(dataUrl)
      setImagePreview(dataUrl)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setImageData(dataUrl)
        setImagePreview(dataUrl)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  // Toggle model selection
  const toggleModel = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    )
  }

  // Toggle persona selection
  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev =>
      prev.includes(personaId)
        ? prev.filter(p => p !== personaId)
        : [...prev, personaId]
    )
  }

  // Submit visual assessment
  const handleSubmit = async () => {
    if (!imageData || selectedModels.length === 0 || selectedPersonas.length === 0) {
      setError('Please upload an image and select at least one model and persona')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Build API keys list for selected providers
      const selectedProviders = new Set(
        availableVisionModels()
          .filter(m => selectedModels.includes(m.model))
          .map(m => m.provider)
      )

      const apiKeysList = Array.from(selectedProviders).map(provider => ({
        provider,
        api_key: apiKeys[provider].key,
        base_url: apiKeys[provider].baseUrl,
      }))

      // Get custom personas that are selected
      const selectedCustomPersonas = customPersonas.filter((p) =>
        selectedPersonas.includes(p.id)
      )

      const response = await createVisualJob({
        config: {
          models: selectedModels,
          personas: selectedPersonas,
          prompt,
          runs_per_model: runsPerModel,
          temperature,
        },
        api_keys: apiKeysList,
        image_data: imageData,
        image_description: imageDescription || undefined,
        custom_personas: selectedCustomPersonas.length > 0 ? selectedCustomPersonas : undefined,
      })

      setCurrentJob(response.job)
      setViewState('running')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment')
    } finally {
      setSubmitting(false)
    }
  }

  // Poll for job updates
  useEffect(() => {
    if (viewState !== 'running' || !currentJob) return

    const pollInterval = setInterval(async () => {
      try {
        const { job } = await fetchVisualJob(currentJob.id)
        setCurrentJob(job)

        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(pollInterval)
          if (job.status === 'completed') {
            const summary = await fetchVisualJobSummary(job.id)
            setJobSummary(summary)
          }
          setViewState('results')
        }
      } catch (err) {
        console.error('Failed to poll job:', err)
      }
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [viewState, currentJob])

  // Reset for new assessment
  const handleReset = () => {
    setImageData(null)
    setImagePreview(null)
    setImageDescription('')
    setPrompt('What do you see in this image?')
    setSelectedModels([])
    setSelectedPersonas(['minimal'])
    setCurrentJob(null)
    setJobSummary(null)
    setViewState('configure')
    setError(null)
  }

  const canSubmit = imageData && selectedModels.length > 0 && selectedPersonas.length > 0

  // Configuration View
  if (viewState === 'configure') {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Image Upload Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Image Upload</h3>
              <p className="text-sm text-text-muted font-mono">Upload visual stimulus for assessment</p>
            </div>
          </div>

          {!imagePreview ? (
            <div
              className="border border-dashed border-border rounded p-8 text-center hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-12 h-12 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-text-secondary mb-2">Drag and drop an image, or click to browse</p>
              <p className="text-xs text-text-muted font-mono">Supports JPEG, PNG, GIF, WebP (max 10MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Uploaded preview"
                  className="max-h-64 rounded border border-border"
                />
                <button
                  onClick={() => {
                    setImageData(null)
                    setImagePreview(null)
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-status-error text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <Input
                  label="Image Description (optional)"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="e.g., Rorschach inkblot test card #1"
                  hint="For your records - not sent to the model"
                  mono
                />
              </div>
            </div>
          )}
        </div>

        {/* Prompt Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Prompt</h3>
              <p className="text-sm text-text-muted font-mono">Define the question for each model</p>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What do you see in this image?"
            rows={3}
            className="input w-full resize-none font-mono"
          />
          <p className="text-xs text-text-muted mt-2 font-mono">
            This prompt will be sent with the image to each model. The persona prefix will be prepended.
          </p>
        </div>

        {/* Model Selection */}
        <div className="card">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Vision-Capable Models</h3>
                  <p className="text-sm text-text-muted font-mono">
                    {selectedModels.length > 0
                      ? `${selectedModels.length} model${selectedModels.length !== 1 ? 's' : ''} selected`
                      : connectedVisionProviders().length === 0
                        ? 'Connect API keys to see available models'
                        : 'Select models to evaluate'}
                  </p>
                </div>
              </div>
              {selectedModels.length > 0 && (
                <span className="badge-info font-mono">
                  {selectedModels.length} SELECTED
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {connectedVisionProviders().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded bg-surface-muted flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary mb-2">No vision-capable providers connected</p>
                <p className="text-xs text-text-muted font-mono">
                  Add API keys for OpenAI, Anthropic, Gemini, or Groq to see vision models.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {connectedVisionProviders().map((provider) => {
                  const models = VisionModels[provider.id] || []
                  if (models.length === 0) return null

                  const selectedCount = models.filter((m) => selectedModels.includes(m)).length
                  const allSelected = selectedCount === models.length

                  return (
                    <div key={provider.id} className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary">
                              {provider.name}
                            </h4>
                            <p className="text-xs text-text-muted font-mono">
                              {selectedCount} of {models.length} selected
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectAllForProvider(provider.id)}
                          className="text-xs font-mono font-medium text-accent hover:text-accent-hover px-3 py-1.5 rounded hover:bg-accent/10 transition-colors uppercase tracking-wide"
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
                                'p-3 rounded border cursor-pointer transition-all',
                                isSelected
                                  ? 'border-accent bg-accent/10'
                                  : 'border-border bg-surface-muted hover:border-border-focus hover:bg-surface-hover'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all',
                                  isSelected
                                    ? 'bg-accent text-surface'
                                    : 'bg-surface border border-border'
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

        {/* Persona Selection */}
        <div className="card">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Personas</h3>
                  <p className="text-sm text-text-muted font-mono">
                    {selectedPersonas.length > 0
                      ? `${selectedPersonas.length} persona${selectedPersonas.length !== 1 ? 's' : ''} selected`
                      : 'Select personas to frame the responses'}
                  </p>
                </div>
              </div>
              {selectedPersonas.length > 0 && (
                <span className="badge-info font-mono">
                  {selectedPersonas.length} SELECTED
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Add Persona Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomPersonaModal(true)}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Custom Persona
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIPersonaModal(true)}
                disabled={aiProviders.length === 0}
                title={aiProviders.length === 0 ? 'Connect an OpenAI or Anthropic API key to use AI persona generation' : undefined}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Generate Personas
              </Button>
            </div>

            {/* Persona List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allPersonas.map((persona) => {
                const isCustom = persona.id.startsWith('custom_') || persona.id.startsWith('ai_')
                const isSelected = selectedPersonas.includes(persona.id)

                return (
                  <div
                    key={persona.id}
                    className={cn(
                      'relative p-4 rounded border cursor-pointer transition-all',
                      isSelected
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface-muted hover:border-border-focus hover:bg-surface-hover'
                    )}
                    onClick={() => togglePersona(persona.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                        isSelected
                          ? 'bg-accent text-surface'
                          : 'bg-surface border border-border'
                      )}>
                        {isSelected && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {persona.name}
                          </p>
                          {isCustom && (
                            <span className="badge-accent text-xs">CUSTOM</span>
                          )}
                        </div>
                        {persona.description && (
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                            {persona.description}
                          </p>
                        )}
                        {persona.prompt_prefix && (
                          <p className="text-xs text-text-muted mt-1 line-clamp-2 italic font-mono">
                            &ldquo;{persona.prompt_prefix}&rdquo;
                          </p>
                        )}
                      </div>
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveCustomPersona(persona.id)
                          }}
                          className="w-6 h-6 rounded-full bg-surface-hover hover:bg-status-error/20 flex items-center justify-center text-text-muted hover:text-status-error transition-colors"
                          title="Remove persona"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tip */}
            <p className="text-xs text-text-muted mt-4 font-mono">
              Tip: The Minimal persona sends the prompt without any framing. Add custom personas to test different perspectives.
            </p>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Options</h3>
              <p className="text-sm text-text-muted font-mono">Configure assessment parameters</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Slider
              label="Temperature"
              value={temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              valueFormatter={(v) => v.toFixed(1)}
            />
            <Slider
              label="Runs per Model"
              value={runsPerModel}
              min={1}
              max={5}
              step={1}
              onChange={(e) => setRunsPerModel(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded text-status-error text-sm font-mono">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            disabled={!canSubmit || submitting}
            loading={submitting}
            onClick={handleSubmit}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Visual Assessment
          </Button>
        </div>

        {/* Custom Persona Modal */}
        <CustomPersonaModal
          isOpen={showCustomPersonaModal}
          onClose={() => setShowCustomPersonaModal(false)}
          onAdd={handleAddCustomPersona}
          existingIds={allPersonas.map((p) => p.id)}
        />

        {/* AI Persona Generator Modal */}
        <AIPersonaGeneratorModal
          isOpen={showAIPersonaModal}
          onClose={() => setShowAIPersonaModal(false)}
          onAdd={handleAddGeneratedPersonas}
          availableProviders={aiProviders}
        />
      </div>
    )
  }

  // Running View
  if (viewState === 'running' && currentJob) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded bg-accent/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Visual Assessment Running
            </h3>
            <p className="text-text-secondary mb-6 font-mono">
              {currentJob.progress.current_phase || 'Starting...'}
            </p>

            {/* Progress bar */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-text-muted mb-2 font-mono">
                <span>{currentJob.progress.completed_calls} / {currentJob.progress.total_calls}</span>
                <span className="text-accent">{currentJob.progress.percent_complete.toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${currentJob.progress.percent_complete}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Results View
  if (viewState === 'results' && currentJob) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Status Banner */}
        <div className={`card p-6 ${currentJob.status === 'completed' ? 'border-status-success/30' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded flex items-center justify-center ${
                currentJob.status === 'completed' ? 'bg-status-success/20' : 'bg-status-error/20'
              }`}>
                {currentJob.status === 'completed' ? (
                  <svg className="w-6 h-6 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {currentJob.status === 'completed' ? 'Visual Assessment Complete' : 'Assessment Failed'}
                </h2>
                {jobSummary && (
                  <p className="text-sm text-text-muted font-mono">
                    {jobSummary.total_responses} responses, {jobSummary.total_tokens} tokens
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleReset}>
              New Assessment
            </Button>
          </div>

          {currentJob.error && (
            <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 rounded text-status-error text-sm font-mono">
              {currentJob.error}
            </div>
          )}
        </div>

        {/* Responses */}
        {jobSummary && jobSummary.responses.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Responses</h3>
            <div className="space-y-4">
              {jobSummary.responses.map((response, index) => (
                <div key={index} className="p-4 bg-surface-muted rounded border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary font-mono">{response.model_name}</span>
                      <span className="badge-neutral font-mono">{response.persona_id}</span>
                      {response.run_number > 1 && (
                        <span className="text-xs text-text-muted font-mono">Run {response.run_number}</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted font-mono">{response.tokens_used} tokens</span>
                  </div>
                  {response.error ? (
                    <p className="text-sm text-status-error font-mono">{response.error}</p>
                  ) : (
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{response.response_text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Section */}
        {currentJob.status === 'completed' && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Download Results</h3>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => window.open(getVisualResultsDownloadUrl(currentJob.id, 'csv'), '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(getVisualResultsDownloadUrl(currentJob.id, 'json'), '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Download JSON
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
