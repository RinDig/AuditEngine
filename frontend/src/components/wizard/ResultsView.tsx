'use client'

import { Button } from '@/components/ui'
import type { Job, JobSummary } from '@/lib/types'
import { formatNumber, formatTimestamp } from '@/lib/utils'
import { getResultsDownloadUrl } from '@/lib/api'

interface ResultsViewProps {
  job: Job
  summary: JobSummary | null
  onNewAssessment: () => void
}

export function ResultsView({ job, summary, onNewAssessment }: ResultsViewProps) {
  const handleDownload = (format: 'csv' | 'json') => {
    window.open(getResultsDownloadUrl(job.id, format), '_blank')
  }

  const successRate = summary && summary.total_responses > 0
    ? ((summary.total_responses - summary.parse_warnings) / summary.total_responses) * 100
    : 0

  return (
    <div className="space-y-6 animate-in">
      {/* Status Banner */}
      <div className={`card p-6 card-header-gradient ${job.status === 'completed' ? 'glow-success' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              job.status === 'completed'
                ? 'bg-status-success/10'
                : job.status === 'failed'
                  ? 'bg-status-error/10'
                  : 'bg-status-warning/10'
            }`}>
              {job.status === 'completed' ? (
                <svg className="w-6 h-6 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : job.status === 'failed' ? (
                <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {job.status === 'completed'
                  ? 'Assessment Complete'
                  : job.status === 'failed'
                    ? 'Assessment Failed'
                    : 'Assessment Cancelled'}
              </h2>
              <p className="text-sm text-text-secondary">
                Finished at {formatTimestamp(job.updated_at)}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={onNewAssessment}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Assessment
          </Button>
        </div>

        {job.error && (
          <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-status-error">{job.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {summary && job.status === 'completed' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">
              Results Summary
            </h3>
            <span className="badge-success">
              {successRate.toFixed(1)}% Success Rate
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="stat-label">Total Responses</p>
              <p className="stat-value text-accent-gradient">
                {formatNumber(summary.total_responses)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Parse Warnings</p>
              <p className={`stat-value ${summary.parse_warnings > 0 ? 'text-status-warning' : 'text-text-primary'}`}>
                {formatNumber(summary.parse_warnings)}
              </p>
              {summary.parse_warnings > 0 && (
                <p className="text-xs text-status-warning mt-1">
                  {((summary.parse_warnings / summary.total_responses) * 100).toFixed(1)}% of responses
                </p>
              )}
            </div>
            <div className="stat-card">
              <p className="stat-label">Total Tokens</p>
              <p className="stat-value">
                {formatNumber(summary.total_tokens)}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Success Rate</p>
              <div className="flex items-end gap-2">
                <p className="stat-value text-status-success">
                  {successRate.toFixed(1)}%
                </p>
              </div>
              {/* Mini progress bar */}
              <div className="mt-2 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-success rounded-full transition-all duration-500"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Statistics by model/persona/scale */}
          {summary.statistics && Object.keys(summary.statistics).length > 0 && (
            <>
              <div className="divider" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-text-primary">
                    Detailed Statistics
                  </h4>
                  <span className="badge-neutral">
                    {Object.keys(summary.statistics).length} models
                  </span>
                </div>
                <div className="code-block max-h-96 overflow-y-auto">
                  <pre className="text-xs">
                    {JSON.stringify(summary.statistics, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Download Section */}
      {job.status === 'completed' && (
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Download Results
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Export your assessment data for further analysis
              </p>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleDownload('csv')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload('json')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Download JSON
                </Button>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-text-tertiary">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  CSV format includes all responses in a flat table. JSON format includes full metadata and raw API responses.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Review */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center">
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary">
            Assessment Configuration
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-surface-muted/50">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Scales</p>
            <p className="text-sm text-text-primary font-medium">
              {job.config.scales.join(', ')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted/50">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Models</p>
            <p className="text-sm text-text-primary font-medium">
              {job.config.models.length} model{job.config.models.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-text-secondary mt-0.5 truncate" title={job.config.models.join(', ')}>
              {job.config.models.join(', ')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted/50">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Personas</p>
            <p className="text-sm text-text-primary font-medium">
              {job.config.personas.join(', ')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted/50">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Temperature</p>
            <p className="text-sm text-text-primary font-medium">
              {job.config.temperature}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted/50">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Runs per Item</p>
            <p className="text-sm text-text-primary font-medium">
              {job.config.runs_per_item}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted/50">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Job ID</p>
            <p className="text-xs text-text-primary font-mono truncate" title={job.id}>
              {job.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
