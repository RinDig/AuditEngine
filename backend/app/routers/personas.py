"""
Persona-related API endpoints.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.schemas import Persona, PersonaListResponse
from app.data.loader import load_builtin_personas
from app.services.persona_generator import generate_personas

router = APIRouter(prefix="/personas", tags=["personas"])


class GeneratePersonasRequest(BaseModel):
    """Request to generate personas with AI."""
    description: str = Field(..., min_length=10, max_length=500, description="Description of the persona type to generate")
    count: int = Field(default=3, ge=1, le=5, description="Number of personas to generate")
    provider: str = Field(default="openai", description="AI provider to use (openai or anthropic)")
    model: Optional[str] = Field(default=None, description="Model to use (optional)")
    api_key: str = Field(..., min_length=1, description="API key for the provider")
    base_url: Optional[str] = Field(default=None, description="Optional base URL for the provider")


class GeneratePersonasResponse(BaseModel):
    """Response containing generated personas."""
    personas: list[Persona]
    count: int

# Cache for loaded personas
_personas_cache: dict[str, Persona] | None = None


def get_personas() -> dict[str, Persona]:
    """Get all personas, using cache if available."""
    global _personas_cache
    if _personas_cache is None:
        _personas_cache = load_builtin_personas()
    return _personas_cache


@router.get("", response_model=PersonaListResponse)
async def list_personas():
    """List all available personas."""
    personas = get_personas()
    return PersonaListResponse(
        personas=list(personas.values()),
        total=len(personas)
    )


@router.get("/{persona_id}", response_model=Persona)
async def get_persona(persona_id: str):
    """Get details for a specific persona."""
    personas = get_personas()
    if persona_id not in personas:
        raise HTTPException(status_code=404, detail=f"Persona not found: {persona_id}")
    return personas[persona_id]


@router.post("/generate", response_model=GeneratePersonasResponse)
async def generate_personas_endpoint(request: GeneratePersonasRequest):
    """
    Generate persona variations using AI.

    Provide a description of the persona type and the AI will generate
    variations with different intensities or perspectives.
    """
    try:
        personas = await generate_personas(
            description=request.description,
            count=request.count,
            api_key=request.api_key,
            provider=request.provider,
            model=request.model,
            base_url=request.base_url,
        )

        return GeneratePersonasResponse(
            personas=personas,
            count=len(personas)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate personas: {str(e)}")
