"""
Job-related API endpoints.

Handles job creation, status, results, and cancellation.
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
    Job, JobStatus, JobConfig, JobProgress, JobResponse,
    CreateJobRequest, ResponseRecord, APIKeyConfig
)
from app.services.orchestrator import Orchestrator
from app.services.providers import create_provider
from app.data.loader import load_all_builtin_scales, load_builtin_personas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])

# In-memory job storage (replace with database in production)
_jobs: dict[UUID, Job] = {}
_job_responses: dict[UUID, list[ResponseRecord]] = {}
_active_orchestrators: dict[UUID, Orchestrator] = {}


@router.post("", response_model=JobResponse)
async def create_job(request: CreateJobRequest, background_tasks: BackgroundTasks):
    """
    Create a new assessment job.

    The job will be queued for background execution.
    """
    # Load built-in data
    scales = load_all_builtin_scales()
    personas = load_builtin_personas()

    # Merge custom scales (keyed by name)
    for custom_scale in request.custom_scales:
        scales[custom_scale.name] = custom_scale

    # Merge custom personas (keyed by id)
    for custom_persona in request.custom_personas:
        personas[custom_persona.id] = custom_persona

    # Check that requested scales exist
    for scale_name in request.config.scales:
        if scale_name not in scales:
            raise HTTPException(
                status_code=400,
                detail=f"Scale not found: {scale_name}"
            )

    # Check that requested personas exist
    for persona_id in request.config.personas:
        if persona_id not in personas:
            raise HTTPException(
                status_code=400,
                detail=f"Persona not found: {persona_id}"
            )

    # Create job
    job = Job(config=request.config)

    # Calculate total calls
    # Formula: sum(items per scale) * models * personas * runs_per_item
    total_items = sum(scales[s].item_count for s in request.config.scales if s in scales)
    total_calls = (
        total_items *
        len(request.config.models) *
        len(request.config.personas) *
        request.config.runs_per_item
    )
    job.progress.total_calls = total_calls

    # Store job
    _jobs[job.id] = job
    _job_responses[job.id] = []

    # Queue background execution
    background_tasks.add_task(
        run_job_async,
        job.id,
        request.config,
        request.api_keys,
        request.custom_personas,
        request.custom_scales,
    )

    return JobResponse(
        job=job,
        message=f"Job created with {total_calls} API calls queued"
    )


async def run_job_async(
    job_id: UUID,
    config: JobConfig,
    api_keys: list[APIKeyConfig],
    custom_personas: list = None,
    custom_scales: list = None,
):
    """Background task to execute a job."""
    from app.models.schemas import Persona, Scale

    custom_personas = custom_personas or []
    custom_scales = custom_scales or []

    job = _jobs.get(job_id)
    if not job:
        logger.error(f"Job not found: {job_id}")
        return

    try:
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.utcnow()

        # Create orchestrator and register providers
        orchestrator = Orchestrator()
        _active_orchestrators[job_id] = orchestrator

        for key_config in api_keys:
            try:
                provider = create_provider(
                    provider_type=key_config.provider.value,
                    api_key=key_config.api_key.get_secret_value(),
                    base_url=key_config.base_url
                )
                orchestrator.register_provider(key_config.provider.value, provider)
            except Exception as e:
                logger.warning(f"Failed to register provider {key_config.provider}: {e}")

        # Load built-in data
        scales = load_all_builtin_scales()
        personas = load_builtin_personas()

        # Merge custom scales (keyed by name)
        for custom_scale in custom_scales:
            scales[custom_scale.name] = custom_scale

        # Merge custom personas (keyed by id)
        for custom_persona in custom_personas:
            personas[custom_persona.id] = custom_persona

        # Filter to requested scales/personas
        selected_scales = {k: v for k, v in scales.items() if k in config.scales}
        selected_personas = {k: v for k, v in personas.items() if k in config.personas}

        # Progress callback
        def on_progress(progress: JobProgress):
            job.progress = progress
            job.updated_at = datetime.utcnow()

        # Run assessment
        responses = await orchestrator.run_assessment(
            job=job,
            scales=selected_scales,
            personas=selected_personas,
            on_progress=on_progress
        )

        # Store results
        _job_responses[job_id] = responses

        job.status = JobStatus.COMPLETED
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.updated_at = datetime.utcnow()

    finally:
        _active_orchestrators.pop(job_id, None)


@router.get("", response_model=list[Job])
async def list_jobs():
    """List all jobs."""
    return list(_jobs.values())


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID):
    """Get status and details for a specific job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(job=job)


@router.delete("/{job_id}")
async def cancel_job(job_id: UUID):
    """Cancel a running job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == JobStatus.RUNNING:
        orchestrator = _active_orchestrators.get(job_id)
        if orchestrator:
            # Note: actual cancellation would need state object access
            pass
        job.status = JobStatus.CANCELLED
        job.updated_at = datetime.utcnow()

    return {"message": "Job cancelled", "job_id": str(job_id)}


@router.get("/{job_id}/download")
async def download_results(job_id: UUID, format: str = "csv"):
    """
    Download job results.

    Args:
        job_id: The job ID
        format: Output format ('csv' or 'json')
    """
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed (status: {job.status})"
        )

    responses = _job_responses.get(job_id, [])

    if format == "json":
        content = json.dumps(
            [r.model_dump(mode="json") for r in responses],
            indent=2,
            default=str
        )
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=results_{job_id}.json"}
        )

    else:  # CSV format
        output = io.StringIO()
        if responses:
            fieldnames = list(responses[0].model_dump().keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            for response in responses:
                writer.writerow(response.model_dump(mode="json"))

        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=results_{job_id}.csv"}
        )


@router.get("/{job_id}/summary")
async def get_job_summary(job_id: UUID):
    """Get summary statistics for a completed job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed (status: {job.status})"
        )

    responses = _job_responses.get(job_id, [])

    # Calculate summary statistics
    from collections import defaultdict
    from app.services.scorer import calculate_summary_statistics
    from app.data.loader import load_all_builtin_scales

    scales = load_all_builtin_scales()
    stats = calculate_summary_statistics(responses, scales)

    # Also calculate overall stats
    total_responses = len(responses)
    warnings = sum(1 for r in responses if r.parse_warning)
    total_tokens = sum(r.tokens_used for r in responses)

    return {
        "job_id": str(job_id),
        "total_responses": total_responses,
        "parse_warnings": warnings,
        "total_tokens": total_tokens,
        "statistics": stats
    }
