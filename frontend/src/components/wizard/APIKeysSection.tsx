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
    <div className="card overflow-hidden">
      {/* Header with gradient accent */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container-accent">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">API Configuration</h3>
              <p className="text-sm text-text-secondary">
                {connectedCount > 0
                  ? `${connectedCount} provider${connectedCount !== 1 ? 's' : ''} connected`
                  : 'Configure your API keys to enable model access'}
              </p>
            </div>
          </div>
          {connectedCount > 0 && (
            <span className="badge-success">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {connectedCount} Active
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
                className={`provider-card ${isConnected ? 'provider-card-active' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isConnected ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {provider.name}
                      </h4>
                      <p className="text-xs text-text-secondary">
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
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    variant={isConnected ? 'ghost' : 'secondary'}
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
                      className="text-xs"
                    />
                  </div>
                )}

                {keyState.status === 'invalid' && keyState.error && (
                  <p className="text-xs text-status-error mt-2">{keyState.error}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Security note */}
        <div className="mt-6 flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-text-tertiary">
            API keys are stored only in your browser session and are sent directly
            to each provider. They are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
