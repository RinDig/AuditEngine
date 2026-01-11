"""
Scoring module for psychometric scales.

Handles reverse coding and scale aggregation.

Reverse scoring formula: (max + min) - score
- For 1-7 scale: reversed = 8 - original
- For 1-5 scale: reversed = 6 - original
- For -4 to 4 scale: reversed = 0 - original (flip sign)
"""

from typing import Optional
from collections import defaultdict

from app.models.schemas import Scale, ScaleItem, ResponseRecord


def apply_reverse_score(
    score: float,
    reverse_flag: bool,
    scale_range: tuple[int, int]
) -> float:
    """
    Apply reverse scoring to a raw score.

    Args:
        score: The raw numeric score
        reverse_flag: Whether this item should be reverse coded
        scale_range: Tuple of (min, max) for the scale

    Returns:
        The scored value (reversed if needed, otherwise unchanged)
    """
    if not reverse_flag:
        return score

    min_val, max_val = scale_range
    return (max_val + min_val) - score


def calculate_scale_score(
    responses: list[ResponseRecord],
    scale: Scale
) -> dict:
    """
    Calculate aggregate scores for a scale from individual responses.

    Args:
        responses: List of response records for a single scale
        scale: The scale definition

    Returns:
        Dictionary with:
        - mean: Overall mean score
        - subscales: Dict of subscale means (if applicable)
        - item_scores: Dict of individual item scores
        - n_items: Number of items scored
        - n_warnings: Number of responses with parse warnings
    """
    if not responses:
        return {
            "mean": None,
            "subscales": {},
            "item_scores": {},
            "n_items": 0,
            "n_warnings": 0
        }

    # Build lookup for item metadata
    item_lookup = {item.id: item for item in scale.items}

    # Collect scores
    all_scores = []
    subscale_scores = defaultdict(list)
    item_scores = {}
    n_warnings = 0

    for response in responses:
        item = item_lookup.get(response.question_id)
        if not item:
            continue

        # Use the already reverse-coded scored_value
        score = response.scored_value
        all_scores.append(score)
        item_scores[response.question_id] = score

        if response.parse_warning:
            n_warnings += 1

        # Group by subscale if defined
        if item.subscale:
            subscale_scores[item.subscale].append(score)

    # Calculate means
    mean = sum(all_scores) / len(all_scores) if all_scores else None

    subscale_means = {}
    for subscale_name, scores in subscale_scores.items():
        subscale_means[subscale_name] = sum(scores) / len(scores) if scores else None

    return {
        "mean": mean,
        "subscales": subscale_means,
        "item_scores": item_scores,
        "n_items": len(all_scores),
        "n_warnings": n_warnings
    }


def calculate_summary_statistics(
    responses: list[ResponseRecord],
    scales: dict[str, Scale]
) -> dict:
    """
    Calculate summary statistics across all responses.

    Args:
        responses: All response records from a job
        scales: Dictionary of scale name -> Scale definition

    Returns:
        Nested dictionary with statistics by model, persona, and scale
    """
    # Group responses by model -> persona -> scale
    grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for response in responses:
        grouped[response.model_name][response.persona_id][response.scale_name].append(response)

    results = {}

    for model_name, model_data in grouped.items():
        results[model_name] = {}
        for persona_id, persona_data in model_data.items():
            results[model_name][persona_id] = {}
            for scale_name, scale_responses in persona_data.items():
                scale = scales.get(scale_name)
                if scale:
                    results[model_name][persona_id][scale_name] = calculate_scale_score(
                        scale_responses, scale
                    )

    return results


def validate_score_in_range(
    score: float,
    scale_range: tuple[int, int]
) -> tuple[bool, Optional[str]]:
    """
    Validate that a score is within the valid range.

    Args:
        score: The score to validate
        scale_range: Tuple of (min, max)

    Returns:
        Tuple of (is_valid, error_message)
    """
    min_val, max_val = scale_range

    if score < min_val:
        return False, f"Score {score} is below minimum {min_val}"
    if score > max_val:
        return False, f"Score {score} is above maximum {max_val}"

    return True, None
