"""
AI-assisted persona generation service.

Uses an LLM to generate persona variations based on user description.
"""

import json
import re
from typing import Optional

from app.services.providers.openai_provider import OpenAIProvider
from app.services.providers.anthropic_provider import AnthropicProvider
from app.models.schemas import Persona


GENERATION_PROMPT = """You are helping create personas for testing AI model responses to psychological surveys. A persona is an ideological or demographic framing that will be prepended to each survey question.

Based on the user's description, generate {count} distinct persona variations. Each persona should have a clear perspective that could influence survey responses.

Description: {description}

Generate {count} personas as a JSON array. Each persona should have:
- name: A concise name for this persona (2-5 words)
- description: A brief explanation of this perspective (1-2 sentences, max 150 chars)
- prompt_prefix: The text that will be prepended to survey questions. Should be written in second person ("You are...") and clearly establish the perspective. Keep it under 200 characters.

Important guidelines:
- Make personas distinct from each other (e.g., different intensities, sub-groups, or angles)
- Be specific and grounded (avoid vague or generic descriptions)
- The prompt_prefix should be natural and conversational
- Ensure personas span a reasonable spectrum within the described category

Example output format:
[
  {{
    "name": "Strong Progressive",
    "description": "Advocates for significant systemic change",
    "prompt_prefix": "You are a strongly progressive individual who believes in substantial systemic reform and social change."
  }},
  {{
    "name": "Moderate Progressive",
    "description": "Favors gradual reform over rapid change",
    "prompt_prefix": "You are a moderately progressive person who supports gradual reforms and incremental improvement."
  }}
]

Now generate {count} personas for: {description}

Return ONLY the JSON array, no other text."""


async def generate_personas(
    description: str,
    count: int = 3,
    api_key: str = "",
    provider: str = "openai",
    model: Optional[str] = None,
    base_url: Optional[str] = None,
) -> list[Persona]:
    """
    Generate persona variations using AI.

    Args:
        description: User's description of the persona type
        count: Number of persona variations to generate (1-5)
        api_key: API key for the provider
        provider: Provider to use ("openai" or "anthropic")
        model: Model to use (defaults based on provider)
        base_url: Optional base URL for the provider

    Returns:
        List of generated Persona objects
    """
    count = max(1, min(5, count))  # Clamp between 1-5

    # Build the prompt
    prompt = GENERATION_PROMPT.format(
        description=description,
        count=count
    )

    # Select provider and model
    if provider == "anthropic":
        llm = AnthropicProvider(api_key, base_url)
        model = model or "claude-sonnet-4-20250514"
    else:
        llm = OpenAIProvider(api_key, base_url)
        model = model or "gpt-4o-mini"

    # Generate
    response = await llm.complete(
        prompt=prompt,
        model=model,
        temperature=0.7,  # Some creativity
        max_tokens=2000
    )

    # Parse response
    personas = parse_personas_from_response(response.text, description)

    return personas


def sanitize_id(name: str) -> str:
    """Convert a persona name to a clean, URL-safe ID."""
    # Lowercase and replace spaces/special chars with underscores
    clean = re.sub(r'[^a-z0-9]+', '_', name.lower())
    # Remove leading/trailing underscores
    clean = clean.strip('_')
    # Limit length
    return clean[:30] if clean else "persona"


def parse_personas_from_response(text: str, description: str) -> list[Persona]:
    """Parse the LLM response into Persona objects."""
    # Try to extract JSON from the response
    # Sometimes models wrap JSON in markdown code blocks
    json_match = re.search(r'\[[\s\S]*\]', text)
    if not json_match:
        raise ValueError("Could not find JSON array in response")

    json_str = json_match.group(0)

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in response: {e}")

    if not isinstance(data, list):
        raise ValueError("Response must be a JSON array")

    personas = []
    used_ids = set()

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            continue

        name = item.get("name", f"Persona {i+1}")
        desc = item.get("description", "")
        prefix = item.get("prompt_prefix", "")

        if not prefix:
            continue  # Skip if no prompt prefix

        # Generate ID from the persona name (not the description)
        base_id = sanitize_id(name)
        persona_id = f"custom_{base_id}"

        # Ensure uniqueness by adding suffix if needed
        if persona_id in used_ids:
            persona_id = f"{persona_id}_{i+1}"
        used_ids.add(persona_id)

        personas.append(Persona(
            id=persona_id,
            name=name[:50],  # Limit name length
            description=desc[:200] if desc else None,
            prompt_prefix=prefix[:500]  # Limit prefix length
        ))

    return personas
