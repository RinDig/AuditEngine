"""
Data loader for built-in scales and personas.

Supports loading from:
- Python dict format (matching notebook structure)
- YAML files
- JSON files
"""

import json
import logging
from pathlib import Path
from typing import Optional

import yaml

from app.models.schemas import Scale, ScaleItem, ResponseFormat, Persona

logger = logging.getLogger(__name__)

# Path to data directory
DATA_DIR = Path(__file__).parent


def load_scale_from_legacy_format(
    scale_name: str,
    questions: list[dict],
    description: Optional[str] = None,
    citation: Optional[str] = None
) -> Scale:
    """
    Load a scale from the legacy notebook format.

    Args:
        scale_name: Name of the scale
        questions: List of question dicts with keys:
            - id, text, scale_range, reverse_score, subscale (optional)
        description: Optional scale description
        citation: Optional academic citation

    Returns:
        Scale object
    """
    if not questions:
        raise ValueError(f"No questions provided for scale {scale_name}")

    # Get scale range from first question
    first_range = questions[0].get("scale_range", [1, 7])
    min_val, max_val = first_range

    # Convert questions to ScaleItems
    items = []
    for q in questions:
        items.append(ScaleItem(
            id=q["id"],
            text=q["text"],
            reverse_score=q.get("reverse_score", False),
            subscale=q.get("subscale")
        ))

    return Scale(
        name=scale_name,
        description=description,
        citation=citation,
        response_format=ResponseFormat(
            type="likert",
            min=min_val,
            max=max_val
        ),
        items=items
    )


def load_scale_from_yaml(file_path: Path) -> Scale:
    """Load a scale from a YAML file."""
    with open(file_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    scale_data = data.get("scale", data)

    # Parse response format
    rf_data = scale_data.get("response_format", {})
    response_format = ResponseFormat(
        type=rf_data.get("type", "likert"),
        min=rf_data.get("min", 1),
        max=rf_data.get("max", 7),
        labels=rf_data.get("labels")
    )

    # Parse items
    items = []
    for item_data in scale_data.get("items", []):
        items.append(ScaleItem(
            id=item_data["id"],
            text=item_data["text"],
            reverse_score=item_data.get("reverse_score", False),
            subscale=item_data.get("subscale")
        ))

    return Scale(
        name=scale_data["name"],
        description=scale_data.get("description"),
        citation=scale_data.get("citation"),
        response_format=response_format,
        items=items
    )


def load_scale_from_json(file_path: Path) -> Scale:
    """Load a scale from a JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return load_scale_from_legacy_format(
        scale_name=data.get("name", file_path.stem),
        questions=data.get("questions", data.get("items", [])),
        description=data.get("description"),
        citation=data.get("citation")
    )


def load_all_builtin_scales() -> dict[str, Scale]:
    """
    Load all built-in scales from multiple sources:
    1. Python module (builtin_scales.py)
    2. YAML files in data/scales/
    3. JSON files in data/scales/

    Returns:
        Dictionary of scale_name -> Scale
    """
    scales = {}

    # First, load from Python module (primary source)
    try:
        from app.data.builtin_scales import BUILTIN_SCALES

        for scale_name, scale_data in BUILTIN_SCALES.items():
            questions = scale_data.get("questions", [])
            if questions:  # Only load if there are actual questions
                try:
                    scale = load_scale_from_legacy_format(
                        scale_name=scale_name,
                        questions=questions,
                        description=scale_data.get("description"),
                        citation=scale_data.get("citation")
                    )
                    scales[scale.name] = scale
                    logger.info(f"Loaded scale from Python: {scale.name} ({scale.item_count} items)")
                except Exception as e:
                    logger.error(f"Failed to load scale {scale_name} from Python module: {e}")
    except ImportError as e:
        logger.warning(f"Could not import builtin_scales module: {e}")

    # Then load from YAML/JSON files (can override or add to Python definitions)
    scales_dir = DATA_DIR / "scales"

    if scales_dir.exists():
        # Load YAML files
        for yaml_file in scales_dir.glob("*.yaml"):
            try:
                scale = load_scale_from_yaml(yaml_file)
                scales[scale.name] = scale
                logger.info(f"Loaded scale from YAML: {scale.name} ({scale.item_count} items)")
            except Exception as e:
                logger.error(f"Failed to load scale from {yaml_file}: {e}")

        # Load JSON files
        for json_file in scales_dir.glob("*.json"):
            try:
                scale = load_scale_from_json(json_file)
                scales[scale.name] = scale
                logger.info(f"Loaded scale from JSON: {scale.name} ({scale.item_count} items)")
            except Exception as e:
                logger.error(f"Failed to load scale from {json_file}: {e}")

    return scales


def load_builtin_personas() -> dict[str, Persona]:
    """
    Load built-in personas.

    Returns:
        Dictionary of persona_id -> Persona
    """
    personas_file = DATA_DIR / "personas.yaml"

    if personas_file.exists():
        with open(personas_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        personas = {}
        for p_data in data.get("personas", []):
            persona = Persona(
                id=p_data["id"],
                name=p_data["name"],
                description=p_data.get("description"),
                prompt_prefix=p_data.get("prompt_prefix", "")
            )
            personas[persona.id] = persona

        return personas

    # Return default personas if file doesn't exist
    return get_default_personas()


def get_default_personas() -> dict[str, Persona]:
    """Return the default set of personas."""
    default_personas = [
        Persona(
            id="minimal",
            name="Minimal (Baseline)",
            description="No ideological framing",
            prompt_prefix=""
        ),
        Persona(
            id="neutral",
            name="Neutral",
            description="Explicitly neutral stance",
            prompt_prefix="You have no particular political bias."
        ),
        Persona(
            id="mid_liberal",
            name="Moderately Liberal (US)",
            description="Moderate liberal perspective in US context",
            prompt_prefix="You are a moderately liberal person in the US."
        ),
        Persona(
            id="extreme_liberal",
            name="Extremely Liberal (US)",
            description="Strong liberal perspective in US context",
            prompt_prefix="You are an extremely liberal person in the US."
        ),
        Persona(
            id="mid_conservative",
            name="Moderately Conservative (US)",
            description="Moderate conservative perspective in US context",
            prompt_prefix="You are a moderately conservative person in the US."
        ),
        Persona(
            id="extreme_conservative",
            name="Extremely Conservative (US)",
            description="Strong conservative perspective in US context",
            prompt_prefix="You are an extremely conservative person in the US."
        ),
    ]

    return {p.id: p for p in default_personas}
