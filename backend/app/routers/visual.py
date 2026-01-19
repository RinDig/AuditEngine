"""
Visual Assessment API endpoints.

Handles visual stimulus assessments with image input.
"""

import asyncio
import csv
import io
import json
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    VisualJob,
    VisualJobStatus,
    VisualJobResponse,
    VisualJobSummary,
    CreateVisualJobRequest,
    VisualResponseRecord,
    Persona,
)
from app.services.visual_orchestrator import run_visual_assessment, get_vision_models_for_providers
from app.data.loader import load_builtin_personas

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/visual", tags=["Visual Assessment"])

# In-memory storage for visual jobs and responses
_visual_jobs: dict[UUID, VisualJob] = {}
_visual_responses: dict[UUID, list[VisualResponseRecord]] = {}
_visual_images: dict[UUID, str] = {}  # Store images for download reference


@router.post("/jobs", response_model=VisualJobResponse)
async def create_visual_job(
    request: CreateVisualJobRequest,
    background_tasks: BackgroundTasks
):
    """Create and start a new visual assessment job."""
    # Create the job
    job = VisualJob(
        config=request.config,
        image_description=request.image_description,
    )

    # Store job
    _visual_jobs[job.id] = job
    _visual_responses[job.id] = []
    _visual_images[job.id] = request.image_data

    # Load personas (load_builtin_personas already returns dict[str, Persona])
    personas_dict = load_builtin_personas()

    # Add custom personas
    for custom_persona in request.custom_personas:
        personas_dict[custom_persona.id] = custom_persona

    # Run assessment in background
    background_tasks.add_task(
        run_visual_job_async,
        job.id,
        request.image_data,
        request.api_keys,
        personas_dict,
    )

    return VisualJobResponse(
        job=job,
        message="Visual assessment job started"
    )


async def run_visual_job_async(
    job_id: UUID,
    image_data: str,
    api_keys: list,
    personas: dict[str, Persona],
):
    """Background task to run visual assessment."""
    job = _visual_jobs.get(job_id)
    if not job:
        logger.error(f"Visual job {job_id} not found")
        return

    try:
        job.status = VisualJobStatus.RUNNING
        job.updated_at = datetime.utcnow()

        def on_progress(updated_job: VisualJob):
            _visual_jobs[job_id] = updated_job

        responses = await run_visual_assessment(
            job=job,
            image_data=image_data,
            api_keys=api_keys,
            personas=personas,
            on_progress=on_progress,
        )

        _visual_responses[job_id] = responses
        job.status = VisualJobStatus.COMPLETED
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.error(f"Visual job {job_id} failed: {e}")
        job.status = VisualJobStatus.FAILED
        job.error = str(e)
        job.updated_at = datetime.utcnow()


@router.get("/jobs/{job_id}", response_model=VisualJobResponse)
async def get_visual_job(job_id: UUID):
    """Get visual job status and progress."""
    job = _visual_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Visual job not found")

    return VisualJobResponse(job=job)


@router.get("/jobs/{job_id}/summary", response_model=VisualJobSummary)
async def get_visual_job_summary(job_id: UUID):
    """Get summary and all responses for a completed visual job."""
    job = _visual_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Visual job not found")

    responses = _visual_responses.get(job_id, [])

    total_tokens = sum(r.tokens_used for r in responses)
    failed_count = sum(1 for r in responses if r.error)

    return VisualJobSummary(
        job_id=job_id,
        total_responses=len(responses),
        failed_responses=failed_count,
        total_tokens=total_tokens,
        responses=responses,
    )


@router.get("/jobs/{job_id}/download")
async def download_visual_results(job_id: UUID, format: str = "csv"):
    """Download visual assessment results as CSV or JSON."""
    job = _visual_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Visual job not found")

    if job.status != VisualJobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed yet")

    responses = _visual_responses.get(job_id, [])

    if format == "json":
        # Return JSON
        data = {
            "job_id": str(job_id),
            "created_at": job.created_at.isoformat(),
            "completed_at": job.updated_at.isoformat(),
            "config": job.config.model_dump(),
            "image_description": job.image_description,
            "responses": [r.model_dump() for r in responses],
        }
        # Convert UUIDs and datetimes to strings
        json_str = json.dumps(data, default=str, indent=2)

        return StreamingResponse(
            io.BytesIO(json_str.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=visual_results_{job_id}.json"}
        )
    else:
        # Return CSV
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "model_name",
            "persona_id",
            "run_number",
            "temperature",
            "prompt",
            "response_text",
            "tokens_used",
            "duration_ms",
            "timestamp",
            "error",
        ])

        # Data rows
        for r in responses:
            writer.writerow([
                r.model_name,
                r.persona_id,
                r.run_number,
                r.temperature,
                r.prompt,
                r.response_text,
                r.tokens_used,
                r.duration_ms,
                r.timestamp.isoformat(),
                r.error or "",
            ])

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=visual_results_{job_id}.csv"}
        )


@router.delete("/jobs/{job_id}")
async def cancel_visual_job(job_id: UUID):
    """Cancel a running visual job."""
    job = _visual_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Visual job not found")

    if job.status == VisualJobStatus.RUNNING:
        job.status = VisualJobStatus.CANCELLED
        job.updated_at = datetime.utcnow()

    return {"message": "Job cancelled", "job_id": str(job_id)}


@router.get("/models")
async def get_vision_models():
    """Get list of all vision-capable models by provider."""
    from app.services.providers.openai_provider import OpenAIProvider
    from app.services.providers.anthropic_provider import AnthropicProvider
    from app.services.providers.gemini_provider import GeminiProvider

    return {
        "openai": OpenAIProvider(api_key="dummy").vision_models,
        "anthropic": AnthropicProvider(api_key="dummy").vision_models,
        "gemini": GeminiProvider(api_key="dummy").vision_models,
    }
