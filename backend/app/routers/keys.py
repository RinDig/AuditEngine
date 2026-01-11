"""
API key validation endpoints.
"""

from fastapi import APIRouter

from app.models.schemas import APIKeyConfig, APIKeyStatus, ProviderType
from app.services.providers import create_provider

router = APIRouter(prefix="/keys", tags=["keys"])


@router.post("/validate", response_model=APIKeyStatus)
async def validate_api_key(config: APIKeyConfig):
    """
    Validate an API key by making a test request to the provider.

    Returns the validation status and list of available models.
    """
    try:
        provider = create_provider(
            provider_type=config.provider.value,
            api_key=config.api_key,
            base_url=config.base_url
        )

        is_valid, error = await provider.validate_key()

        return APIKeyStatus(
            provider=config.provider,
            is_valid=is_valid,
            error=error,
            available_models=provider.available_models if is_valid else []
        )

    except ValueError as e:
        return APIKeyStatus(
            provider=config.provider,
            is_valid=False,
            error=str(e),
            available_models=[]
        )
    except Exception as e:
        return APIKeyStatus(
            provider=config.provider,
            is_valid=False,
            error=f"Unexpected error: {str(e)}",
            available_models=[]
        )
