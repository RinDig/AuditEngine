'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui'
import {
  APIKeysSection,
  ScalesSection,
  ModelsSection,
  PersonasSection,
  ConfigSection,
  JobProgress,
  ResultsView,
  CustomPersonaModal,
  AIPersonaGeneratorModal,
  CustomScaleModal,
  VisualAssessment,
} from '@/components/wizard'
import {
  fetchScales,
  fetchPersonas,
  createJob,
  fetchJob,
  cancelJob,
  fetchJobSummary,
  checkHealth,
} from '@/lib/api'
import type {
  Scale,
  Persona,
  Job,
  JobSummary,
  ProviderType,
  APIKeyStatus,
} from '@/lib/types'
import { PROVIDERS } from '@/lib/types'

type AssessmentMode = 'text' | 'visual'

// Initialize API key state for all providers
function initializeAPIKeys(): Record<
  ProviderType,
  {
    key: string
    baseUrl?: string
    status: 'idle' | 'validating' | 'valid' | 'invalid'
    error?: string
    models?: string[]
  }
> {
  const keys: Record<string, {
    key: string
    baseUrl?: string
    status: 'idle' | 'validating' | 'valid' | 'invalid'
    error?: string
    models?: string[]
  }> = {}

  for (const provider of PROVIDERS) {
    keys[provider.id] = {
      key: '',
      baseUrl: provider.default_base_url,
      status: 'idle',
    }
  }

  return keys as Record<ProviderType, typeof keys[string]>
}

type AppState = 'configure' | 'running' | 'results'

export default function Home() {
  // App state
  const [appState, setAppState] = useState<AppState>('configure')
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('text')

  // Data from backend
  const [scales, setScales] = useState<Scale[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // User selections
  const [apiKeys, setAPIKeys] = useState(initializeAPIKeys)
  const [selectedScales, setSelectedScales] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['minimal'])
  const [temperature, setTemperature] = useState(0)
  const [runsPerItem, setRunsPerItem] = useState(1)

  // Job state
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [jobSummary, setJobSummary] = useState<JobSummary | null>(null)
  const [jobStartTime, setJobStartTime] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom personas
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([])
  const [showCustomPersonaModal, setShowCustomPersonaModal] = useState(false)
  const [showAIPersonaModal, setShowAIPersonaModal] = useState(false)

  // Custom scales
  const [customScales, setCustomScales] = useState<Scale[]>([])
  const [showCustomScaleModal, setShowCustomScaleModal] = useState(false)

  // Combined scales (backend + custom)
  const allScales = [...scales, ...customScales]

  // Calculate totals
  const totalItems = selectedScales.reduce((sum, name) => {
    const scale = allScales.find((s) => s.name === name)
    return sum + (scale?.item_count || 0)
  }, 0)

  const canSubmit =
    selectedScales.length > 0 &&
    selectedModels.length > 0 &&
    selectedPersonas.length > 0 &&
    Object.values(apiKeys).some((k) => k.status === 'valid')

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Check backend connection
        await checkHealth()
        setBackendConnected(true)

        // Load scales and personas
        const [scalesData, personasData] = await Promise.all([
          fetchScales(),
          fetchPersonas(),
        ])
        setScales(scalesData)
        setPersonas(personasData)
      } catch (err) {
        console.error('Failed to connect to backend:', err)
        setBackendConnected(false)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Poll for job updates when running
  useEffect(() => {
    if (appState !== 'running' || !currentJob) return

    const pollInterval = setInterval(async () => {
      try {
        const { job } = await fetchJob(currentJob.id)
        setCurrentJob(job)

        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(pollInterval)

          if (job.status === 'completed') {
            const summary = await fetchJobSummary(job.id)
            setJobSummary(summary)
          }

          setAppState('results')
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err)
      }
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [appState, currentJob])

  // Handlers
  const handleKeyChange = useCallback(
    (provider: ProviderType, key: string, baseUrl?: string) => {
      setAPIKeys((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          key,
          baseUrl,
          status: key ? prev[provider].status : 'idle',
        },
      }))
    },
    []
  )

  const handleKeyValidated = useCallback(
    (provider: ProviderType, status: APIKeyStatus) => {
      setAPIKeys((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: status.is_valid ? 'valid' : 'invalid',
          error: status.error,
          models: status.available_models,
        },
      }))
    },
    []
  )

  const handleStartAssessment = async () => {
    setError(null)
    setSubmitting(true)

    try {
      // Build API keys list for request
      const apiKeyConfigs = Object.entries(apiKeys)
        .filter(([, state]) => state.status === 'valid' && state.key)
        .map(([provider, state]) => ({
          provider: provider as ProviderType,
          api_key: state.key,
          base_url: state.baseUrl,
        }))

      const { job } = await createJob({
        config: {
          scales: selectedScales,
          models: selectedModels,
          personas: selectedPersonas,
          runs_per_item: runsPerItem,
          temperature,
        },
        api_keys: apiKeyConfigs,
        custom_personas: customPersonas.length > 0 ? customPersonas : undefined,
        custom_scales: customScales.length > 0 ? customScales : undefined,
      })

      setCurrentJob(job)
      setJobStartTime(new Date())
      setAppState('running')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelJob = async () => {
    if (!currentJob) return

    try {
      await cancelJob(currentJob.id)
      const { job } = await fetchJob(currentJob.id)
      setCurrentJob(job)
      setAppState('results')
    } catch (err) {
      console.error('Failed to cancel job:', err)
    }
  }

  const handleNewAssessment = () => {
    setCurrentJob(null)
    setJobSummary(null)
    setJobStartTime(null)
    setAppState('configure')
  }

  // Custom persona handlers
  const handleAddCustomPersona = useCallback((persona: Persona) => {
    setCustomPersonas((prev) => [...prev, persona])
    // Auto-select the new persona
    setSelectedPersonas((prev) => [...prev, persona.id])
  }, [])

  const handleRemoveCustomPersona = useCallback((personaId: string) => {
    setCustomPersonas((prev) => prev.filter((p) => p.id !== personaId))
    setSelectedPersonas((prev) => prev.filter((id) => id !== personaId))
  }, [])

  const handleAddAIPersonas = useCallback((personas: Persona[]) => {
    setCustomPersonas((prev) => [...prev, ...personas])
    // Auto-select all new personas
    setSelectedPersonas((prev) => [...prev, ...personas.map((p) => p.id)])
  }, [])

  // Combined personas (backend + custom)
  const allPersonas = [...personas, ...customPersonas]

  // Custom scale handlers
  const handleAddCustomScale = useCallback((scale: Scale) => {
    // Prefix the name to identify as custom
    const customScale = { ...scale, name: `Custom: ${scale.name}` }
    setCustomScales((prev) => [...prev, customScale])
    // Auto-select the new scale
    setSelectedScales((prev) => [...prev, customScale.name])
  }, [])

  const handleRemoveCustomScale = useCallback((scaleName: string) => {
    setCustomScales((prev) => prev.filter((s) => s.name !== scaleName))
    setSelectedScales((prev) => prev.filter((name) => name !== scaleName))
  }, [])

  // Get available AI providers (OpenAI and Anthropic only)
  const aiProviders = Object.entries(apiKeys)
    .filter(([provider, state]) =>
      (provider === 'openai' || provider === 'anthropic') && state.status === 'valid'
    )
    .map(([provider, state]) => ({
      provider: provider as ProviderType,
      apiKey: state.key,
      baseUrl: state.baseUrl,
    }))

  // Render connection error
  if (backendConnected === false) {
    return (
      <div className="min-h-screen pt-20 bg-surface">
        <div className="hero py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-status-error/20 mb-6">
              <svg className="w-8 h-8 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Backend Connection Failed
            </h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Unable to connect to the Ethics Engine API
            </p>
            <div className="card max-w-md mx-auto text-left">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">API endpoint</p>
              <code className="text-sm text-accent font-mono block mb-4">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </code>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Start the backend</p>
                <code className="text-sm text-text-primary font-mono">
                  cd backend && uvicorn app.main:app --reload
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render loading state
  if (loadingData) {
    return (
      <div className="min-h-screen pt-20 bg-surface">
        <div className="hero py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-accent/20 mb-6">
              <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Initializing Ethics Engine
            </h2>
            <p className="text-text-secondary font-mono text-sm">
              Connecting to backend...
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card h-24 animate-pulse bg-surface-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render running state
  if (appState === 'running' && currentJob && jobStartTime) {
    return (
      <div className="min-h-screen pt-20 bg-surface">
        <div className="hero py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="status-dot-loading w-3 h-3 rounded-full" />
              <span className="text-accent font-mono text-sm uppercase tracking-wide">Processing</span>
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              Running Assessment
            </h2>
            <p className="text-text-secondary font-mono">
              {currentJob.progress.total_calls.toLocaleString()} API calls across selected models
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 -mt-4">
          <JobProgress
            job={currentJob}
            startTime={jobStartTime}
            onCancel={handleCancelJob}
          />
        </div>
      </div>
    )
  }

  // Render results state
  if (appState === 'results' && currentJob) {
    return (
      <div className="min-h-screen pt-20 bg-surface">
        <div className="hero py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4 ${
              currentJob.status === 'completed' ? 'bg-status-success/20' : 'bg-status-error/20'
            }`}>
              {currentJob.status === 'completed' ? (
                <svg className="w-7 h-7 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              {currentJob.status === 'completed' ? 'Assessment Complete' : currentJob.status === 'failed' ? 'Assessment Failed' : 'Assessment Cancelled'}
            </h2>
            <p className="text-text-secondary font-mono">
              {jobSummary ? `${jobSummary.total_responses.toLocaleString()} responses collected` : 'View your results below'}
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 -mt-4 pb-16">
          <ResultsView
            job={currentJob}
            summary={jobSummary}
            onNewAssessment={handleNewAssessment}
          />
        </div>
      </div>
    )
  }

  // Render configuration state
  return (
    <div className="min-h-screen pt-20 bg-surface">
      {/* Hero Section */}
      <div className="hero py-16 mb-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-status-success/10 border border-status-success/20 text-status-success text-xs font-mono uppercase tracking-wide mb-6">
            <span className="status-dot-success w-2 h-2 rounded-full" />
            System Online
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-text-primary mb-4 tracking-tight">
            Ethics Engine
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8 font-mono">
            Psychometric assessment of Large Language Models
          </p>

          {/* Assessment Mode Tabs */}
          <div className="tabs mb-8">
            <button
              onClick={() => setAssessmentMode('text')}
              className={`tab ${assessmentMode === 'text' ? 'tab-active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Text Assessment
            </button>
            <button
              onClick={() => setAssessmentMode('visual')}
              className={`tab ${assessmentMode === 'visual' ? 'tab-active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Visual Assessment
            </button>
          </div>

          {/* Quick Stats - only show for text mode */}
          {assessmentMode === 'text' && (
            <div className="flex flex-wrap justify-center gap-8 text-sm font-mono">
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="text-accent font-semibold">{scales.length}</span>
                <span>Scales</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="text-accent font-semibold">7</span>
                <span>Providers</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="text-accent font-semibold">{allPersonas.length}</span>
                <span>Personas</span>
              </div>
            </div>
          )}

          {/* Visual mode description */}
          {assessmentMode === 'visual' && (
            <p className="text-text-muted text-sm font-mono max-w-lg mx-auto">
              Upload an image and collect open-ended responses from vision-capable models.
              Ideal for visual stimulus analysis.
            </p>
          )}
        </div>
      </div>

      {/* Text Assessment Configuration */}
      {assessmentMode === 'text' && (
        <>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="space-y-8">
              {/* Section 1: API Keys */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="section-number">01</div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">API Configuration</h2>
                    <p className="text-sm text-text-muted font-mono">Connect provider credentials</p>
                  </div>
                </div>
                <APIKeysSection
                  apiKeys={apiKeys}
                  onKeyChange={handleKeyChange}
                  onValidate={handleKeyValidated}
                />
              </div>

              {/* Section 2: Scales */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="section-number">02</div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Assessment Scales</h2>
                    <p className="text-sm text-text-muted font-mono">Select psychometric instruments</p>
                  </div>
                </div>
                <ScalesSection
                  scales={allScales}
                  selectedScales={selectedScales}
                  onSelectionChange={setSelectedScales}
                  onAddCustom={() => setShowCustomScaleModal(true)}
                  onRemoveCustom={handleRemoveCustomScale}
                />
              </div>

              {/* Section 3: Models */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="section-number">03</div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Model Selection</h2>
                    <p className="text-sm text-text-muted font-mono">Choose models to evaluate</p>
                  </div>
                </div>
                <ModelsSection
                  apiKeys={apiKeys}
                  selectedModels={selectedModels}
                  onSelectionChange={setSelectedModels}
                />
              </div>

              {/* Section 4: Personas */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="section-number">04</div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Persona Configuration</h2>
                    <p className="text-sm text-text-muted font-mono">Define ideological framings</p>
                  </div>
                </div>
                <PersonasSection
                  personas={allPersonas}
                  selectedPersonas={selectedPersonas}
                  onSelectionChange={setSelectedPersonas}
                  onAddCustom={() => setShowCustomPersonaModal(true)}
                  onRemoveCustom={handleRemoveCustomPersona}
                  onAIGenerate={() => setShowAIPersonaModal(true)}
                  hasAIProviders={aiProviders.length > 0}
                />
              </div>

              {/* Section 5: Run Configuration */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="section-number">05</div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Run Parameters</h2>
                    <p className="text-sm text-text-muted font-mono">Configure execution settings</p>
                  </div>
                </div>
                <ConfigSection
                  temperature={temperature}
                  runsPerItem={runsPerItem}
                  totalItems={totalItems}
                  totalModels={selectedModels.length}
                  totalPersonas={selectedPersonas.length}
                  onTemperatureChange={setTemperature}
                  onRunsPerItemChange={setRunsPerItem}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-status-error/10 border border-status-error/30 rounded">
                  <svg className="w-5 h-5 text-status-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-status-error font-mono">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Submit Footer */}
          <div className="sticky bottom-0 bg-surface-raised/95 backdrop-blur border-t border-border">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {canSubmit ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="status-dot-success w-2 h-2 rounded-full" />
                        <span className="text-sm font-medium text-status-success font-mono uppercase tracking-wide">Ready</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-sm text-text-muted font-mono">
                        <span>{selectedScales.length} scale{selectedScales.length !== 1 ? 's' : ''}</span>
                        <span className="text-border">|</span>
                        <span>{selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}</span>
                        <span className="text-border">|</span>
                        <span>{selectedPersonas.length} persona{selectedPersonas.length !== 1 ? 's' : ''}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-text-muted font-mono">
                      {Object.values(apiKeys).every((k) => k.status !== 'valid')
                        ? 'Connect at least one API provider'
                        : selectedScales.length === 0
                          ? 'Select at least one scale'
                          : selectedModels.length === 0
                            ? 'Select at least one model'
                            : selectedPersonas.length === 0
                              ? 'Select at least one persona'
                              : ''}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!canSubmit || submitting}
                  loading={submitting}
                  onClick={handleStartAssessment}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Execute Assessment
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Visual Assessment */}
      {assessmentMode === 'visual' && (
        <VisualAssessment apiKeys={apiKeys} />
      )}

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
        onAdd={handleAddAIPersonas}
        availableProviders={aiProviders}
      />

      {/* Custom Scale Modal */}
      <CustomScaleModal
        isOpen={showCustomScaleModal}
        onClose={() => setShowCustomScaleModal(false)}
        onAdd={handleAddCustomScale}
        existingScaleNames={allScales.map((s) => s.name)}
      />
    </div>
  )
}
