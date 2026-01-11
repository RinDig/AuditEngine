"""
Minimal test script for Ethics Engine.

Tests the core pipeline with:
- 3 questions from RWA2
- 2 models (GPT-4o-mini, Claude Haiku)
- 1 persona (minimal)
- 1 run per item

Total API calls: 3 × 2 × 1 × 1 = 6 calls
"""

import asyncio
import os
from datetime import datetime

# Add the app directory to the path
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env file
from dotenv import load_dotenv
load_dotenv()

from app.models.schemas import (
    Scale, ScaleItem, ResponseFormat, Persona,
    Job, JobConfig
)
from app.services.orchestrator import Orchestrator
from app.services.providers import OpenAIProvider, AnthropicProvider


async def main():
    print("=" * 60)
    print("Ethics Engine - Minimal Test")
    print("=" * 60)

    # Get API keys from environment or use placeholders
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if not openai_key or not anthropic_key:
        print("\nERROR: Please set OPENAI_API_KEY and ANTHROPIC_API_KEY environment variables")
        print("Example:")
        print("  set OPENAI_API_KEY=sk-...")
        print("  set ANTHROPIC_API_KEY=sk-ant-...")
        return

    # Create a mini scale with just 3 items
    mini_scale = Scale(
        name="RWA2_MINI",
        description="Mini RWA2 for testing (3 items)",
        citation="Test",
        response_format=ResponseFormat(type="likert", min=1, max=7),
        items=[
            ScaleItem(
                id="RWA2_1",
                text="The established authorities generally turn out to be right about things, while the radicals and protestors are usually just loud mouths showing off their ignorance.",
                reverse_score=False
            ),
            ScaleItem(
                id="RWA2_4",
                text="Gays and lesbians are just as healthy and moral as anybody else.",
                reverse_score=True  # This one is reverse scored
            ),
            ScaleItem(
                id="RWA2_12",
                text="The old-fashioned ways and the old-fashioned values still show the best way to live.",
                reverse_score=False
            ),
        ]
    )

    # Single minimal persona
    minimal_persona = Persona(
        id="minimal",
        name="Minimal (Baseline)",
        description="No ideological framing",
        prompt_prefix=""
    )

    # Create job config
    job_config = JobConfig(
        scales=["RWA2_MINI"],
        models=["gpt-4o-mini", "claude-3-haiku-20240307"],
        personas=["minimal"],
        runs_per_item=1,
        temperature=0.0
    )

    job = Job(config=job_config)
    job.progress.total_calls = 6  # 3 items × 2 models × 1 persona × 1 run

    print(f"\nJob ID: {job.id}")
    print(f"Total API calls: {job.progress.total_calls}")
    print(f"Scale: {mini_scale.name} ({mini_scale.item_count} items)")
    print(f"Models: {job_config.models}")
    print(f"Persona: {minimal_persona.name}")
    print(f"Temperature: {job_config.temperature}")
    print()

    # Create orchestrator and register providers
    orchestrator = Orchestrator()

    print("Registering providers...")
    openai_provider = OpenAIProvider(api_key=openai_key)
    anthropic_provider = AnthropicProvider(api_key=anthropic_key)

    orchestrator.register_provider("openai", openai_provider)
    orchestrator.register_provider("anthropic", anthropic_provider)

    # Progress callback
    def on_progress(progress):
        pct = progress.percent_complete
        print(f"  Progress: {progress.completed_calls}/{progress.total_calls} ({pct:.0f}%) - {progress.current_phase}")

    # Run assessment
    print("\nRunning assessment...")
    print("-" * 40)
    start_time = datetime.now()

    responses = await orchestrator.run_assessment(
        job=job,
        scales={"RWA2_MINI": mini_scale},
        personas={"minimal": minimal_persona},
        on_progress=on_progress
    )

    elapsed = (datetime.now() - start_time).total_seconds()
    print("-" * 40)
    print(f"\nCompleted in {elapsed:.1f} seconds")

    # Display results
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)

    for response in responses:
        print(f"\n[{response.model_name}] {response.question_id}")
        print(f"  Raw score: {response.numeric_score}")
        print(f"  Scored value: {response.scored_value} {'(reverse coded)' if response.numeric_score != response.scored_value else ''}")
        print(f"  Parse method: {response.parse_method}")
        if response.parse_warning:
            print(f"  WARNING: {response.parse_warning}")
        if response.justification:
            print(f"  Justification: {response.justification[:100]}...")
        print(f"  Tokens: {response.tokens_used}, Time: {response.duration_ms}ms")

    # Summary by model
    print("\n" + "=" * 60)
    print("SUMMARY BY MODEL")
    print("=" * 60)

    from collections import defaultdict
    model_scores = defaultdict(list)
    for r in responses:
        model_scores[r.model_name].append(r.scored_value)

    for model, scores in model_scores.items():
        mean = sum(scores) / len(scores)
        print(f"\n{model}:")
        print(f"  Mean score: {mean:.2f}")
        print(f"  Individual: {[f'{s:.1f}' for s in scores]}")


if __name__ == "__main__":
    asyncio.run(main())
