"""
Assessment Orchestrator

This is the core engine that runs psychometric assessments across multiple
models, scales, and personas. It handles:
- Provider-specific concurrency limits (semaphores)
- Rate limiting between API calls
- Progress tracking and callbacks
- Error handling with retries

CRITICAL: The async orchestration patterns with provider-specific semaphores
exist because they work. Don't simplify them away.
"""

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, Optional
from uuid import UUID

from app.models.schemas import (
    Job, JobStatus, JobProgress, Scale, ScaleItem, Persona,
    ResponseRecord, ParseWarning
)
from app.services.parser import parse_response
from app.services.scorer import apply_reverse_score
from app.services.providers import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)


# =============================================================================
# Provider-specific rate limiting configuration
# CRITICAL: These values are tuned from production experience
# =============================================================================

PROVIDER_SEMAPHORES = {
    "openai": 3,      # 3 concurrent OpenAI calls
    "anthropic": 5,   # 5 concurrent Anthropic calls
    "xai": 3,         # 3 concurrent xAI calls
    "llama": 10,      # 10 concurrent Llama calls
    "gemini": 5,      # 5 concurrent Gemini calls
    "deepseek": 3,    # 3 concurrent DeepSeek calls
    "groq": 10,       # 10 concurrent Groq calls (fast inference)
}

RATE_LIMIT_DELAYS = {
    "openai": 1.0,      # 1 second between chunks
    "anthropic": 0.5,   # 0.5 seconds between chunks
    "xai": 0.5,         # 0.5 seconds between chunks
    "llama": 0.2,       # 0.2 seconds between chunks
    "gemini": 0.5,      # 0.5 seconds between chunks
    "deepseek": 0.5,    # 0.5 seconds between chunks
    "groq": 0.1,        # 0.1 seconds between chunks (very fast)
}

MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # Exponential backoff base


@dataclass
class AssessmentTask:
    """A single assessment task (one API call)."""
    scale: Scale
    item: ScaleItem
    persona: Persona
    model_name: str
    provider_name: str
    run_number: int
    temperature: float


@dataclass
class OrchestratorState:
    """Tracks the state of an orchestration run."""
    job_id: UUID
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    responses: list[ResponseRecord] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    cancelled: bool = False
    token_usage: dict[str, int] = field(default_factory=lambda: defaultdict(int))


class Orchestrator:
    """
    Coordinates assessment execution across multiple providers.

    Usage:
        orchestrator = Orchestrator()
        orchestrator.register_provider("openai", openai_client)
        orchestrator.register_provider("anthropic", anthropic_client)

        responses = await orchestrator.run_assessment(
            job=job,
            scales=scales,
            personas=personas,
            on_progress=progress_callback
        )
    """

    def __init__(self):
        self.providers: dict[str, BaseLLMProvider] = {}
        self.semaphores: dict[str, asyncio.Semaphore] = {}
        self.last_call_time: dict[str, float] = defaultdict(float)

    def register_provider(self, name: str, provider: BaseLLMProvider):
        """Register an LLM provider for use in assessments."""
        self.providers[name] = provider
        concurrency = PROVIDER_SEMAPHORES.get(name, 3)
        self.semaphores[name] = asyncio.Semaphore(concurrency)
        logger.info(f"Registered provider {name} with concurrency {concurrency}")

    def get_provider_for_model(self, model_name: str) -> tuple[str, BaseLLMProvider]:
        """
        Determine which provider handles a given model.

        Returns:
            Tuple of (provider_name, provider_client)
        """
        # Model name prefixes that indicate provider
        model_lower = model_name.lower()

        # OpenAI models: gpt-*, o1-*, o3-*
        if model_lower.startswith("gpt") or model_lower.startswith("o1") or model_lower.startswith("o3"):
            if "openai" in self.providers:
                return "openai", self.providers["openai"]
        # Anthropic models: claude-*
        elif model_lower.startswith("claude"):
            if "anthropic" in self.providers:
                return "anthropic", self.providers["anthropic"]
        # xAI models: grok-*
        elif model_lower.startswith("grok"):
            if "xai" in self.providers:
                return "xai", self.providers["xai"]
        # Gemini models: gemini-*
        elif model_lower.startswith("gemini"):
            if "gemini" in self.providers:
                return "gemini", self.providers["gemini"]
        # DeepSeek models: deepseek-*
        elif model_lower.startswith("deepseek"):
            if "deepseek" in self.providers:
                return "deepseek", self.providers["deepseek"]
        # Groq models: llama-*, mixtral-*, gemma-* (hosted on Groq)
        elif any(prefix in model_lower for prefix in ["llama-3", "mixtral", "gemma"]):
            if "groq" in self.providers:
                return "groq", self.providers["groq"]
        # Self-hosted Llama (meta-llama prefix or generic llama)
        elif "llama" in model_lower or "meta-llama" in model_lower:
            if "llama" in self.providers:
                return "llama", self.providers["llama"]

        # Fallback: check each provider's available models
        for name, provider in self.providers.items():
            if model_name in provider.available_models:
                return name, provider

        raise ValueError(f"No provider found for model: {model_name}")

    async def run_assessment(
        self,
        job: Job,
        scales: dict[str, Scale],
        personas: dict[str, Persona],
        on_progress: Optional[Callable[[JobProgress], None]] = None
    ) -> list[ResponseRecord]:
        """
        Run a complete assessment job.

        Args:
            job: The job configuration
            scales: Dictionary of scale_name -> Scale
            personas: Dictionary of persona_id -> Persona
            on_progress: Optional callback for progress updates

        Returns:
            List of all response records
        """
        state = OrchestratorState(job_id=job.id)

        # Build task list
        tasks = self._build_task_list(job, scales, personas)
        state.total_tasks = len(tasks)

        logger.info(f"Starting assessment {job.id} with {state.total_tasks} tasks")

        # Group tasks by provider for efficient batching
        tasks_by_provider = self._group_tasks_by_provider(tasks)

        # Create async tasks for each provider group
        async_tasks = []
        for provider_name, provider_tasks in tasks_by_provider.items():
            async_tasks.append(
                self._process_provider_tasks(
                    provider_name,
                    provider_tasks,
                    state,
                    on_progress
                )
            )

        # Run all provider groups concurrently
        await asyncio.gather(*async_tasks)

        logger.info(
            f"Assessment {job.id} completed: "
            f"{state.completed_tasks}/{state.total_tasks} successful, "
            f"{state.failed_tasks} failed"
        )

        return state.responses

    def _build_task_list(
        self,
        job: Job,
        scales: dict[str, Scale],
        personas: dict[str, Persona]
    ) -> list[AssessmentTask]:
        """Build the complete list of assessment tasks."""
        tasks = []

        for scale_name in job.config.scales:
            scale = scales.get(scale_name)
            if not scale:
                logger.warning(f"Scale not found: {scale_name}")
                continue

            for persona_id in job.config.personas:
                persona = personas.get(persona_id)
                if not persona:
                    logger.warning(f"Persona not found: {persona_id}")
                    continue

                for model_name in job.config.models:
                    try:
                        provider_name, _ = self.get_provider_for_model(model_name)
                    except ValueError as e:
                        logger.warning(str(e))
                        continue

                    for item in scale.items:
                        for run in range(job.config.runs_per_item):
                            tasks.append(AssessmentTask(
                                scale=scale,
                                item=item,
                                persona=persona,
                                model_name=model_name,
                                provider_name=provider_name,
                                run_number=run + 1,
                                temperature=job.config.temperature
                            ))

        return tasks

    def _group_tasks_by_provider(
        self,
        tasks: list[AssessmentTask]
    ) -> dict[str, list[AssessmentTask]]:
        """Group tasks by provider for parallel processing."""
        grouped = defaultdict(list)
        for task in tasks:
            grouped[task.provider_name].append(task)
        return grouped

    async def _process_provider_tasks(
        self,
        provider_name: str,
        tasks: list[AssessmentTask],
        state: OrchestratorState,
        on_progress: Optional[Callable[[JobProgress], None]]
    ):
        """Process all tasks for a single provider with rate limiting."""
        semaphore = self.semaphores[provider_name]
        rate_limit = RATE_LIMIT_DELAYS.get(provider_name, 0.5)

        async def process_single_task(task: AssessmentTask):
            if state.cancelled:
                return

            async with semaphore:
                # Apply rate limiting
                await self._apply_rate_limit(provider_name, rate_limit)

                # Execute the task with retries
                response = await self._execute_task_with_retry(task, state)

                if response:
                    state.responses.append(response)
                    state.completed_tasks += 1
                else:
                    state.failed_tasks += 1

                # Report progress
                if on_progress:
                    progress = JobProgress(
                        total_calls=state.total_tasks,
                        completed_calls=state.completed_tasks,
                        failed_calls=state.failed_tasks,
                        current_phase=f"{task.model_name} - {task.scale.name} - {task.persona.id}"
                    )
                    on_progress(progress)

        # Process tasks concurrently within semaphore limits
        await asyncio.gather(*[process_single_task(task) for task in tasks])

    async def _apply_rate_limit(self, provider_name: str, delay: float):
        """Apply rate limiting between calls to the same provider."""
        import time
        now = time.time()
        last_call = self.last_call_time[provider_name]
        elapsed = now - last_call

        if elapsed < delay:
            await asyncio.sleep(delay - elapsed)

        self.last_call_time[provider_name] = time.time()

    async def _execute_task_with_retry(
        self,
        task: AssessmentTask,
        state: OrchestratorState
    ) -> Optional[ResponseRecord]:
        """Execute a single task with exponential backoff retry."""
        provider = self.providers[task.provider_name]
        prompt = self._build_prompt(task)

        for attempt in range(MAX_RETRIES):
            try:
                response = await provider.complete(
                    prompt=prompt,
                    model=task.model_name,
                    temperature=task.temperature,
                    max_tokens=500
                )

                # Parse the response
                parsed = parse_response(
                    response.text,
                    task.scale.scale_range
                )

                # Apply reverse scoring
                scored_value = apply_reverse_score(
                    parsed.numeric_score,
                    task.item.reverse_score,
                    task.scale.scale_range
                )

                # Track token usage
                state.token_usage[task.model_name] += response.tokens_used

                return ResponseRecord(
                    job_id=state.job_id,
                    model_name=task.model_name,
                    scale_name=task.scale.name,
                    question_id=task.item.id,
                    question_text=task.item.text,
                    persona_id=task.persona.id,
                    run_number=task.run_number,
                    temperature=task.temperature,
                    raw_response=response.text,
                    numeric_score=parsed.numeric_score,
                    scored_value=scored_value,
                    justification=parsed.justification,
                    parse_method=parsed.parse_method,
                    parse_warning=parsed.warning.value if parsed.warning else None,
                    duration_ms=response.duration_ms,
                    tokens_used=response.tokens_used,
                    timestamp=datetime.utcnow()
                )

            except Exception as e:
                logger.warning(
                    f"Task failed (attempt {attempt + 1}/{MAX_RETRIES}): "
                    f"{task.model_name}/{task.scale.name}/{task.item.id} - {str(e)}"
                )

                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_BASE_DELAY * (2 ** attempt)
                    await asyncio.sleep(delay)
                else:
                    state.errors.append(
                        f"{task.model_name}/{task.scale.name}/{task.item.id}: {str(e)}"
                    )
                    return None

        return None

    def _build_prompt(self, task: AssessmentTask) -> str:
        """
        Construct the full prompt sent to the model.

        Structure:
        1. Persona prefix (ideological framing)
        2. Response format instructions
        3. Question text
        4. Scale information
        5. Output format request (JSON preferred)
        """
        scale = task.scale
        persona = task.persona
        item = task.item

        # Build scale description
        labels = scale.response_format.labels or {}
        min_val = scale.response_format.min
        max_val = scale.response_format.max

        if labels:
            label_str = ", ".join(f"{k}={v}" for k, v in sorted(labels.items()))
            scale_desc = f"{min_val} to {max_val} ({label_str})"
        else:
            scale_desc = f"{min_val} to {max_val}"

        # Build the prompt
        parts = []

        # Persona prefix (may be empty for minimal persona)
        if persona.prompt_prefix:
            parts.append(persona.prompt_prefix)

        parts.append(f"Answer using this scale: {scale_desc}")
        parts.append(f"Question: {item.text}")
        parts.append('Please provide your response in JSON format: {"rating": <number>, "justification": "<brief explanation>"}')

        return "\n\n".join(parts)

    def cancel(self, state: OrchestratorState):
        """Cancel an in-progress assessment."""
        state.cancelled = True
        logger.info(f"Assessment {state.job_id} cancelled")
