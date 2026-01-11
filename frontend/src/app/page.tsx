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
      <div className="min-h-screen pt-20">
        {/* Hero background for error state */}
        <div className="hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Backend Connection Failed
            </h2>
            <p className="text-teal-100 mb-6 max-w-md mx-auto">
              Unable to connect to the Ethics Engine API
            </p>
            <div className="inline-block bg-white/10 backdrop-blur rounded-xl px-6 py-4 text-left">
              <p className="text-sm text-teal-100 mb-2">API endpoint:</p>
              <code className="text-sm text-white font-mono">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </code>
              <div className="border-t border-white/20 mt-4 pt-4">
                <p className="text-sm text-teal-100 mb-2">Start the backend:</p>
                <code className="text-sm text-white font-mono">
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
      <div className="min-h-screen pt-20">
        <div className="hero-gradient py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-6">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Loading Ethics Engine
            </h2>
            <p className="text-teal-100">
              Connecting to backend and loading configuration...
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card h-32 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render running state
  if (appState === 'running' && currentJob && jobStartTime) {
    return (
      <div className="min-h-screen pt-20">
        <div className="hero-gradient py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Running Assessment
            </h2>
            <p className="text-teal-100">
              Processing {currentJob.progress.total_calls.toLocaleString()} API calls across your selected models
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 -mt-8">
          <JobProgress
            job={currentJob}
            startTime={jobStartTime}
            onCancel={handleCancelJob}
          />
        </div>
        <div className="section-light py-16" />
      </div>
    )
  }

  // Render results state
  if (appState === 'results' && currentJob) {
    return (
      <div className="min-h-screen pt-20">
        <div className={`hero-gradient py-12 ${currentJob.status === 'completed' ? '' : 'bg-gray-800'}`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-4">
              {currentJob.status === 'completed' ? (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentJob.status === 'completed' ? 'Assessment Complete' : currentJob.status === 'failed' ? 'Assessment Failed' : 'Assessment Cancelled'}
            </h2>
            <p className="text-teal-100">
              {jobSummary ? `${jobSummary.total_responses.toLocaleString()} responses collected` : 'View your results below'}
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 -mt-8 pb-16">
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
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <div className="hero-gradient py-16 mb-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-teal-100 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Backend Connected
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Psychometric Assessment
            <br />
            <span className="text-teal-200">for Large Language Models</span>
          </h1>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto mb-8">
            Run standardized personality assessments across multiple LLM providers.
            Compare responses, analyze patterns, and export comprehensive results.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-teal-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span><strong className="text-white">{scales.length}</strong> Scales Available</span>
            </div>
            <div className="flex items-center gap-2 text-teal-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span><strong className="text-white">7</strong> Providers Supported</span>
            </div>
            <div className="flex items-center gap-2 text-teal-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span><strong className="text-white">{allPersonas.length}</strong> Personas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="section-light">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="section-number">1</div>
              <div>
                <p className="section-header">Step 1</p>
                <h2 className="text-lg font-semibold text-text-primary">Configure API Access</h2>
              </div>
            </div>

            <APIKeysSection
              apiKeys={apiKeys}
              onKeyChange={handleKeyChange}
              onValidate={handleKeyValidated}
            />

            <div className="flex items-center gap-3 mb-2 pt-4">
              <div className="section-number">2</div>
              <div>
                <p className="section-header">Step 2</p>
                <h2 className="text-lg font-semibold text-text-primary">Select Assessment Scales</h2>
              </div>
            </div>

            <ScalesSection
              scales={allScales}
              selectedScales={selectedScales}
              onSelectionChange={setSelectedScales}
              onAddCustom={() => setShowCustomScaleModal(true)}
              onRemoveCustom={handleRemoveCustomScale}
            />

            <div className="flex items-center gap-3 mb-2 pt-4">
              <div className="section-number">3</div>
              <div>
                <p className="section-header">Step 3</p>
                <h2 className="text-lg font-semibold text-text-primary">Choose Models to Test</h2>
              </div>
            </div>

            <ModelsSection
              apiKeys={apiKeys}
              selectedModels={selectedModels}
              onSelectionChange={setSelectedModels}
            />

            <div className="flex items-center gap-3 mb-2 pt-4">
              <div className="section-number">4</div>
              <div>
                <p className="section-header">Step 4</p>
                <h2 className="text-lg font-semibold text-text-primary">Select Personas</h2>
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

            <div className="flex items-center gap-3 mb-2 pt-4">
              <div className="section-number">5</div>
              <div>
                <p className="section-header">Step 5</p>
                <h2 className="text-lg font-semibold text-text-primary">Run Configuration</h2>
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

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
                <svg className="w-5 h-5 text-status-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-status-error">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Submit Footer */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-lg shadow-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {canSubmit ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">Ready to run</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm text-text-secondary">
                    <span>{selectedScales.length} scale{selectedScales.length !== 1 ? 's' : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{selectedPersonas.length} persona{selectedPersonas.length !== 1 ? 's' : ''}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-secondary">
                  {Object.values(apiKeys).every((k) => k.status !== 'valid')
                    ? 'Connect at least one API provider to continue'
                    : selectedScales.length === 0
                      ? 'Select at least one scale to continue'
                      : selectedModels.length === 0
                        ? 'Select at least one model to continue'
                        : selectedPersonas.length === 0
                          ? 'Select at least one persona to continue'
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
              Start Assessment
            </Button>
          </div>
        </div>
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
