"""
Google Gemini provider client.

Uses the official google-genai Python library with async support.
"""

import time
from typing import Optional

from google import genai
from google.genai import types

from .base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API client."""

    AVAILABLE_MODELS = [
        # Gemini 2.5 Series (Latest)
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        # Gemini 2.0 Series
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        # Gemini 1.5 Series
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url)
        self.client = genai.Client(api_key=api_key)

    @property
    def provider_name(self) -> str:
        return "gemini"

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
        """Send completion request to Gemini."""
        start_time = time.perf_counter()

        # Use async client
        response = await self.client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
        )

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Extract text and token counts
        text = response.text if response.text else ""

        # Token usage from response metadata
        tokens_used = 0
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            tokens_used = (
                (response.usage_metadata.prompt_token_count or 0) +
                (response.usage_metadata.candidates_token_count or 0)
            )

        return LLMResponse(
            text=text,
            model=model,
            tokens_used=tokens_used,
            duration_ms=duration_ms,
            raw_response=None  # Gemini response isn't easily serializable
        )

    async def validate_key(self) -> tuple[bool, Optional[str]]:
        """Validate Gemini API key with a minimal request."""
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents="Hi",
                config=types.GenerateContentConfig(max_output_tokens=10)
            )
            return True, None
        except Exception as e:
            error_msg = str(e)
            if "API_KEY" in error_msg.upper() or "INVALID" in error_msg.upper():
                return False, f"Invalid API key: {error_msg}"
            return False, f"API error: {error_msg}"
