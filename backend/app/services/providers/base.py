"""
Base class for LLM provider clients.

All provider implementations must inherit from this base class
and implement the required methods.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider."""
    text: str
    model: str
    tokens_used: int
    duration_ms: int
    raw_response: Optional[dict] = None


class BaseLLMProvider(ABC):
    """Abstract base class for LLM provider clients."""

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name (e.g., 'openai', 'anthropic')."""
        pass

    @property
    @abstractmethod
    def available_models(self) -> list[str]:
        """Return list of available model identifiers."""
        pass

    @property
    def vision_models(self) -> list[str]:
        """
        Return list of models that support vision/image input.
        Override in subclasses that support vision.
        Default: empty list (no vision support).
        """
        return []

    @property
    def supports_vision(self) -> bool:
        """Return True if this provider has any vision-capable models."""
        return len(self.vision_models) > 0

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 500
    ) -> LLMResponse:
        """
        Send a completion request to the LLM.

        Args:
            prompt: The full prompt text
            model: Model identifier
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Returns:
            LLMResponse with the model's response
        """
        pass

    async def complete_with_vision(
        self,
        prompt: str,
        image_data: str,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 1000
    ) -> LLMResponse:
        """
        Send a completion request with an image to the LLM.

        Args:
            prompt: The prompt text
            image_data: Base64-encoded image data (with or without data URI prefix)
            model: Model identifier (must be in vision_models)
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Returns:
            LLMResponse with the model's response

        Raises:
            NotImplementedError: If provider doesn't support vision
            ValueError: If model doesn't support vision
        """
        raise NotImplementedError(f"{self.provider_name} does not support vision")

    @abstractmethod
    async def validate_key(self) -> tuple[bool, Optional[str]]:
        """
        Validate that the API key is valid.

        Returns:
            Tuple of (is_valid, error_message)
        """
        pass

    def get_model_identifier(self, model_name: str) -> str:
        """
        Convert a friendly model name to the API identifier.
        Override in subclasses if needed.
        """
        return model_name
