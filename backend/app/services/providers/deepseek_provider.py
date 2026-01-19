"""
DeepSeek provider client.

Uses the OpenAI-compatible API that DeepSeek provides.
DeepSeek-V3.2 offers both regular chat and reasoning modes.
"""

import time
from typing import Optional

from openai import AsyncOpenAI, APIError, AuthenticationError

from .base import BaseLLMProvider, LLMResponse


class DeepSeekProvider(BaseLLMProvider):
    """DeepSeek API client using OpenAI-compatible interface."""

    DEEPSEEK_BASE_URL = "https://api.deepseek.com"

    AVAILABLE_MODELS = [
        # DeepSeek V3.2 (Latest)
        "deepseek-chat",       # Non-thinking mode (fast)
        "deepseek-reasoner",   # Thinking mode (R1-style reasoning)
        # Legacy
        "deepseek-coder",      # Code-specialized
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.DEEPSEEK_BASE_URL)
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url
        )

    @property
    def provider_name(self) -> str:
        return "deepseek"

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
        """Send completion request to DeepSeek."""
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

        # Extract response text
        text = response.choices[0].message.content or ""

        # For deepseek-reasoner, there may be reasoning_content
        # We'll include just the final answer for consistency
        # (reasoning_content would be in raw_response if needed)

        return LLMResponse(
            text=text,
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            duration_ms=duration_ms,
            raw_response=response.model_dump()
        )

    async def validate_key(self) -> tuple[bool, Optional[str]]:
        """Validate DeepSeek API key with a minimal request."""
        try:
            await self.client.chat.completions.create(
                model="deepseek-chat",
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
