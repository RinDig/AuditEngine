"""
Pydantic models for Ethics Engine.

These schemas define the canonical data structures used throughout the application.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, SecretStr, computed_field


# =============================================================================
# Scale Models
# =============================================================================

class ScaleItem(BaseModel):
    """A single item (question) in a psychometric scale."""
    id: str
    text: str
    reverse_score: bool = False
    subscale: Optional[str] = None


class ResponseFormat(BaseModel):
    """Defines the response format for a scale."""
    type: str = "likert"  # Currently only likert supported
    min: int
    max: int
    labels: Optional[dict[int, str]] = None


class Scale(BaseModel):
    """A complete psychometric scale definition."""
    name: str
    description: Optional[str] = None
    citation: Optional[str] = None
    response_format: ResponseFormat
    items: list[ScaleItem]

    @computed_field
    @property
    def scale_range(self) -> tuple[int, int]:
        """Returns (min, max) tuple for scoring calculations."""
        return (self.response_format.min, self.response_format.max)

    @computed_field
    @property
    def item_count(self) -> int:
        return len(self.items)


class ScaleItemLegacy(BaseModel):
    """
    Legacy format matching existing notebook data structure.
    Used for importing scales from Python dict format.
    """
    scale_name: str
    id: str
    text: str
    scale_range: list[int]  # [min, max]
    reverse_score: bool = False
    subscale: Optional[str] = None


# =============================================================================
# Persona Models
# =============================================================================

class Persona(BaseModel):
    """An ideological framing persona for assessments."""
    id: str
    name: str
    description: Optional[str] = None
    prompt_prefix: str


# =============================================================================
# Job Models
# =============================================================================

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobConfig(BaseModel):
    """Configuration for an assessment job."""
    scales: list[str]  # Scale names to run
    models: list[str]  # Model identifiers
    personas: list[str]  # Persona IDs
    runs_per_item: int = Field(default=1, ge=1, le=20)
    temperature: float = Field(default=0.0, ge=0.0, le=2.0)


class JobProgress(BaseModel):
    """Real-time progress tracking for a job."""
    total_calls: int = 0
    completed_calls: int = 0
    failed_calls: int = 0
    current_phase: Optional[str] = None  # e.g., "OpenAI - RWA - neutral"

    @computed_field
    @property
    def percent_complete(self) -> float:
        if self.total_calls == 0:
            return 0.0
        return (self.completed_calls / self.total_calls) * 100


class Job(BaseModel):
    """A complete assessment job."""
    id: UUID = Field(default_factory=uuid4)
    status: JobStatus = JobStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    config: JobConfig
    progress: JobProgress = Field(default_factory=JobProgress)
    results_url: Optional[str] = None
    error: Optional[str] = None


# =============================================================================
# Response Models
# =============================================================================

class ParseWarning(str, Enum):
    """Types of warnings that can occur during response parsing."""
    FALLBACK_TO_MIDPOINT = "fallback_to_midpoint"
    TEXT_CONVERSION = "text_conversion"
    FIRST_NUMBER_EXTRACTION = "first_number_extraction"
    OUT_OF_RANGE_CLAMPED = "out_of_range_clamped"


class ParsedResponse(BaseModel):
    """Result of parsing an LLM response."""
    numeric_score: float
    justification: Optional[str] = None
    parse_method: str  # Which strategy succeeded
    warning: Optional[ParseWarning] = None
    raw_text: str


class ResponseRecord(BaseModel):
    """A single API call response record."""
    job_id: UUID
    model_name: str
    scale_name: str
    question_id: str
    question_text: str
    persona_id: str
    run_number: int
    temperature: float
    raw_response: str
    numeric_score: float  # Parsed score
    scored_value: float  # After reverse coding
    justification: Optional[str] = None
    parse_method: str
    parse_warning: Optional[str] = None
    duration_ms: int
    tokens_used: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# =============================================================================
# API Key Models
# =============================================================================

class ProviderType(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    XAI = "xai"
    LLAMA = "llama"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"
    GROQ = "groq"


class APIKeyConfig(BaseModel):
    """
    API key configuration for a provider.

    Uses SecretStr to prevent accidental logging/exposure of API keys.
    Access the actual key value with: config.api_key.get_secret_value()
    """
    provider: ProviderType
    api_key: SecretStr = Field(..., min_length=10, description="API key (minimum 10 characters)")
    base_url: Optional[str] = None  # For custom endpoints (Llama)
    is_valid: Optional[bool] = None


class APIKeyStatus(BaseModel):
    """Status of an API key after validation."""
    provider: ProviderType
    is_valid: bool
    error: Optional[str] = None
    available_models: list[str] = []


# =============================================================================
# Request/Response Models for API
# =============================================================================

class CreateJobRequest(BaseModel):
    """Request body for creating a new job."""
    config: JobConfig
    api_keys: list[APIKeyConfig]
    custom_personas: list["Persona"] = []  # Custom personas to include in job
    custom_scales: list["Scale"] = []  # Custom scales to include in job


class JobResponse(BaseModel):
    """Response body for job operations."""
    job: Job
    message: Optional[str] = None


class ScaleListResponse(BaseModel):
    """Response body for listing scales."""
    scales: list[Scale]
    total: int


class PersonaListResponse(BaseModel):
    """Response body for listing personas."""
    personas: list[Persona]
    total: int


# =============================================================================
# Visual Assessment Models
# =============================================================================

class VisualJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VisualJobConfig(BaseModel):
    """Configuration for a visual assessment job."""
    models: list[str]  # Model identifiers (must support vision)
    personas: list[str]  # Persona IDs
    prompt: str = Field(
        default="What do you see in this image?",
        description="The prompt/question to ask about the image"
    )
    runs_per_model: int = Field(default=1, ge=1, le=10)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class VisualJobProgress(BaseModel):
    """Real-time progress tracking for a visual assessment job."""
    total_calls: int = 0
    completed_calls: int = 0
    failed_calls: int = 0
    current_phase: Optional[str] = None

    @computed_field
    @property
    def percent_complete(self) -> float:
        if self.total_calls == 0:
            return 0.0
        return (self.completed_calls / self.total_calls) * 100


class VisualJob(BaseModel):
    """A visual assessment job."""
    id: UUID = Field(default_factory=uuid4)
    status: VisualJobStatus = VisualJobStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    config: VisualJobConfig
    progress: VisualJobProgress = Field(default_factory=VisualJobProgress)
    image_description: Optional[str] = None  # User-provided context about the image
    error: Optional[str] = None


class VisualResponseRecord(BaseModel):
    """A single visual assessment response record."""
    job_id: UUID
    model_name: str
    persona_id: str
    run_number: int
    temperature: float
    prompt: str
    response_text: str  # The model's description/response
    tokens_used: int
    duration_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None  # If this specific call failed


class CreateVisualJobRequest(BaseModel):
    """Request body for creating a visual assessment job."""
    config: VisualJobConfig
    api_keys: list[APIKeyConfig]
    image_data: str = Field(..., description="Base64-encoded image data (with or without data URI prefix)")
    image_description: Optional[str] = Field(None, max_length=500, description="Optional description/context for the image")
    custom_personas: list["Persona"] = []


class VisualJobResponse(BaseModel):
    """Response body for visual job operations."""
    job: VisualJob
    message: Optional[str] = None


class VisualJobSummary(BaseModel):
    """Summary of a completed visual assessment job."""
    job_id: UUID
    total_responses: int
    failed_responses: int
    total_tokens: int
    responses: list[VisualResponseRecord]
