"""
Results Exporter for Ethics Engine

Handles organized output of assessment results with:
- Per-run folders with descriptive names
- Multiple output formats (CSV, JSON, Excel-compatible)
- Index file for easy navigation
- Metadata for reproducibility
"""

import csv
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import UUID

from app.models.schemas import Job, ResponseRecord, Scale, Persona


class ResultsExporter:
    """
    Exports assessment results to organized folder structure.

    Structure:
        results/
        ├── index.json                          # Master index of all runs
        ├── 2026-01-10_RWA2_2models_minimal/    # Run folder
        │   ├── manifest.json                   # Run metadata
        │   ├── responses.csv                   # All responses
        │   ├── responses.json                  # Full data with raw responses
        │   ├── summary_by_model.csv            # Aggregated by model
        │   ├── summary_by_question.csv         # Aggregated by question
        │   └── comparison_matrix.csv           # Model × Question matrix
        └── 2026-01-10_LWA_4models_all-personas/
            └── ...
    """

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            base_dir = Path(__file__).parent.parent.parent / "results"
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

    def export_run(
        self,
        job: Job,
        responses: list[ResponseRecord],
        scales: dict[str, Scale],
        personas: dict[str, Persona],
        run_name: Optional[str] = None
    ) -> Path:
        """
        Export a complete assessment run to organized folder.

        Args:
            job: The job configuration
            responses: All response records
            scales: Scale definitions used
            personas: Persona definitions used
            run_name: Optional custom name for the run

        Returns:
            Path to the run folder
        """
        # Generate folder name
        if run_name is None:
            run_name = self._generate_run_name(job)

        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        folder_name = f"{timestamp}_{run_name}"
        run_dir = self.base_dir / folder_name
        run_dir.mkdir(exist_ok=True)

        # Export all files
        self._export_manifest(run_dir, job, responses, scales, personas)
        self._export_responses_csv(run_dir, responses)
        self._export_responses_json(run_dir, job, responses, scales, personas)
        self._export_summary_by_model(run_dir, responses)
        self._export_summary_by_question(run_dir, responses, scales)
        self._export_comparison_matrix(run_dir, responses, scales)

        # Update master index
        self._update_index(folder_name, job, responses)

        return run_dir

    def _generate_run_name(self, job: Job) -> str:
        """Generate a descriptive run name from job config."""
        parts = []

        # Scales
        if len(job.config.scales) == 1:
            parts.append(job.config.scales[0])
        else:
            parts.append(f"{len(job.config.scales)}scales")

        # Models
        model_count = len(job.config.models)
        if model_count == 1:
            # Shorten model name
            model = job.config.models[0]
            if "gpt" in model.lower():
                parts.append("gpt")
            elif "claude" in model.lower():
                parts.append("claude")
            else:
                parts.append(model[:10])
        else:
            parts.append(f"{model_count}models")

        # Personas
        if len(job.config.personas) == 1:
            parts.append(job.config.personas[0])
        elif len(job.config.personas) == 6:
            parts.append("all-personas")
        else:
            parts.append(f"{len(job.config.personas)}personas")

        # Runs per item if > 1
        if job.config.runs_per_item > 1:
            parts.append(f"{job.config.runs_per_item}runs")

        return "_".join(parts)

    def _export_manifest(
        self,
        run_dir: Path,
        job: Job,
        responses: list[ResponseRecord],
        scales: dict[str, Scale],
        personas: dict[str, Persona]
    ):
        """Export run manifest with full metadata."""
        manifest = {
            "job_id": str(job.id),
            "created_at": datetime.now().isoformat(),
            "config": {
                "scales": job.config.scales,
                "models": job.config.models,
                "personas": job.config.personas,
                "runs_per_item": job.config.runs_per_item,
                "temperature": job.config.temperature
            },
            "scales_info": {
                name: {
                    "description": scale.description,
                    "citation": scale.citation,
                    "item_count": scale.item_count,
                    "scale_range": list(scale.scale_range)
                }
                for name, scale in scales.items()
            },
            "personas_info": {
                pid: {
                    "name": p.name,
                    "description": p.description,
                    "prompt_prefix": p.prompt_prefix
                }
                for pid, p in personas.items()
            },
            "results_summary": {
                "total_responses": len(responses),
                "successful_parses": sum(1 for r in responses if not r.parse_warning),
                "parse_warnings": sum(1 for r in responses if r.parse_warning),
                "total_tokens": sum(r.tokens_used for r in responses),
                "total_duration_ms": sum(r.duration_ms for r in responses)
            }
        }

        with open(run_dir / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

    def _export_responses_csv(self, run_dir: Path, responses: list[ResponseRecord]):
        """Export all responses to CSV."""
        if not responses:
            return

        fieldnames = [
            'model_name', 'scale_name', 'question_id', 'question_text',
            'persona_id', 'run_number', 'temperature',
            'numeric_score', 'scored_value', 'is_reverse_coded',
            'parse_method', 'parse_warning', 'justification',
            'tokens_used', 'duration_ms', 'timestamp'
        ]

        with open(run_dir / "responses.csv", 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for r in sorted(responses, key=lambda x: (x.scale_name, x.question_id, x.model_name, x.persona_id)):
                writer.writerow({
                    'model_name': r.model_name,
                    'scale_name': r.scale_name,
                    'question_id': r.question_id,
                    'question_text': r.question_text,
                    'persona_id': r.persona_id,
                    'run_number': r.run_number,
                    'temperature': r.temperature,
                    'numeric_score': r.numeric_score,
                    'scored_value': r.scored_value,
                    'is_reverse_coded': r.numeric_score != r.scored_value,
                    'parse_method': r.parse_method,
                    'parse_warning': r.parse_warning or '',
                    'justification': r.justification or '',
                    'tokens_used': r.tokens_used,
                    'duration_ms': r.duration_ms,
                    'timestamp': r.timestamp.isoformat()
                })

    def _export_responses_json(
        self,
        run_dir: Path,
        job: Job,
        responses: list[ResponseRecord],
        scales: dict[str, Scale],
        personas: dict[str, Persona]
    ):
        """Export full responses with raw data to JSON."""
        data = {
            "job_id": str(job.id),
            "exported_at": datetime.now().isoformat(),
            "responses": [
                {
                    "model_name": r.model_name,
                    "scale_name": r.scale_name,
                    "question_id": r.question_id,
                    "question_text": r.question_text,
                    "persona_id": r.persona_id,
                    "run_number": r.run_number,
                    "temperature": r.temperature,
                    "raw_response": r.raw_response,
                    "numeric_score": r.numeric_score,
                    "scored_value": r.scored_value,
                    "is_reverse_coded": r.numeric_score != r.scored_value,
                    "justification": r.justification,
                    "parse_method": r.parse_method,
                    "parse_warning": r.parse_warning,
                    "tokens_used": r.tokens_used,
                    "duration_ms": r.duration_ms,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in sorted(responses, key=lambda x: (x.scale_name, x.question_id, x.model_name))
            ]
        }

        with open(run_dir / "responses.json", 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _export_summary_by_model(self, run_dir: Path, responses: list[ResponseRecord]):
        """Export summary statistics grouped by model."""
        from collections import defaultdict

        # Group by model -> persona -> scale
        grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        for r in responses:
            grouped[r.model_name][r.persona_id][r.scale_name].append(r)

        rows = []
        for model, personas in sorted(grouped.items()):
            for persona, scales in sorted(personas.items()):
                for scale, resps in sorted(scales.items()):
                    scores = [r.scored_value for r in resps]
                    tokens = sum(r.tokens_used for r in resps)
                    duration = sum(r.duration_ms for r in resps)
                    warnings = sum(1 for r in resps if r.parse_warning)

                    rows.append({
                        'model': model,
                        'persona': persona,
                        'scale': scale,
                        'n_items': len(scores),
                        'mean_score': round(sum(scores) / len(scores), 3) if scores else None,
                        'min_score': min(scores) if scores else None,
                        'max_score': max(scores) if scores else None,
                        'std_dev': round(self._std_dev(scores), 3) if len(scores) > 1 else 0,
                        'total_tokens': tokens,
                        'total_duration_ms': duration,
                        'parse_warnings': warnings
                    })

        with open(run_dir / "summary_by_model.csv", 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'model', 'persona', 'scale', 'n_items', 'mean_score',
                'min_score', 'max_score', 'std_dev', 'total_tokens',
                'total_duration_ms', 'parse_warnings'
            ])
            writer.writeheader()
            writer.writerows(rows)

    def _export_summary_by_question(
        self,
        run_dir: Path,
        responses: list[ResponseRecord],
        scales: dict[str, Scale]
    ):
        """Export summary statistics grouped by question."""
        from collections import defaultdict

        # Build question info lookup
        question_info = {}
        for scale in scales.values():
            for item in scale.items:
                question_info[item.id] = {
                    'text': item.text,
                    'reverse_score': item.reverse_score,
                    'subscale': item.subscale
                }

        # Group by question -> model
        grouped = defaultdict(lambda: defaultdict(list))
        for r in responses:
            key = (r.scale_name, r.question_id)
            grouped[key][r.model_name].append(r)

        rows = []
        for (scale_name, question_id), models in sorted(grouped.items()):
            info = question_info.get(question_id, {})

            row = {
                'scale': scale_name,
                'question_id': question_id,
                'question_text': info.get('text', '')[:150],
                'reverse_scored': info.get('reverse_score', False),
                'subscale': info.get('subscale', '')
            }

            # Add score for each model
            all_scores = []
            for model, resps in sorted(models.items()):
                scores = [r.scored_value for r in resps]
                mean = sum(scores) / len(scores) if scores else None
                row[f'{model}_mean'] = round(mean, 2) if mean else None
                all_scores.extend(scores)

            # Add cross-model stats
            if all_scores:
                row['overall_mean'] = round(sum(all_scores) / len(all_scores), 2)
                row['overall_std'] = round(self._std_dev(all_scores), 2) if len(all_scores) > 1 else 0

            rows.append(row)

        if rows:
            fieldnames = list(rows[0].keys())
            with open(run_dir / "summary_by_question.csv", 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)

    def _export_comparison_matrix(
        self,
        run_dir: Path,
        responses: list[ResponseRecord],
        scales: dict[str, Scale]
    ):
        """Export a matrix of Model × Question scores for easy comparison."""
        from collections import defaultdict

        # Get all models and questions
        models = sorted(set(r.model_name for r in responses))
        questions = []
        for scale in scales.values():
            for item in scale.items:
                questions.append((scale.name, item.id, item.text[:80]))

        # Build score lookup
        scores = defaultdict(dict)
        for r in responses:
            key = (r.scale_name, r.question_id)
            if r.model_name not in scores[key]:
                scores[key][r.model_name] = []
            scores[key][r.model_name].append(r.scored_value)

        # Write matrix
        with open(run_dir / "comparison_matrix.csv", 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            # Header row
            header = ['scale', 'question_id', 'question_text'] + models + ['variance']
            writer.writerow(header)

            # Data rows
            for scale_name, q_id, q_text in questions:
                key = (scale_name, q_id)
                row = [scale_name, q_id, q_text]

                model_means = []
                for model in models:
                    model_scores = scores[key].get(model, [])
                    if model_scores:
                        mean = sum(model_scores) / len(model_scores)
                        row.append(round(mean, 2))
                        model_means.append(mean)
                    else:
                        row.append('')

                # Add variance across models
                if len(model_means) > 1:
                    variance = self._std_dev(model_means)
                    row.append(round(variance, 2))
                else:
                    row.append('')

                writer.writerow(row)

    def _update_index(self, folder_name: str, job: Job, responses: list[ResponseRecord]):
        """Update the master index file."""
        index_path = self.base_dir / "index.json"

        # Load existing index
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                index = json.load(f)
        else:
            index = {"runs": []}

        # Add new run
        run_entry = {
            "folder": folder_name,
            "job_id": str(job.id),
            "created_at": datetime.now().isoformat(),
            "scales": job.config.scales,
            "models": job.config.models,
            "personas": job.config.personas,
            "total_responses": len(responses),
            "temperature": job.config.temperature,
            "runs_per_item": job.config.runs_per_item
        }

        index["runs"].insert(0, run_entry)  # Most recent first
        index["last_updated"] = datetime.now().isoformat()

        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2)

    @staticmethod
    def _std_dev(values: list[float]) -> float:
        """Calculate standard deviation."""
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5

    def list_runs(self) -> list[dict]:
        """List all runs from the index."""
        index_path = self.base_dir / "index.json"
        if not index_path.exists():
            return []

        with open(index_path, 'r', encoding='utf-8') as f:
            index = json.load(f)

        return index.get("runs", [])

    def get_run(self, folder_name: str) -> Optional[dict]:
        """Load manifest for a specific run."""
        manifest_path = self.base_dir / folder_name / "manifest.json"
        if not manifest_path.exists():
            return None

        with open(manifest_path, 'r', encoding='utf-8') as f:
            return json.load(f)
