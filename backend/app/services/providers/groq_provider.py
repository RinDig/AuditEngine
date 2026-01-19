"""
Groq provider client.

Uses the OpenAI-compatible API that Groq provides.
Groq offers ultra-fast inference for open-source models.
"""

import time
from typing import Optional

from openai import AsyncOpenAI, APIError, AuthenticationError

from .base import BaseLLMProvider, LLMResponse


class GroqProvider(BaseLLMProvider):
    """Groq API client using OpenAI-compatible interface."""

    GROQ_BASE_URL = "https://api.groq.com/openai/v1"

    AVAILABLE_MODELS = [
        # Llama 3.3
        "llama-3.3-70b-versatile",
        "llama-3.3-70b-specdec",
        # Llama 3.1
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        # Llama 3.2 (smaller/vision)
        "llama-3.2-90b-vision-preview",
        "llama-3.2-11b-vision-preview",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
        # Mixtral
        "mixtral-8x7b-32768",
        # Gemma
        "gemma2-9b-it",
        # DeepSeek (via Groq)
        "deepseek-r1-distill-llama-70b",
    ]

    # Vision-capable models on Groq
    VISION_MODELS = [
        "llama-3.2-90b-vision-preview",
        "llama-3.2-11b-vision-preview",
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.GROQ_BASE_URL)
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url
        )

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def available_models(self) -> list[str]:
        return self.AVAILABLE_MODELS

    @property
    def vision_models(self) -> list[str]:
        return self.VISION_MODELS

    async def complete(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 500,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        """Send completion request to Groq."""
        start_time = time.perf_counter()

        # Build messages with optional system prompt
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        return LLMResponse(
            text=response.choices[0].message.content or "",
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            duration_ms=duration_ms,
            raw_response=response.model_dump()
        )

    async def complete_with_vision(
        self,
        prompt: str,
        image_data: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 1000,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        """Send completion request with image to Groq."""
        if model not in self.VISION_MODELS:
            raise ValueError(f"Model {model} does not support vision")

        start_time = time.perf_counter()

        # Ensure image_data has proper data URI format
        if not image_data.startswith("data:"):
            # Assume JPEG if no prefix
            image_data = f"data:image/jpeg;base64,{image_data}"

        # Build messages with optional system prompt
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Add user message with image (OpenAI-compatible format)
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": image_data}
                },
                {
                    "type": "text",
                    "text": prompt
                }
            ]
        })

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        return LLMResponse(
            text=response.choices[0].message.content or "",
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            duration_ms=duration_ms,
            raw_response=response.model_dump()
        )

    async def validate_key(self) -> tuple[bool, Optional[str]]:
        """Validate Groq API key with a minimal request."""
        try:
            await self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10,
            )
            return True, None
        except AuthenticationError as e:
            return False, f"Invalid API key: {str(e)}"
        except APIError as e:
            return False, f"API error: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
