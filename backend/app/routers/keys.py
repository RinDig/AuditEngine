"""
API key validation endpoints.
"""

import re
import logging
from fastapi import APIRouter

from app.models.schemas import APIKeyConfig, APIKeyStatus, ProviderType
from app.services.providers import create_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/keys", tags=["keys"])


def sanitize_error_message(error: str | None) -> str | None:
    """
    Sanitize error messages to prevent API key leakage.

    Removes patterns that look like API keys from error messages
    before they're returned to the client.
    """
    if not error:
        return error

    # Patterns that match common API key formats
    key_patterns = [
        r'sk-[a-zA-Z0-9_-]{20,}',           # OpenAI keys
        r'sk-ant-[a-zA-Z0-9_-]{20,}',       # Anthropic keys
        r'xai-[a-zA-Z0-9_-]{20,}',          # xAI keys
        r'LA-[a-zA-Z0-9_-]{20,}',           # Llama keys
        r'AIza[a-zA-Z0-9_-]{30,}',          # Google/Gemini keys
        r'gsk_[a-zA-Z0-9_-]{20,}',          # Groq keys
        r'[a-zA-Z0-9_-]{32,}',              # Generic long tokens (be careful - this is broad)
    ]

    sanitized = error
    for pattern in key_patterns[:-1]:  # Skip the generic pattern for now
        sanitized = re.sub(pattern, '[REDACTED]', sanitized)

    return sanitized


@router.post("/validate", response_model=APIKeyStatus)
async def validate_api_key(config: APIKeyConfig):
    """
    Validate an API key by making a test request to the provider.

    Returns the validation status and list of available models.
    """
    try:
        provider = create_provider(
            provider_type=config.provider.value,
            api_key=config.api_key.get_secret_value(),
            base_url=config.base_url
        )

        is_valid, error = await provider.validate_key()

        return APIKeyStatus(
            provider=config.provider,
            is_valid=is_valid,
            error=sanitize_error_message(error),
            available_models=provider.available_models if is_valid else []
        )

    except ValueError as e:
        # Log full error for debugging, return sanitized version to client
        logger.warning(f"API key validation ValueError for {config.provider}: {e}")
        return APIKeyStatus(
            provider=config.provider,
            is_valid=False,
            error=sanitize_error_message(str(e)),
            available_models=[]
        )
    except Exception as e:
        # Log full error for debugging, return generic message to client
        logger.exception(f"API key validation failed for {config.provider}")
        return APIKeyStatus(
            provider=config.provider,
            is_valid=False,
            error="Validation failed due to an unexpected error",
            available_models=[]
        )
