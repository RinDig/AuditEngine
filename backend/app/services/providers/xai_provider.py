"""
xAI (Grok) provider client.

Uses the OpenAI-compatible API that xAI provides.
"""

import time
from typing import Optional

from openai import AsyncOpenAI, APIError, AuthenticationError

from .base import BaseLLMProvider, LLMResponse


class XAIProvider(BaseLLMProvider):
    """xAI (Grok) API client using OpenAI-compatible interface."""

    XAI_BASE_URL = "https://api.x.ai/v1"

    AVAILABLE_MODELS = [
        # Grok 4.1 Series (Latest - January 2026)
        "grok-4-1-fast-reasoning",
        "grok-4-1-fast-non-reasoning",
        # Grok 4 Series
        "grok-4-0709",
        "grok-4-fast-non-reasoning",
        # Code models
        "grok-code-fast-1",
        # Grok 3 Series
        "grok-3",
        "grok-3-mini",
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.XAI_BASE_URL)
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url
        )

    @property
    def provider_name(self) -> str:
        return "xai"

    @property
    def available_models(self) -> list[str]:
        return self.AVAILABLE_MODELS

    async def complete(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 500,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        """Send completion request to xAI."""
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

    async def validate_key(self) -> tuple[bool, Optional[str]]:
        """Validate xAI API key with a minimal request."""
        try:
            await self.client.chat.completions.create(
                model="grok-3-mini",
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
