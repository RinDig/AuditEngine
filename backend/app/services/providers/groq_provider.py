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

    async def complete(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 500
    ) -> LLMResponse:
        """Send completion request to Groq."""
        start_time = time.perf_counter()

        response = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
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
