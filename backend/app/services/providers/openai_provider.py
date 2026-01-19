"""
OpenAI provider client.

Uses the official openai Python library with async support.
"""

import time
from typing import Optional

from openai import AsyncOpenAI, APIError, AuthenticationError

from .base import BaseLLMProvider, LLMResponse


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API client."""

    AVAILABLE_MODELS = [
        # GPT-5.2 Series (Latest - January 2026)
        "gpt-5.2",
        "gpt-5.2-chat-latest",
        "gpt-5.2-pro",
        # GPT-5.1 Series
        "gpt-5.1",
        "gpt-5.1-chat-latest",
        # GPT-5 Series
        "gpt-5",
        "gpt-5-mini",
        "gpt-5-nano",
        # GPT-4o Series
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4o-2024-11-20",
        "gpt-4o-2024-08-06",
        # GPT-4.1 Series
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        # O-Series (Reasoning)
        "o1",
        "o1-mini",
        "o1-preview",
        "o3-mini",
        # GPT-4 Legacy
        "gpt-4-turbo",
        "gpt-4-turbo-preview",
        "gpt-4",
        # GPT-3.5
        "gpt-3.5-turbo",
    ]

    # Models that support vision/image input
    VISION_MODELS = [
        "gpt-5.2",
        "gpt-5.2-chat-latest",
        "gpt-5.2-pro",
        "gpt-5.1",
        "gpt-5.1-chat-latest",
        "gpt-5",
        "gpt-5-mini",
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4o-2024-11-20",
        "gpt-4o-2024-08-06",
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4-turbo",
        "o1",
        "o1-preview",
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url)
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )

    @property
    def provider_name(self) -> str:
        return "openai"

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
        """Send completion request to OpenAI."""
        start_time = time.perf_counter()

        # o1/o3 reasoning models don't support temperature parameter
        is_reasoning_model = model.startswith("o1") or model.startswith("o3")

        if is_reasoning_model:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_completion_tokens=max_tokens,
            )
        else:
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

    async def complete_with_vision(
        self,
        prompt: str,
        image_data: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 1000
    ) -> LLMResponse:
        """Send completion request with image to OpenAI."""
        if model not in self.VISION_MODELS:
            raise ValueError(f"Model {model} does not support vision")

        start_time = time.perf_counter()

        # Ensure image_data has proper data URI format
        if not image_data.startswith("data:"):
            # Assume JPEG if no prefix
            image_data = f"data:image/jpeg;base64,{image_data}"

        # Build message with image
        messages = [
            {
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
            }
        ]

        # o1 models don't support temperature
        is_reasoning_model = model.startswith("o1") or model.startswith("o3")

        if is_reasoning_model:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_completion_tokens=max_tokens,
            )
        else:
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
        """Validate OpenAI API key with a minimal request."""
        try:
            # List models as a lightweight validation
            await self.client.models.list()
            return True, None
        except AuthenticationError as e:
            return False, f"Invalid API key: {str(e)}"
        except APIError as e:
            return False, f"API error: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
