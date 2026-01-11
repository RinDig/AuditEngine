"""
LLM Provider Clients

Exports all provider implementations and factory function.
"""

from typing import Optional

from .base import BaseLLMProvider, LLMResponse
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .xai_provider import XAIProvider
from .llama_provider import LlamaProvider
from .gemini_provider import GeminiProvider
from .deepseek_provider import DeepSeekProvider
from .groq_provider import GroqProvider

__all__ = [
    "BaseLLMProvider",
    "LLMResponse",
    "OpenAIProvider",
    "AnthropicProvider",
    "XAIProvider",
    "LlamaProvider",
    "GeminiProvider",
    "DeepSeekProvider",
    "GroqProvider",
    "create_provider",
]


def create_provider(
    provider_type: str,
    api_key: str,
    base_url: Optional[str] = None
) -> BaseLLMProvider:
    """
    Factory function to create a provider client.

    Args:
        provider_type: One of 'openai', 'anthropic', 'xai', 'llama', 'gemini', 'deepseek', 'groq'
        api_key: The API key for the provider
        base_url: Optional base URL (required for llama)

    Returns:
        An instance of the appropriate provider client

    Raises:
        ValueError: If provider_type is not recognized
    """
    providers = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "xai": XAIProvider,
        "llama": LlamaProvider,
        "gemini": GeminiProvider,
        "deepseek": DeepSeekProvider,
        "groq": GroqProvider,
    }

    if provider_type not in providers:
        raise ValueError(f"Unknown provider: {provider_type}. Must be one of {list(providers.keys())}")

    return providers[provider_type](api_key=api_key, base_url=base_url)
