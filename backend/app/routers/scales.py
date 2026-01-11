"""
Scale-related API endpoints.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.schemas import Scale, ScaleListResponse, ScaleItem, ResponseFormat
from app.data.loader import load_all_builtin_scales

router = APIRouter(prefix="/scales", tags=["scales"])


class CustomScaleItem(BaseModel):
    """Input format for custom scale items."""
    id: str = Field(..., min_length=1, max_length=50)
    text: str = Field(..., min_length=1, max_length=500)
    reverse_score: bool = False


class ValidateScaleRequest(BaseModel):
    """Request to validate a custom scale definition."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    citation: Optional[str] = Field(default=None, max_length=500)
    scale_min: int = Field(..., ge=0, le=10)
    scale_max: int = Field(..., ge=1, le=10)
    items: list[CustomScaleItem] = Field(..., min_length=1, max_length=100)


class ValidateScaleResponse(BaseModel):
    """Response containing validated scale."""
    valid: bool
    scale: Optional[Scale] = None
    errors: list[str] = []

# Cache for loaded scales
_scales_cache: dict[str, Scale] | None = None


def get_scales() -> dict[str, Scale]:
    """Get all scales, using cache if available."""
    global _scales_cache
    if _scales_cache is None:
        _scales_cache = load_all_builtin_scales()
    return _scales_cache


@router.get("", response_model=ScaleListResponse)
async def list_scales():
    """List all available scales."""
    scales = get_scales()
    return ScaleListResponse(
        scales=list(scales.values()),
        total=len(scales)
    )


@router.get("/{scale_name}", response_model=Scale)
async def get_scale(scale_name: str):
    """Get details for a specific scale."""
    scales = get_scales()
    if scale_name not in scales:
        raise HTTPException(status_code=404, detail=f"Scale not found: {scale_name}")
    return scales[scale_name]


@router.get("/{scale_name}/items")
async def get_scale_items(scale_name: str):
    """Get just the items for a specific scale."""
    scales = get_scales()
    if scale_name not in scales:
        raise HTTPException(status_code=404, detail=f"Scale not found: {scale_name}")
    scale = scales[scale_name]
    return {
        "scale_name": scale.name,
        "item_count": scale.item_count,
        "scale_range": scale.scale_range,
        "items": scale.items
    }


@router.post("/validate", response_model=ValidateScaleResponse)
async def validate_custom_scale(request: ValidateScaleRequest):
    """
    Validate a custom scale definition and return the formatted scale.

    This endpoint doesn't store the scale - it validates the format
    and returns a properly structured Scale object for client-side use.
    """
    errors: list[str] = []

    # Validate scale range
    if request.scale_min >= request.scale_max:
        errors.append("Scale minimum must be less than maximum")

    # Validate item IDs are unique
    item_ids = [item.id for item in request.items]
    if len(item_ids) != len(set(item_ids)):
        errors.append("All item IDs must be unique")

    # Validate name doesn't conflict with built-in scales
    existing_scales = get_scales()
    if request.name in existing_scales:
        errors.append(f"Scale name '{request.name}' conflicts with built-in scale")

    if errors:
        return ValidateScaleResponse(valid=False, errors=errors)

    # Build the Scale object
    scale = Scale(
        name=request.name,
        description=request.description,
        citation=request.citation,
        response_format=ResponseFormat(
            type="likert",
            min=request.scale_min,
            max=request.scale_max,
        ),
        items=[
            ScaleItem(
                id=item.id,
                text=item.text,
                reverse_score=item.reverse_score,
            )
            for item in request.items
        ]
    )

    return ValidateScaleResponse(valid=True, scale=scale)
