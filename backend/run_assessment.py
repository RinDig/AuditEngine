"""
Ethics Engine Assessment Runner

Run psychometric assessments with organized output.

Usage:
    python run_assessment.py

Configure the assessment in the CONFIGURATION section below.
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.models.schemas import Job, JobConfig
from app.services.orchestrator import Orchestrator
from app.services.exporter import ResultsExporter
from app.services.providers import (
    OpenAIProvider,
    AnthropicProvider,
    XAIProvider,
    LlamaProvider,
    GeminiProvider,
    DeepSeekProvider,
    GroqProvider,
)
from app.data.loader import load_all_builtin_scales, load_builtin_personas


# =============================================================================
# CONFIGURATION - Edit this section to customize your assessment
# =============================================================================

CONFIG = {
    # Which scales to test
    # Options: "RWA", "RWA2", "LWA", "MFQ", "NFC"
    "scales": ["RWA2"],

    # Which models to test
    # OpenAI: "gpt-5.2", "gpt-5", "gpt-4o", "gpt-4o-mini", "o3-mini", "o1-mini"
    # Anthropic: "claude-opus-4-5-20251124", "claude-sonnet-4-5-20251022", "claude-haiku-4-5-20251015", "claude-3-haiku-20240307"
    # xAI: "grok-4.1", "grok-4", "grok-3", "grok-2"
    # Google: "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"
    # DeepSeek: "deepseek-chat", "deepseek-reasoner"
    # Groq: "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"
    "models": [
        "gpt-4o-mini",
        "claude-3-haiku-20240307",
    ],

    # Which personas to test
    # Options: "minimal", "neutral", "mid_liberal", "extreme_liberal", "mid_conservative", "extreme_conservative"
    "personas": ["minimal"],

    # How many times to run each question (1 for quick, more for variance analysis)
    "runs_per_item": 1,

    # Temperature (0.0 = deterministic, higher = more variance)
    "temperature": 0.0,

    # Optional custom name for this run (leave None for auto-generated)
    "run_name": None,
}

# =============================================================================
# END CONFIGURATION
# =============================================================================


async def main():
    print("=" * 70)
    print("Ethics Engine Assessment Runner")
    print("=" * 70)

    # Check API keys
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
    xai_key = os.environ.get("XAI_API_KEY", "")
    llama_key = os.environ.get("LLAMA_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY", "")
    groq_key = os.environ.get("GROQ_API_KEY", "")

    # Load scales and personas
    print("\nLoading scales and personas...")
    all_scales = load_all_builtin_scales()
    all_personas = load_builtin_personas()

    # Validate configuration
    for scale_name in CONFIG["scales"]:
        if scale_name not in all_scales:
            print(f"ERROR: Scale '{scale_name}' not found. Available: {list(all_scales.keys())}")
            return

    for persona_id in CONFIG["personas"]:
        if persona_id not in all_personas:
            print(f"ERROR: Persona '{persona_id}' not found. Available: {list(all_personas.keys())}")
            return

    # Get selected scales and personas
    selected_scales = {k: v for k, v in all_scales.items() if k in CONFIG["scales"]}
    selected_personas = {k: v for k, v in all_personas.items() if k in CONFIG["personas"]}

    # Calculate total items
    total_items = sum(s.item_count for s in selected_scales.values())
    total_calls = (
        total_items *
        len(CONFIG["models"]) *
        len(CONFIG["personas"]) *
        CONFIG["runs_per_item"]
    )

    # Display configuration
    print(f"\n{'─' * 70}")
    print("ASSESSMENT CONFIGURATION")
    print(f"{'─' * 70}")
    print(f"  Scales: {CONFIG['scales']} ({total_items} total items)")
    print(f"  Models: {CONFIG['models']}")
    print(f"  Personas: {CONFIG['personas']}")
    print(f"  Runs per item: {CONFIG['runs_per_item']}")
    print(f"  Temperature: {CONFIG['temperature']}")
    print(f"  Total API calls: {total_calls}")
    print(f"{'─' * 70}")

    # Confirm
    response = input("\nStart assessment? [Y/n]: ").strip().lower()
    if response and response != 'y':
        print("Cancelled.")
        return

    # Create job
    job_config = JobConfig(
        scales=CONFIG["scales"],
        models=CONFIG["models"],
        personas=CONFIG["personas"],
        runs_per_item=CONFIG["runs_per_item"],
        temperature=CONFIG["temperature"]
    )
    job = Job(config=job_config)
    job.progress.total_calls = total_calls

    # Create orchestrator and register providers
    orchestrator = Orchestrator()

    print("\nRegistering providers...")

    # Register available providers based on API keys and requested models
    models_lower = [m.lower() for m in CONFIG["models"]]

    if openai_key and any("gpt" in m or "o1" in m or "o3" in m for m in models_lower):
        orchestrator.register_provider("openai", OpenAIProvider(api_key=openai_key))
        print("  ✓ OpenAI")

    if anthropic_key and any("claude" in m for m in models_lower):
        orchestrator.register_provider("anthropic", AnthropicProvider(api_key=anthropic_key))
        print("  ✓ Anthropic")

    if xai_key and any("grok" in m for m in models_lower):
        orchestrator.register_provider("xai", XAIProvider(api_key=xai_key))
        print("  ✓ xAI")

    if llama_key and any("meta-llama" in m for m in models_lower):
        # Default to Together AI endpoint for self-hosted Llama
        base_url = os.environ.get("LLAMA_BASE_URL", "https://api.together.xyz/v1")
        orchestrator.register_provider("llama", LlamaProvider(api_key=llama_key, base_url=base_url))
        print("  ✓ Llama (self-hosted)")

    if gemini_key and any("gemini" in m for m in models_lower):
        orchestrator.register_provider("gemini", GeminiProvider(api_key=gemini_key))
        print("  ✓ Google Gemini")

    if deepseek_key and any("deepseek" in m for m in models_lower):
        orchestrator.register_provider("deepseek", DeepSeekProvider(api_key=deepseek_key))
        print("  ✓ DeepSeek")

    if groq_key and any(prefix in m for m in models_lower for prefix in ["llama-3", "mixtral", "gemma"]):
        orchestrator.register_provider("groq", GroqProvider(api_key=groq_key))
        print("  ✓ Groq")

    # Progress tracking
    start_time = datetime.now()
    last_update = [0]

    def on_progress(progress):
        # Update every 10% or every 5 completions
        if progress.completed_calls - last_update[0] >= max(5, total_calls // 10):
            elapsed = (datetime.now() - start_time).total_seconds()
            rate = progress.completed_calls / elapsed if elapsed > 0 else 0
            eta = (total_calls - progress.completed_calls) / rate if rate > 0 else 0

            print(f"  [{progress.percent_complete:5.1f}%] "
                  f"{progress.completed_calls}/{progress.total_calls} "
                  f"| {rate:.1f}/s | ETA: {eta:.0f}s "
                  f"| {progress.current_phase}")
            last_update[0] = progress.completed_calls

    # Run assessment
    print(f"\n{'=' * 70}")
    print("RUNNING ASSESSMENT")
    print(f"{'=' * 70}")

    responses = await orchestrator.run_assessment(
        job=job,
        scales=selected_scales,
        personas=selected_personas,
        on_progress=on_progress
    )

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"{'=' * 70}")
    print(f"\nCompleted {len(responses)} responses in {elapsed:.1f} seconds")

    # Export results
    print("\nExporting results...")
    exporter = ResultsExporter()
    run_dir = exporter.export_run(
        job=job,
        responses=responses,
        scales=selected_scales,
        personas=selected_personas,
        run_name=CONFIG.get("run_name")
    )

    # Print summary
    print(f"\n{'=' * 70}")
    print("RESULTS SUMMARY")
    print(f"{'=' * 70}")

    from collections import defaultdict
    model_stats = defaultdict(lambda: {'scores': [], 'tokens': 0})

    for r in responses:
        model_stats[r.model_name]['scores'].append(r.scored_value)
        model_stats[r.model_name]['tokens'] += r.tokens_used

    print(f"\n{'Model':<40} {'Mean':>8} {'Min':>6} {'Max':>6} {'Tokens':>8}")
    print("─" * 70)

    for model, stats in sorted(model_stats.items()):
        scores = stats['scores']
        mean = sum(scores) / len(scores) if scores else 0
        print(f"{model:<40} {mean:>8.2f} {min(scores):>6.1f} {max(scores):>6.1f} {stats['tokens']:>8}")

    print(f"\n{'=' * 70}")
    print("OUTPUT FILES")
    print(f"{'=' * 70}")
    print(f"\n  📁 {run_dir}")
    print(f"     ├── manifest.json         - Run metadata & config")
    print(f"     ├── responses.csv         - All individual responses")
    print(f"     ├── responses.json        - Full data with raw responses")
    print(f"     ├── summary_by_model.csv  - Aggregated by model/persona/scale")
    print(f"     ├── summary_by_question.csv - Aggregated by question")
    print(f"     └── comparison_matrix.csv - Model × Question matrix")
    print(f"\n{'=' * 70}")


if __name__ == "__main__":
    asyncio.run(main())
