/**
 * API client for communicating with the Ethics Engine backend.
 */

import type {
  Scale,
  Persona,
  Job,
  JobResponse,
  JobSummary,
  APIKeyConfig,
  APIKeyStatus,
  CreateJobRequest,
  ScaleListResponse,
  PersonaListResponse,
  VisualJob,
  VisualJobResponse,
  VisualJobSummary,
  CreateVisualJobRequest,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public detail?: string
  ) {
    super(detail || `${status} ${statusText}`)
    this.name = 'APIError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    let detail: string | undefined
    try {
      const errorData = await response.json()
      detail = errorData.detail
    } catch {
      // Response wasn't JSON
    }
    throw new APIError(response.status, response.statusText, detail)
  }

  return response.json()
}

// =============================================================================
// Scales API
// =============================================================================

export async function fetchScales(): Promise<Scale[]> {
  const data = await request<ScaleListResponse>('/api/scales')
  return data.scales
}

export async function fetchScale(name: string): Promise<Scale> {
  return request<Scale>(`/api/scales/${encodeURIComponent(name)}`)
}

export interface CustomScaleItem {
  id: string
  text: string
  reverse_score: boolean
}

export interface ValidateScaleRequest {
  name: string
  description?: string
  citation?: string
  scale_min: number
  scale_max: number
  items: CustomScaleItem[]
}

export interface ValidateScaleResponse {
  valid: boolean
  scale?: Scale
  errors: string[]
}

export async function validateCustomScale(requestData: ValidateScaleRequest): Promise<ValidateScaleResponse> {
  return request<ValidateScaleResponse>('/api/scales/validate', {
    method: 'POST',
    body: JSON.stringify(requestData),
  })
}

// =============================================================================
// Personas API
// =============================================================================

export async function fetchPersonas(): Promise<Persona[]> {
  const data = await request<PersonaListResponse>('/api/personas')
  return data.personas
}

export async function fetchPersona(id: string): Promise<Persona> {
  return request<Persona>(`/api/personas/${encodeURIComponent(id)}`)
}

export interface GeneratePersonasRequest {
  description: string
  count?: number
  provider?: 'openai' | 'anthropic'
  model?: string
  api_key: string
  base_url?: string
}

export interface GeneratePersonasResponse {
  personas: Persona[]
  count: number
}

export async function generatePersonas(requestData: GeneratePersonasRequest): Promise<GeneratePersonasResponse> {
  return request<GeneratePersonasResponse>('/api/personas/generate', {
    method: 'POST',
    body: JSON.stringify(requestData),
  })
}

// =============================================================================
// API Keys API
// =============================================================================

export async function validateAPIKey(config: APIKeyConfig): Promise<APIKeyStatus> {
  return request<APIKeyStatus>('/api/keys/validate', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

// =============================================================================
// Jobs API
// =============================================================================

export async function createJob(jobRequest: CreateJobRequest): Promise<JobResponse> {
  return request<JobResponse>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(jobRequest),
  })
}

export async function fetchJobs(): Promise<Job[]> {
  return request<Job[]>('/api/jobs')
}

export async function fetchJob(id: string): Promise<JobResponse> {
  return request<JobResponse>(`/api/jobs/${id}`)
}

export async function cancelJob(id: string): Promise<{ message: string; job_id: string }> {
  return request(`/api/jobs/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchJobSummary(id: string): Promise<JobSummary> {
  return request<JobSummary>(`/api/jobs/${id}/summary`)
}

// =============================================================================
// Results Download
// =============================================================================

export function getResultsDownloadUrl(jobId: string, format: 'csv' | 'json'): string {
  return `${API_URL}/api/jobs/${jobId}/download?format=${format}`
}

export async function downloadResults(
  jobId: string,
  format: 'csv' | 'json'
): Promise<Blob> {
  const url = getResultsDownloadUrl(jobId, format)
  const response = await fetch(url)

  if (!response.ok) {
    throw new APIError(response.status, response.statusText)
  }

  return response.blob()
}

// =============================================================================
// Health Check
// =============================================================================

export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health')
}

// =============================================================================
// Visual Assessment API
// =============================================================================

export async function createVisualJob(jobRequest: CreateVisualJobRequest): Promise<VisualJobResponse> {
  return request<VisualJobResponse>('/api/visual/jobs', {
    method: 'POST',
    body: JSON.stringify(jobRequest),
  })
}

export async function fetchVisualJob(id: string): Promise<VisualJobResponse> {
  return request<VisualJobResponse>(`/api/visual/jobs/${id}`)
}

export async function fetchVisualJobSummary(id: string): Promise<VisualJobSummary> {
  return request<VisualJobSummary>(`/api/visual/jobs/${id}/summary`)
}

export async function cancelVisualJob(id: string): Promise<{ message: string; job_id: string }> {
  return request(`/api/visual/jobs/${id}`, {
    method: 'DELETE',
  })
}

export function getVisualResultsDownloadUrl(jobId: string, format: 'csv' | 'json'): string {
  return `${API_URL}/api/visual/jobs/${jobId}/download?format=${format}`
}

export async function fetchVisionModels(): Promise<Record<string, string[]>> {
  return request<Record<string, string[]>>('/api/visual/models')
}

// =============================================================================
// Exports
// =============================================================================

export { APIError }
