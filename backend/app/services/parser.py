"""
Multi-strategy response parser for LLM outputs.

This parser handles the inconsistent response formats from different LLMs.
The strategy order is critical - stop at first success.

Strategies (in order):
1. JSON format: {"rating": 5, "justification": "..."}
2. Simple format: "Rating: 5" or "Score: 5"
3. First valid number in text within scale range
4. Text-to-number conversion ("strongly agree" -> 7)
5. Fallback: scale midpoint with warning flag

IMPORTANT: Never discard a response. Always extract something usable.
"""

import json
import re
from typing import Optional

from app.models.schemas import ParsedResponse, ParseWarning


# Text-to-number mappings for common Likert responses
TEXT_TO_NUMBER_7POINT = {
    # Standard labels
    "strongly disagree": 1,
    "disagree": 2,
    "slightly disagree": 3,
    "neutral": 4,
    "slightly agree": 5,
    "agree": 6,
    "strongly agree": 7,
    # Variations
    "somewhat disagree": 3,
    "somewhat agree": 5,
    "neither agree nor disagree": 4,
    "neither": 4,
    "moderately disagree": 2,
    "moderately agree": 6,
    "very strongly disagree": 1,
    "very strongly agree": 7,
    "completely disagree": 1,
    "completely agree": 7,
    "totally disagree": 1,
    "totally agree": 7,
}

TEXT_TO_NUMBER_5POINT = {
    "strongly disagree": 1,
    "disagree": 2,
    "neutral": 3,
    "neither agree nor disagree": 3,
    "agree": 4,
    "strongly agree": 5,
    "somewhat disagree": 2,
    "somewhat agree": 4,
}

# For NFC scale (-4 to 4)
TEXT_TO_NUMBER_9POINT_CENTERED = {
    "very strongly disagree": -4,
    "strongly disagree": -3,
    "moderately disagree": -2,
    "slightly disagree": -1,
    "neutral": 0,
    "neither agree nor disagree": 0,
    "slightly agree": 1,
    "moderately agree": 2,
    "strongly agree": 3,
    "very strongly agree": 4,
}


def get_text_mapping(scale_range: tuple[int, int]) -> dict[str, int]:
    """Get the appropriate text-to-number mapping based on scale range."""
    min_val, max_val = scale_range
    range_size = max_val - min_val + 1

    if min_val < 0:  # Centered scale like NFC
        return TEXT_TO_NUMBER_9POINT_CENTERED
    elif range_size == 5:
        return TEXT_TO_NUMBER_5POINT
    else:  # Default to 7-point
        return TEXT_TO_NUMBER_7POINT


def parse_response(raw_text: str, scale_range: tuple[int, int]) -> ParsedResponse:
    """
    Parse LLM response to extract numeric score.

    Args:
        raw_text: The raw response text from the LLM
        scale_range: Tuple of (min, max) for valid score range

    Returns:
        ParsedResponse with extracted score and metadata
    """
    min_val, max_val = scale_range

    # Strategy 1: JSON format
    result = _try_json_parse(raw_text, scale_range)
    if result:
        return result

    # Strategy 2: Simple format (Rating: X, Score: X)
    result = _try_simple_format(raw_text, scale_range)
    if result:
        return result

    # Strategy 3: First valid number in range
    result = _try_first_number(raw_text, scale_range)
    if result:
        return result

    # Strategy 4: Text-to-number conversion
    result = _try_text_conversion(raw_text, scale_range)
    if result:
        return result

    # Strategy 5: Fallback to midpoint
    midpoint = (min_val + max_val) / 2
    return ParsedResponse(
        numeric_score=midpoint,
        justification=None,
        parse_method="fallback_midpoint",
        warning=ParseWarning.FALLBACK_TO_MIDPOINT,
        raw_text=raw_text
    )


def _try_json_parse(raw_text: str, scale_range: tuple[int, int]) -> Optional[ParsedResponse]:
    """Try to parse response as JSON with rating field."""
    min_val, max_val = scale_range

    # Try to find JSON in the response
    json_patterns = [
        r'\{[^{}]*"rating"[^{}]*\}',
        r'\{[^{}]*"score"[^{}]*\}',
        r'\{[^{}]*"response"[^{}]*\}',
    ]

    for pattern in json_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE | re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                # Look for numeric value in common keys
                for key in ['rating', 'score', 'response', 'value', 'answer']:
                    if key in data:
                        value = data[key]
                        if isinstance(value, (int, float)):
                            score = _clamp_to_range(value, scale_range)
                            justification = data.get('justification') or data.get('explanation') or data.get('reason')
                            warning = ParseWarning.OUT_OF_RANGE_CLAMPED if score != value else None
                            return ParsedResponse(
                                numeric_score=score,
                                justification=justification,
                                parse_method="json",
                                warning=warning,
                                raw_text=raw_text
                            )
            except json.JSONDecodeError:
                continue

    return None


def _try_simple_format(raw_text: str, scale_range: tuple[int, int]) -> Optional[ParsedResponse]:
    """Try to parse simple format like 'Rating: 5' or 'Score: 5'."""
    patterns = [
        r'(?:rating|score|response|answer|value)\s*[:=]\s*(\d+(?:\.\d+)?)',
        r'(?:my\s+)?(?:rating|score|response|answer)\s+(?:is|would be)\s+(\d+(?:\.\d+)?)',
        r'i\s+(?:would\s+)?(?:rate|score|give)\s+(?:this\s+)?(?:a\s+)?(\d+(?:\.\d+)?)',
    ]

    for pattern in patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            value = float(match.group(1))
            score = _clamp_to_range(value, scale_range)
            warning = ParseWarning.OUT_OF_RANGE_CLAMPED if score != value else None
            return ParsedResponse(
                numeric_score=score,
                justification=_extract_justification(raw_text),
                parse_method="simple_format",
                warning=warning,
                raw_text=raw_text
            )

    return None


def _try_first_number(raw_text: str, scale_range: tuple[int, int]) -> Optional[ParsedResponse]:
    """Extract first valid number within scale range."""
    min_val, max_val = scale_range

    # Find all numbers in the text
    numbers = re.findall(r'-?\d+(?:\.\d+)?', raw_text)

    for num_str in numbers:
        value = float(num_str)
        if min_val <= value <= max_val:
            return ParsedResponse(
                numeric_score=value,
                justification=_extract_justification(raw_text),
                parse_method="first_number",
                warning=ParseWarning.FIRST_NUMBER_EXTRACTION,
                raw_text=raw_text
            )

    return None


def _try_text_conversion(raw_text: str, scale_range: tuple[int, int]) -> Optional[ParsedResponse]:
    """Convert text responses like 'strongly agree' to numbers."""
    text_lower = raw_text.lower()
    mapping = get_text_mapping(scale_range)

    # Sort by length descending to match longer phrases first
    sorted_phrases = sorted(mapping.keys(), key=len, reverse=True)

    for phrase in sorted_phrases:
        if phrase in text_lower:
            score = mapping[phrase]
            # Adjust score if it's outside the scale range
            score = _clamp_to_range(score, scale_range)
            return ParsedResponse(
                numeric_score=score,
                justification=_extract_justification(raw_text),
                parse_method="text_conversion",
                warning=ParseWarning.TEXT_CONVERSION,
                raw_text=raw_text
            )

    return None


def _clamp_to_range(value: float, scale_range: tuple[int, int]) -> float:
    """Clamp a value to the valid scale range."""
    min_val, max_val = scale_range
    return max(min_val, min(max_val, value))


def _extract_justification(raw_text: str) -> Optional[str]:
    """Try to extract justification/explanation from response."""
    # Look for common justification patterns
    patterns = [
        r'(?:justification|explanation|reason|because|reasoning)\s*[:=]?\s*(.+?)(?:\n|$)',
        r'(?:this is because|i (?:think|believe|feel) (?:this|that) because)\s+(.+?)(?:\n|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE | re.DOTALL)
        if match:
            justification = match.group(1).strip()
            if len(justification) > 10:  # Minimum meaningful length
                return justification[:500]  # Cap length

    return None
