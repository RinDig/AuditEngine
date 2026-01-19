"""
Google Gemini provider client.

Uses the official google-genai Python library with async support.
"""

import base64
import time
from typing import Optional

from google import genai
from google.genai import types

from .base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API client."""

    AVAILABLE_MODELS = [
        # Gemini 2.5 Series (Latest)
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        # Gemini 2.0 Series (retiring March 2026)
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]

    # All Gemini models support vision natively
    VISION_MODELS = [
        # Gemini 2.5 Series
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        # Gemini 2.0 Series
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
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

    @property
    def vision_models(self) -> list[str]:
        return self.VISION_MODELS

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

    async def complete_with_vision(
        self,
        prompt: str,
        image_data: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 1000
    ) -> LLMResponse:
        """Send completion request with image to Gemini."""
        if model not in self.VISION_MODELS:
            raise ValueError(f"Model {model} does not support vision")

        start_time = time.perf_counter()

        # Parse data URI and get raw bytes
        mime_type = "image/jpeg"
        image_bytes_str = image_data

        if image_data.startswith("data:"):
            parts = image_data.split(",", 1)
            if len(parts) == 2:
                header, image_bytes_str = parts
                if "image/png" in header:
                    mime_type = "image/png"
                elif "image/gif" in header:
                    mime_type = "image/gif"
                elif "image/webp" in header:
                    mime_type = "image/webp"

        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_bytes_str)

        # Create image part for Gemini
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        # Build content with image and text
        contents = [image_part, prompt]

        response = await self.client.aio.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
        )

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        text = response.text if response.text else ""

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
            raw_response=None
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
