/**
 * Type definitions mirroring the backend Pydantic schemas.
 * Keep in sync with backend/app/models/schemas.py
 */

// =============================================================================
// Scale Types
// =============================================================================

export interface ResponseFormat {
  type: 'likert'
  min: number
  max: number
  labels?: Record<number, string>
}

export interface ScaleItem {
  id: string
  text: string
  reverse_score: boolean
  subscale?: string
}

export interface Scale {
  name: string
  description?: string
  citation?: string
  response_format: ResponseFormat
  items: ScaleItem[]
  item_count: number
  scale_range: [number, number]
}

// =============================================================================
// Persona Types
// =============================================================================

export interface Persona {
  id: string
  name: string
  description?: string
  prompt_prefix: string
}

// =============================================================================
// Job Types
// =============================================================================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface JobConfig {
  scales: string[]
  models: string[]
  personas: string[]
  runs_per_item: number
  temperature: number
}

export interface JobProgress {
  total_calls: number
  completed_calls: number
  failed_calls: number
  current_phase: string
  percent_complete: number
}

export interface Job {
  id: string
  status: JobStatus
  created_at: string
  updated_at: string
  config: JobConfig
  progress: JobProgress
  error?: string
}

// =============================================================================
// Response Record Types
// =============================================================================

export type ParseWarning =
  | 'used_simple_format'
  | 'used_first_number'
  | 'used_text_conversion'
  | 'used_fallback'

export interface ResponseRecord {
  job_id: string
  model_name: string
  scale_name: string
  question_id: string
  question_text: string
  persona_id: string
  run_number: number
  temperature: number
  raw_response: string
  numeric_score: number
  scored_value: number
  justification?: string
  parse_method: string
  parse_warning?: ParseWarning
  duration_ms: number
  tokens_used: number
  timestamp: string
}

// =============================================================================
// API Key Types
// =============================================================================

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'xai'
  | 'llama'
  | 'gemini'
  | 'deepseek'
  | 'groq'

export interface APIKeyConfig {
  provider: ProviderType
  api_key: string
  base_url?: string
  is_valid?: boolean
}

export interface APIKeyStatus {
  provider: ProviderType
  is_valid: boolean
  error?: string
  available_models: string[]
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CreateJobRequest {
  config: JobConfig
  api_keys: APIKeyConfig[]
  custom_personas?: Persona[]
  custom_scales?: Scale[]
}

export interface JobResponse {
  job: Job
  message?: string
}

export interface ScaleListResponse {
  scales: Scale[]
  total: number
}

export interface PersonaListResponse {
  personas: Persona[]
  total: number
}

export interface JobSummary {
  job_id: string
  total_responses: number
  parse_warnings: number
  total_tokens: number
  statistics: Record<string, unknown>
}

// =============================================================================
// Provider Metadata (for UI display)
// =============================================================================

export interface ProviderInfo {
  id: ProviderType
  name: string
  description: string
  models: string[]
  requires_base_url: boolean
  default_base_url?: string
}

// =============================================================================
// Visual Assessment Types
// =============================================================================

export type VisualJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface VisualJobConfig {
  models: string[]
  personas: string[]
  prompt: string
  runs_per_model: number
  temperature: number
}

export interface VisualJobProgress {
  total_calls: number
  completed_calls: number
  failed_calls: number
  current_phase: string
  percent_complete: number
}

export interface VisualJob {
  id: string
  status: VisualJobStatus
  created_at: string
  updated_at: string
  config: VisualJobConfig
  progress: VisualJobProgress
  image_description?: string
  error?: string
}

export interface VisualResponseRecord {
  job_id: string
  model_name: string
  persona_id: string
  run_number: number
  temperature: number
  prompt: string
  response_text: string
  tokens_used: number
  duration_ms: number
  timestamp: string
  error?: string
}

export interface CreateVisualJobRequest {
  config: VisualJobConfig
  api_keys: APIKeyConfig[]
  image_data: string
  image_description?: string
  custom_personas?: Persona[]
}

export interface VisualJobResponse {
  job: VisualJob
  message?: string
}

export interface VisualJobSummary {
  job_id: string
  total_responses: number
  failed_responses: number
  total_tokens: number
  responses: VisualResponseRecord[]
}

// Vision-capable models by provider
export const VISION_MODELS: Record<ProviderType, string[]> = {
  openai: [
    'gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5.2-pro',
    'gpt-5.1', 'gpt-5.1-chat-latest',
    'gpt-5', 'gpt-5-mini',
    'gpt-4o', 'gpt-4o-mini',
    'gpt-4.1', 'gpt-4.1-mini',
    'gpt-4-turbo',
    'o1', 'o1-preview',
  ],
  anthropic: [
    'claude-opus-4-5-20251124', 'claude-sonnet-4-5-20251022', 'claude-haiku-4-5-20251015',
    'claude-sonnet-4-20250514', 'claude-opus-4-20250514',
    'claude-3-5-sonnet-latest', 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-latest', 'claude-3-5-haiku-20241022',
    'claude-3-opus-latest', 'claude-3-opus-20240229',
    'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
  ],
  gemini: [
    'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro',
    'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro',
  ],
  xai: [],
  llama: [],
  deepseek: [],
  groq: ['llama-3.2-90b-vision-preview', 'llama-3.2-11b-vision-preview'],
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-5, O-series models',
    models: [
      'gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5.2-pro',
      'gpt-5.1', 'gpt-5.1-chat-latest',
      'gpt-5', 'gpt-5-mini', 'gpt-5-nano',
      'gpt-4o', 'gpt-4o-mini',
      'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
      'o3-mini', 'o1', 'o1-mini',
      'gpt-4-turbo', 'gpt-4',
      'gpt-3.5-turbo',
    ],
    requires_base_url: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 4.5, Claude 4, Claude 3.5 models',
    models: [
      'claude-opus-4-5-20251124', 'claude-sonnet-4-5-20251022', 'claude-haiku-4-5-20251015',
      'claude-sonnet-4-20250514', 'claude-opus-4-20250514',
      'claude-3-5-sonnet-latest', 'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-latest', 'claude-3-5-haiku-20241022',
      'claude-3-opus-latest', 'claude-3-haiku-20240307',
    ],
    requires_base_url: false,
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok 4, Grok 3 models',
    models: [
      'grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning',
      'grok-4-0709', 'grok-4-fast-non-reasoning',
      'grok-code-fast-1',
      'grok-3', 'grok-3-mini',
    ],
    requires_base_url: false,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.5, 2.0, 1.5 models',
    models: [
      'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro',
      'gemini-2.0-flash', 'gemini-2.0-flash-lite',
      'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro',
    ],
    requires_base_url: false,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek chat and reasoning models',
    models: [
      'deepseek-chat', 'deepseek-reasoner', 'deepseek-coder',
    ],
    requires_base_url: false,
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference for Llama, Mixtral, Gemma',
    models: [
      'llama-3.3-70b-versatile', 'llama-3.3-70b-specdec',
      'llama-3.1-70b-versatile', 'llama-3.1-8b-instant',
      'llama-3.2-90b-vision-preview', 'llama-3.2-11b-vision-preview',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'deepseek-r1-distill-llama-70b',
    ],
    requires_base_url: false,
  },
  {
    id: 'llama',
    name: 'Llama (Self-hosted)',
    description: 'Self-hosted Llama via OpenAI-compatible endpoint',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Llama-3.1-405B-Instruct-Turbo',
      'meta-llama/Llama-3.1-70B-Instruct-Turbo',
      'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    ],
    requires_base_url: true,
    default_base_url: 'https://api.together.xyz/v1',
  },
]
