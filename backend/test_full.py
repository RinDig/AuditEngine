"""
Full test script for Ethics Engine with organized output files.

Outputs:
- results/responses_{timestamp}.csv - All individual responses
- results/responses_{timestamp}.json - Full data with metadata
- results/summary_{timestamp}.csv - Summary statistics by model/persona/scale
"""

import asyncio
import csv
import json
import os
from datetime import datetime
from pathlib import Path

# Add the app directory to the path
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env file
from dotenv import load_dotenv
load_dotenv()

from app.models.schemas import (
    Scale, ScaleItem, ResponseFormat, Persona,
    Job, JobConfig, ResponseRecord
)
from app.services.orchestrator import Orchestrator
from app.services.providers import OpenAIProvider, AnthropicProvider
from app.data.loader import load_all_builtin_scales, load_builtin_personas


def save_responses_csv(responses: list[ResponseRecord], filepath: Path):
    """Save responses to CSV file."""
    if not responses:
        return

    fieldnames = [
        'model_name', 'scale_name', 'question_id', 'question_text',
        'persona_id', 'run_number', 'temperature',
        'numeric_score', 'scored_value', 'is_reverse_coded',
        'parse_method', 'parse_warning', 'justification',
        'tokens_used', 'duration_ms', 'timestamp'
    ]

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for r in responses:
            writer.writerow({
                'model_name': r.model_name,
                'scale_name': r.scale_name,
                'question_id': r.question_id,
                'question_text': r.question_text[:200],  # Truncate for readability
                'persona_id': r.persona_id,
                'run_number': r.run_number,
                'temperature': r.temperature,
                'numeric_score': r.numeric_score,
                'scored_value': r.scored_value,
                'is_reverse_coded': r.numeric_score != r.scored_value,
                'parse_method': r.parse_method,
                'parse_warning': r.parse_warning or '',
                'justification': (r.justification or '')[:300],  # Truncate
                'tokens_used': r.tokens_used,
                'duration_ms': r.duration_ms,
                'timestamp': r.timestamp.isoformat()
            })

    print(f"  Saved: {filepath}")


def save_responses_json(responses: list[ResponseRecord], job: Job, filepath: Path):
    """Save full responses with metadata to JSON."""
    data = {
        'job_id': str(job.id),
        'created_at': datetime.now().isoformat(),
        'config': {
            'scales': job.config.scales,
            'models': job.config.models,
            'personas': job.config.personas,
            'runs_per_item': job.config.runs_per_item,
            'temperature': job.config.temperature
        },
        'summary': {
            'total_responses': len(responses),
            'successful_parses': sum(1 for r in responses if not r.parse_warning),
            'parse_warnings': sum(1 for r in responses if r.parse_warning),
            'total_tokens': sum(r.tokens_used for r in responses),
            'total_duration_ms': sum(r.duration_ms for r in responses)
        },
        'responses': [
            {
                'model_name': r.model_name,
                'scale_name': r.scale_name,
                'question_id': r.question_id,
                'question_text': r.question_text,
                'persona_id': r.persona_id,
                'run_number': r.run_number,
                'temperature': r.temperature,
                'raw_response': r.raw_response,
                'numeric_score': r.numeric_score,
                'scored_value': r.scored_value,
                'is_reverse_coded': r.numeric_score != r.scored_value,
                'justification': r.justification,
                'parse_method': r.parse_method,
                'parse_warning': r.parse_warning,
                'tokens_used': r.tokens_used,
                'duration_ms': r.duration_ms,
                'timestamp': r.timestamp.isoformat()
            }
            for r in responses
        ]
    }

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  Saved: {filepath}")


def save_summary_csv(responses: list[ResponseRecord], filepath: Path):
    """Save summary statistics to CSV."""
    from collections import defaultdict

    # Group by model -> persona -> scale
    grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for r in responses:
        grouped[r.model_name][r.persona_id][r.scale_name].append(r.scored_value)

    rows = []
    for model, personas in grouped.items():
        for persona, scales in personas.items():
            for scale, scores in scales.items():
                rows.append({
                    'model': model,
                    'persona': persona,
                    'scale': scale,
                    'n_items': len(scores),
                    'mean_score': round(sum(scores) / len(scores), 3) if scores else None,
                    'min_score': min(scores) if scores else None,
                    'max_score': max(scores) if scores else None,
                    'scores': ', '.join(f'{s:.1f}' for s in scores)
                })

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['model', 'persona', 'scale', 'n_items', 'mean_score', 'min_score', 'max_score', 'scores'])
        writer.writeheader()
        writer.writerows(rows)

    print(f"  Saved: {filepath}")


async def main():
    print("=" * 70)
    print("Ethics Engine - Full Test with Output Files")
    print("=" * 70)

    # Get API keys
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if not openai_key or not anthropic_key:
        print("\nERROR: Please set OPENAI_API_KEY and ANTHROPIC_API_KEY in .env file")
        return

    # Create results directory
    results_dir = Path(__file__).parent / "results"
    results_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Load scales and personas
    print("\nLoading scales and personas...")
    all_scales = load_all_builtin_scales()
    all_personas = load_builtin_personas()

    print(f"  Available scales: {list(all_scales.keys())}")
    print(f"  Available personas: {list(all_personas.keys())}")

    # =========================================================================
    # CONFIGURE YOUR TEST HERE
    # =========================================================================

    # Which scale to test (use a smaller one for quick tests)
    TEST_SCALE = "RWA2"  # Options: RWA2, RWA, LWA, MFQ, NFC

    # Which models to test
    TEST_MODELS = [
        "gpt-4o-mini",
        "claude-3-haiku-20240307",
    ]

    # Which personas to test
    TEST_PERSONAS = ["minimal"]  # Options: minimal, neutral, mid_liberal, extreme_liberal, mid_conservative, extreme_conservative

    # How many runs per question (1 for quick test, more for variance analysis)
    RUNS_PER_ITEM = 1

    # Temperature (0.0 for deterministic, higher for variance)
    TEMPERATURE = 0.0

    # =========================================================================

    # Get selected scale
    if TEST_SCALE not in all_scales:
        print(f"\nERROR: Scale '{TEST_SCALE}' not found")
        return

    scale = all_scales[TEST_SCALE]

    # Filter personas
    personas = {k: v for k, v in all_personas.items() if k in TEST_PERSONAS}

    # Calculate total calls
    total_calls = scale.item_count * len(TEST_MODELS) * len(personas) * RUNS_PER_ITEM

    print(f"\n" + "-" * 70)
    print("TEST CONFIGURATION")
    print("-" * 70)
    print(f"  Scale: {TEST_SCALE} ({scale.item_count} items)")
    print(f"  Models: {TEST_MODELS}")
    print(f"  Personas: {TEST_PERSONAS}")
    print(f"  Runs per item: {RUNS_PER_ITEM}")
    print(f"  Temperature: {TEMPERATURE}")
    print(f"  Total API calls: {total_calls}")
    print("-" * 70)

    # Confirm
    input("\nPress Enter to start the assessment (or Ctrl+C to cancel)...")

    # Create job
    job_config = JobConfig(
        scales=[TEST_SCALE],
        models=TEST_MODELS,
        personas=TEST_PERSONAS,
        runs_per_item=RUNS_PER_ITEM,
        temperature=TEMPERATURE
    )
    job = Job(config=job_config)
    job.progress.total_calls = total_calls

    # Create orchestrator
    orchestrator = Orchestrator()

    print("\nRegistering providers...")
    orchestrator.register_provider("openai", OpenAIProvider(api_key=openai_key))
    orchestrator.register_provider("anthropic", AnthropicProvider(api_key=anthropic_key))

    # Progress tracking
    last_pct = -1
    def on_progress(progress):
        nonlocal last_pct
        pct = int(progress.percent_complete)
        if pct != last_pct and pct % 5 == 0:  # Print every 5%
            print(f"  [{pct:3d}%] {progress.completed_calls}/{progress.total_calls} - {progress.current_phase}")
            last_pct = pct

    # Run assessment
    print(f"\nRunning assessment...")
    print("=" * 70)
    start_time = datetime.now()

    responses = await orchestrator.run_assessment(
        job=job,
        scales={TEST_SCALE: scale},
        personas=personas,
        on_progress=on_progress
    )

    elapsed = (datetime.now() - start_time).total_seconds()
    print("=" * 70)
    print(f"\nCompleted {len(responses)} responses in {elapsed:.1f} seconds")

    # Save output files
    print("\nSaving output files...")

    csv_path = results_dir / f"responses_{TEST_SCALE}_{timestamp}.csv"
    json_path = results_dir / f"responses_{TEST_SCALE}_{timestamp}.json"
    summary_path = results_dir / f"summary_{TEST_SCALE}_{timestamp}.csv"

    save_responses_csv(responses, csv_path)
    save_responses_json(responses, job, json_path)
    save_summary_csv(responses, summary_path)

    # Print summary table
    print("\n" + "=" * 70)
    print("SUMMARY BY MODEL")
    print("=" * 70)

    from collections import defaultdict
    model_stats = defaultdict(lambda: {'scores': [], 'tokens': 0, 'time': 0, 'warnings': 0})

    for r in responses:
        model_stats[r.model_name]['scores'].append(r.scored_value)
        model_stats[r.model_name]['tokens'] += r.tokens_used
        model_stats[r.model_name]['time'] += r.duration_ms
        if r.parse_warning:
            model_stats[r.model_name]['warnings'] += 1

    print(f"\n{'Model':<35} {'Mean':>8} {'Min':>6} {'Max':>6} {'Tokens':>8} {'Time':>8} {'Warns':>6}")
    print("-" * 80)

    for model, stats in sorted(model_stats.items()):
        scores = stats['scores']
        mean = sum(scores) / len(scores) if scores else 0
        print(f"{model:<35} {mean:>8.2f} {min(scores):>6.1f} {max(scores):>6.1f} {stats['tokens']:>8} {stats['time']:>7}ms {stats['warnings']:>6}")

    print("\n" + "=" * 70)
    print(f"Output files saved to: {results_dir}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
