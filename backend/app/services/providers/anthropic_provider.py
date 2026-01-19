"""
Anthropic provider client.

Uses the official anthropic Python library with async support.
"""

import base64
import time
from typing import Optional

from anthropic import AsyncAnthropic, APIError, AuthenticationError

from .base import BaseLLMProvider, LLMResponse


class AnthropicProvider(BaseLLMProvider):
    """Anthropic API client."""

    AVAILABLE_MODELS = [
        # Claude 4.5 Series (Latest - November 2025)
        "claude-opus-4-5-20251101",
        "claude-opus-4-5",
        "claude-sonnet-4-5-20250929",
        "claude-sonnet-4-5",
        "claude-haiku-4-5-20251001",
        "claude-haiku-4-5",
        # Claude 4 Series
        "claude-sonnet-4-20250514",
        "claude-sonnet-4-0",
        "claude-opus-4-20250514",
        "claude-opus-4-0",
        "claude-opus-4-1-20250805",
        # Claude 3.7 Series
        "claude-3-7-sonnet-latest",
        "claude-3-7-sonnet-20250219",
        # Claude 3.5 Series (legacy)
        "claude-3-5-haiku-latest",
        "claude-3-5-haiku-20241022",
    ]

    # All Claude 3+ models support vision
    VISION_MODELS = [
        # Claude 4.5 Series (Latest - November 2025)
        "claude-opus-4-5-20251101",
        "claude-opus-4-5",
        "claude-sonnet-4-5-20250929",
        "claude-sonnet-4-5",
        "claude-haiku-4-5-20251001",
        "claude-haiku-4-5",
        # Claude 4 Series
        "claude-sonnet-4-20250514",
        "claude-sonnet-4-0",
        "claude-opus-4-20250514",
        "claude-opus-4-0",
        "claude-opus-4-1-20250805",
        # Claude 3.7 Series
        "claude-3-7-sonnet-latest",
        "claude-3-7-sonnet-20250219",
        # Claude 3.5 Series (legacy)
        "claude-3-5-haiku-latest",
        "claude-3-5-haiku-20241022",
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url)
        self.client = AsyncAnthropic(
            api_key=api_key,
            base_url=base_url
        )

    @property
    def provider_name(self) -> str:
        return "anthropic"

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
        """Send completion request to Anthropic."""
        start_time = time.perf_counter()

        # Build request with optional system prompt
        request_params = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]
        }
        if system_prompt:
            request_params["system"] = system_prompt

        response = await self.client.messages.create(**request_params)

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Extract text from response
        text = ""
        if response.content:
            text = response.content[0].text if response.content[0].type == "text" else ""

        # Calculate tokens
        tokens_used = (response.usage.input_tokens + response.usage.output_tokens) if response.usage else 0

        return LLMResponse(
            text=text,
            model=response.model,
            tokens_used=tokens_used,
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
        """Send completion request with image to Anthropic."""
        if model not in self.VISION_MODELS:
            raise ValueError(f"Model {model} does not support vision")

        start_time = time.perf_counter()

        # Parse data URI format if present
        media_type = "image/jpeg"  # default
        image_bytes = image_data

        if image_data.startswith("data:"):
            # Parse data URI: data:image/png;base64,<data>
            parts = image_data.split(",", 1)
            if len(parts) == 2:
                header, image_bytes = parts
                if "image/png" in header:
                    media_type = "image/png"
                elif "image/gif" in header:
                    media_type = "image/gif"
                elif "image/webp" in header:
                    media_type = "image/webp"

        # Build message with image (Anthropic format)
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_bytes,
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]

        # Build request with optional system prompt
        request_params = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        }
        if system_prompt:
            request_params["system"] = system_prompt

        response = await self.client.messages.create(**request_params)

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Extract text from response
        text = ""
        if response.content:
            text = response.content[0].text if response.content[0].type == "text" else ""

        # Calculate tokens
        tokens_used = (response.usage.input_tokens + response.usage.output_tokens) if response.usage else 0

        return LLMResponse(
            text=text,
            model=response.model,
            tokens_used=tokens_used,
            duration_ms=duration_ms,
            raw_response=response.model_dump()
        )

    async def validate_key(self) -> tuple[bool, Optional[str]]:
        """Validate Anthropic API key with a minimal request."""
        try:
            # Send a minimal message to validate
            await self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "Hi"}]
            )
            return True, None
        except AuthenticationError as e:
            return False, f"Invalid API key: {str(e)}"
        except APIError as e:
            return False, f"API error: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
