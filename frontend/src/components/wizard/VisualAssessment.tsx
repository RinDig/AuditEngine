'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Input } from '@/components/ui'
import {
  createVisualJob,
  fetchVisualJob,
  fetchVisualJobSummary,
  getVisualResultsDownloadUrl,
  fetchPersonas,
} from '@/lib/api'
import type {
  Persona,
  ProviderType,
  VisualJob,
  VisualJobSummary,
  VISION_MODELS,
} from '@/lib/types'
import { PROVIDERS, VISION_MODELS as VisionModels } from '@/lib/types'

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

  // Personas from backend
  const [personas, setPersonas] = useState<Persona[]>([])

  // Job state
  const [currentJob, setCurrentJob] = useState<VisualJob | null>(null)
  const [jobSummary, setJobSummary] = useState<VisualJobSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State management
  type ViewState = 'configure' | 'running' | 'results'
  const [viewState, setViewState] = useState<ViewState>('configure')

  // Load personas on mount
  useEffect(() => {
    fetchPersonas().then(setPersonas).catch(console.error)
  }, [])

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

  const visionModels = availableVisionModels()
  const canSubmit = imageData && selectedModels.length > 0 && selectedPersonas.length > 0

  // Configuration View
  if (viewState === 'configure') {
    return (
      <div className="section-light">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Image Upload Section */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Image Upload
          </h3>

          {!imagePreview ? (
            <div
              className="border-2 border-dashed border-border-primary rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-text-secondary mb-2">Drag and drop an image, or click to browse</p>
              <p className="text-xs text-text-tertiary">Supports JPEG, PNG, GIF, WebP (max 10MB)</p>
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
                  className="max-h-64 rounded-lg border border-border-primary"
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
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Image Description (optional)
                </label>
                <Input
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="e.g., Rorschach inkblot test card #1"
                  className="w-full"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  For your records - not sent to the model
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Section */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Prompt
          </h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What do you see in this image?"
            rows={3}
            className="w-full px-4 py-3 bg-surface-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
          />
          <p className="text-xs text-text-tertiary mt-2">
            This prompt will be sent with the image to each model. The persona prefix will be prepended.
          </p>
        </div>

        {/* Model Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Vision-Capable Models
            <span className="badge-neutral ml-2">{selectedModels.length} selected</span>
          </h3>

          {visionModels.length === 0 ? (
            <p className="text-text-secondary text-sm">
              No vision-capable models available. Please add API keys for OpenAI, Anthropic, or Gemini.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {visionModels.map(({ provider, model }) => (
                <label
                  key={`${provider}-${model}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedModels.includes(model)
                      ? 'border-accent bg-accent/5'
                      : 'border-border-primary hover:border-border-secondary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model)}
                    onChange={() => toggleModel(model)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedModels.includes(model)
                      ? 'bg-accent border-accent'
                      : 'border-border-secondary'
                  }`}>
                    {selectedModels.includes(model) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{model}</p>
                    <p className="text-xs text-text-tertiary capitalize">{provider}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Persona Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Personas
            <span className="badge-neutral ml-2">{selectedPersonas.length} selected</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {personas.map((persona) => (
              <label
                key={persona.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPersonas.includes(persona.id)
                    ? 'border-accent bg-accent/5'
                    : 'border-border-primary hover:border-border-secondary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPersonas.includes(persona.id)}
                  onChange={() => togglePersona(persona.id)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selectedPersonas.includes(persona.id)
                    ? 'bg-accent border-accent'
                    : 'border-border-secondary'
                }`}>
                  {selectedPersonas.includes(persona.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{persona.name}</p>
                  {persona.description && (
                    <p className="text-xs text-text-tertiary truncate">{persona.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Configuration Options */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-text-tertiary mt-1">
                Higher values = more creative/varied responses
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Runs per Model: {runsPerModel}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={runsPerModel}
                onChange={(e) => setRunsPerModel(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-text-tertiary mt-1">
                Run multiple times to see response variation
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Visual Assessment
              </>
            )}
          </Button>
        </div>
        </div>
      </div>
    )
  }

  // Running View
  if (viewState === 'running' && currentJob) {
    return (
      <div className="section-light">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Visual Assessment Running
              </h3>
              <p className="text-text-secondary mb-6">
                {currentJob.progress.current_phase || 'Starting...'}
              </p>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-text-secondary mb-2">
                  <span>{currentJob.progress.completed_calls} / {currentJob.progress.total_calls}</span>
                  <span>{currentJob.progress.percent_complete.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${currentJob.progress.percent_complete}%` }}
                  />
                </div>
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
      <div className="section-light">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Status Banner */}
        <div className={`card p-6 ${currentJob.status === 'completed' ? 'glow-success' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentJob.status === 'completed' ? 'bg-status-success/10' : 'bg-status-error/10'
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
                  <p className="text-sm text-text-secondary">
                    {jobSummary.total_responses} responses, {jobSummary.total_tokens} tokens
                  </p>
                )}
              </div>
            </div>
            <Button variant="secondary" onClick={handleReset}>
              New Assessment
            </Button>
          </div>

          {currentJob.error && (
            <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error text-sm">
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
                <div key={index} className="p-4 bg-surface-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{response.model_name}</span>
                      <span className="badge-neutral">{response.persona_id}</span>
                      {response.run_number > 1 && (
                        <span className="text-xs text-text-tertiary">Run {response.run_number}</span>
                      )}
                    </div>
                    <span className="text-xs text-text-tertiary">{response.tokens_used} tokens</span>
                  </div>
                  {response.error ? (
                    <p className="text-sm text-status-error">{response.error}</p>
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
                variant="secondary"
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
      </div>
    )
  }

  return null
}
