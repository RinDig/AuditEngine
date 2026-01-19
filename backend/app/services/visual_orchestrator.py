"""
Visual Assessment Orchestrator.

Handles running visual assessments across multiple models and personas.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.models.schemas import (
    VisualJob,
    VisualJobStatus,
    VisualJobConfig,
    VisualResponseRecord,
    APIKeyConfig,
    Persona,
    ProviderType,
)
from app.services.providers.base import BaseLLMProvider
from app.services.providers.openai_provider import OpenAIProvider
from app.services.providers.anthropic_provider import AnthropicProvider
from app.services.providers.gemini_provider import GeminiProvider
from app.services.providers.groq_provider import GroqProvider

logger = logging.getLogger(__name__)

# Provider-specific concurrency limits
PROVIDER_SEMAPHORES = {
    "openai": asyncio.Semaphore(3),
    "anthropic": asyncio.Semaphore(5),
    "gemini": asyncio.Semaphore(5),
    "groq": asyncio.Semaphore(10),
}

# Rate limits (seconds between calls)
RATE_LIMITS = {
    "openai": 1.0,
    "anthropic": 0.5,
    "gemini": 0.5,
    "groq": 0.1,
}


def get_provider_for_model(model: str, api_keys: dict[str, APIKeyConfig]) -> Optional[tuple[BaseLLMProvider, str]]:
    """
    Get the appropriate provider instance for a model.

    Returns tuple of (provider_instance, provider_name) or None if not found.
    """
    # Check each provider's vision models
    if "openai" in api_keys:
        provider = OpenAIProvider(
            api_key=api_keys["openai"].api_key.get_secret_value(),
            base_url=api_keys["openai"].base_url
        )
        if model in provider.vision_models:
            return provider, "openai"

    if "anthropic" in api_keys:
        provider = AnthropicProvider(
            api_key=api_keys["anthropic"].api_key.get_secret_value(),
            base_url=api_keys["anthropic"].base_url
        )
        if model in provider.vision_models:
            return provider, "anthropic"

    if "gemini" in api_keys:
        provider = GeminiProvider(
            api_key=api_keys["gemini"].api_key.get_secret_value(),
            base_url=api_keys["gemini"].base_url
        )
        if model in provider.vision_models:
            return provider, "gemini"

    if "groq" in api_keys:
        provider = GroqProvider(
            api_key=api_keys["groq"].api_key.get_secret_value(),
            base_url=api_keys["groq"].base_url
        )
        if model in provider.vision_models:
            return provider, "groq"

    return None


async def run_visual_assessment(
    job: VisualJob,
    image_data: str,
    api_keys: list[APIKeyConfig],
    personas: dict[str, Persona],
    on_progress: Optional[callable] = None,
) -> list[VisualResponseRecord]:
    """
    Run a visual assessment job.

    Args:
        job: The visual job configuration
        image_data: Base64-encoded image data
        api_keys: List of API key configurations
        personas: Dictionary of persona_id -> Persona
        on_progress: Optional callback for progress updates

    Returns:
        List of VisualResponseRecord with all responses
    """
    responses: list[VisualResponseRecord] = []

    # Index API keys by provider
    api_keys_by_provider = {k.provider.value: k for k in api_keys}

    # Calculate total calls
    total_calls = len(job.config.models) * len(job.config.personas) * job.config.runs_per_model
    job.progress.total_calls = total_calls
    completed = 0
    failed = 0

    # Build task list
    tasks = []
    for model in job.config.models:
        provider_info = get_provider_for_model(model, api_keys_by_provider)
        if not provider_info:
            logger.warning(f"No provider found for vision model: {model}")
            continue

        provider, provider_name = provider_info

        for persona_id in job.config.personas:
            persona = personas.get(persona_id)
            if not persona:
                logger.warning(f"Persona not found: {persona_id}")
                continue

            for run_number in range(1, job.config.runs_per_model + 1):
                tasks.append({
                    "model": model,
                    "provider": provider,
                    "provider_name": provider_name,
                    "persona": persona,
                    "run_number": run_number,
                })

    # Process tasks with rate limiting
    for task in tasks:
        model = task["model"]
        provider = task["provider"]
        provider_name = task["provider_name"]
        persona = task["persona"]
        run_number = task["run_number"]

        # Update progress
        job.progress.current_phase = f"{provider_name} - {model} - {persona.name}"
        if on_progress:
            on_progress(job)

        # Get semaphore for this provider
        semaphore = PROVIDER_SEMAPHORES.get(provider_name, asyncio.Semaphore(3))
        rate_limit = RATE_LIMITS.get(provider_name, 1.0)

        async with semaphore:
            try:
                # Get system prompt from persona (may be empty for minimal persona)
                system_prompt = persona.prompt_prefix if persona.prompt_prefix else None

                # Debug logging to trace persona system prompt
                logger.info(f"Visual assessment - Model: {model}, Persona: {persona.id}, "
                           f"Persona name: {persona.name}, "
                           f"System prompt: {system_prompt[:100] if system_prompt else 'None'}...")

                # Call the vision API with user prompt and system prompt
                llm_response = await provider.complete_with_vision(
                    prompt=job.config.prompt,
                    image_data=image_data,
                    model=model,
                    temperature=job.config.temperature,
                    max_tokens=1500,
                    system_prompt=system_prompt,
                )

                # Create response record
                response = VisualResponseRecord(
                    job_id=job.id,
                    model_name=model,
                    persona_id=persona.id,
                    run_number=run_number,
                    temperature=job.config.temperature,
                    prompt=job.config.prompt,
                    response_text=llm_response.text,
                    tokens_used=llm_response.tokens_used,
                    duration_ms=llm_response.duration_ms,
                )
                responses.append(response)
                completed += 1

            except Exception as e:
                logger.error(f"Error in visual assessment: {model}/{persona.id}: {e}")
                # Create error record
                response = VisualResponseRecord(
                    job_id=job.id,
                    model_name=model,
                    persona_id=persona.id,
                    run_number=run_number,
                    temperature=job.config.temperature,
                    prompt=job.config.prompt,
                    response_text="",
                    tokens_used=0,
                    duration_ms=0,
                    error=str(e),
                )
                responses.append(response)
                failed += 1

            # Update progress
            job.progress.completed_calls = completed
            job.progress.failed_calls = failed
            if on_progress:
                on_progress(job)

            # Rate limiting
            await asyncio.sleep(rate_limit)

    return responses


def get_vision_models_for_providers(api_keys: list[APIKeyConfig]) -> dict[str, list[str]]:
    """
    Get available vision models for each configured provider.

    Returns dict of provider_name -> list of vision model names
    """
    result = {}

    for key_config in api_keys:
        provider_name = key_config.provider.value

        if provider_name == "openai":
            provider = OpenAIProvider(api_key="dummy")  # Don't need real key for model list
            result[provider_name] = provider.vision_models
        elif provider_name == "anthropic":
            provider = AnthropicProvider(api_key="dummy")
            result[provider_name] = provider.vision_models
        elif provider_name == "gemini":
            provider = GeminiProvider(api_key="dummy")
            result[provider_name] = provider.vision_models
        elif provider_name == "groq":
            provider = GroqProvider(api_key="dummy")
            result[provider_name] = provider.vision_models

    return result
