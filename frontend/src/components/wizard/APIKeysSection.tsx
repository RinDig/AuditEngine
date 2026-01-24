'use client'

import { useState, useCallback } from 'react'
import { Input, Button, StatusIndicator } from '@/components/ui'
import { validateAPIKey } from '@/lib/api'
import type { ProviderType, APIKeyStatus } from '@/lib/types'
import { PROVIDERS } from '@/lib/types'

interface APIKeyState {
  key: string
  baseUrl?: string
  status: 'idle' | 'validating' | 'valid' | 'invalid'
  error?: string
  models?: string[]
}

interface APIKeysSectionProps {
  apiKeys: Record<ProviderType, APIKeyState>
  onKeyChange: (provider: ProviderType, key: string, baseUrl?: string) => void
  onValidate: (provider: ProviderType, status: APIKeyStatus) => void
}

export function APIKeysSection({
  apiKeys,
  onKeyChange,
  onValidate,
}: APIKeysSectionProps) {
  const [validating, setValidating] = useState<ProviderType | null>(null)

  const handleValidate = useCallback(
    async (provider: ProviderType) => {
      const keyState = apiKeys[provider]
      if (!keyState.key) return

      setValidating(provider)

      try {
        const providerInfo = PROVIDERS.find((p) => p.id === provider)
        const status = await validateAPIKey({
          provider,
          api_key: keyState.key,
          base_url: providerInfo?.requires_base_url ? keyState.baseUrl : undefined,
        })
        onValidate(provider, status)
      } catch (err) {
        onValidate(provider, {
          provider,
          is_valid: false,
          error: err instanceof Error ? err.message : 'Connection failed',
          available_models: [],
        })
      } finally {
        setValidating(null)
      }
    },
    [apiKeys, onValidate]
  )

  const getStatusType = (status: APIKeyState['status']) => {
    switch (status) {
      case 'valid':
        return 'success'
      case 'invalid':
        return 'error'
      case 'validating':
        return 'loading'
      default:
        return 'neutral'
    }
  }

  const getStatusLabel = (state: APIKeyState) => {
    switch (state.status) {
      case 'valid':
        return `Connected (${state.models?.length || 0} models)`
      case 'invalid':
        return state.error || 'Invalid key'
      case 'validating':
        return 'Validating...'
      default:
        return 'Not configured'
    }
  }

  const connectedCount = Object.values(apiKeys).filter(
    (k) => k.status === 'valid'
  ).length

  return (
    <div className="card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">API Configuration</h3>
              <p className="text-sm text-text-muted font-mono">
                {connectedCount > 0
                  ? `${connectedCount} provider${connectedCount !== 1 ? 's' : ''} connected`
                  : 'Configure credentials to enable model access'}
              </p>
            </div>
          </div>
          {connectedCount > 0 && (
            <span className="badge-success font-mono">
              {connectedCount} ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Provider Cards */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const keyState = apiKeys[provider.id]
            const isValidating = validating === provider.id
            const isConnected = keyState.status === 'valid'

            return (
              <div
                key={provider.id}
                className={`p-4 rounded border transition-all ${
                  isConnected
                    ? 'border-status-success/30 bg-status-success/5'
                    : 'border-border bg-surface-muted hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      isConnected ? 'bg-status-success/20 text-status-success' : 'bg-surface-hover text-text-muted'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {provider.name}
                      </h4>
                      <p className="text-xs text-text-muted font-mono">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator
                    status={getStatusType(keyState.status)}
                    label={getStatusLabel(keyState)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="password"
                      placeholder={`${provider.name} API Key`}
                      value={keyState.key}
                      onChange={(e) =>
                        onKeyChange(provider.id, e.target.value, keyState.baseUrl)
                      }
                      mono
                    />
                  </div>
                  <Button
                    variant={isConnected ? 'ghost' : 'outline'}
                    size="sm"
                    onClick={() => handleValidate(provider.id)}
                    disabled={!keyState.key || isValidating}
                    loading={isValidating}
                  >
                    {isConnected ? 'Revalidate' : 'Validate'}
                  </Button>
                </div>

                {provider.requires_base_url && (
                  <div className="mt-2">
                    <Input
                      placeholder={`Base URL (default: ${provider.default_base_url})`}
                      value={keyState.baseUrl || ''}
                      onChange={(e) =>
                        onKeyChange(provider.id, keyState.key, e.target.value)
                      }
                      hint={`Required for ${provider.name}`}
                      mono
                    />
                  </div>
                )}

                {keyState.status === 'invalid' && keyState.error && (
                  <p className="text-xs text-status-error mt-2 font-mono">{keyState.error}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Security note */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-surface-muted rounded border border-border">
          <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-text-muted font-mono">
            API keys are stored in your browser session only. When you run an assessment,
            keys are sent securely (HTTPS) to our backend, used in-memory to make API calls,
            then discarded when the job completes. Keys are never persisted to disk or database.
          </p>
        </div>
      </div>
    </div>
  )
}
