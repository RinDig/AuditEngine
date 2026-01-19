"""
Llama provider client.

Supports various Llama hosting endpoints that use OpenAI-compatible APIs:
- Together AI
- Groq
- Fireworks
- Ollama (local)
- Any OpenAI-compatible endpoint
"""

import time
from typing import Optional

from openai import AsyncOpenAI, APIError, AuthenticationError

from .base import BaseLLMProvider, LLMResponse


class LlamaProvider(BaseLLMProvider):
    """
    Llama API client for OpenAI-compatible endpoints.

    Since Llama models are served by various providers, this client
    requires a base_url to be specified. Common endpoints:
    - Together AI: https://api.together.xyz/v1
    - Groq: https://api.groq.com/openai/v1
    - Fireworks: https://api.fireworks.ai/inference/v1
    - Ollama: http://localhost:11434/v1
    """

    # Common model names across providers
    COMMON_MODELS = [
        "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "meta-llama/Llama-3.1-405B-Instruct-Turbo",
        "meta-llama/Llama-3.1-70B-Instruct-Turbo",
        "meta-llama/Llama-3.1-8B-Instruct-Turbo",
        "llama-3.3-70b-versatile",  # Groq
        "llama-3.1-70b-versatile",  # Groq
        "llama-3.1-8b-instant",  # Groq
    ]

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        if not base_url:
            raise ValueError("Llama provider requires a base_url to be specified")
        super().__init__(api_key, base_url)
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )

    @property
    def provider_name(self) -> str:
        return "llama"

    @property
    def available_models(self) -> list[str]:
        return self.COMMON_MODELS

    async def complete(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 500,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        """Send completion request to Llama endpoint."""
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
        """Validate API key with a minimal request."""
        try:
            # Try to list models - most OpenAI-compatible APIs support this
            await self.client.models.list()
            return True, None
        except AuthenticationError as e:
            return False, f"Invalid API key: {str(e)}"
        except APIError as e:
            # Some endpoints don't support model listing, try a minimal completion
            try:
                models = self.COMMON_MODELS
                # Try first model in list
                for model in models[:3]:
                    try:
                        await self.client.chat.completions.create(
                            model=model,
                            messages=[{"role": "user", "content": "Hi"}],
                            max_tokens=10,
                        )
                        return True, None
                    except Exception:
                        continue
                return False, f"Could not validate: {str(e)}"
            except Exception as e2:
                return False, f"Validation failed: {str(e2)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
