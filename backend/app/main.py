"""
Ethics Engine API

FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import jobs, scales, personas, keys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Ethics Engine API starting up...")

    # Pre-load scales and personas to validate data
    from app.data.loader import load_all_builtin_scales, load_builtin_personas

    scales = load_all_builtin_scales()
    personas = load_builtin_personas()

    logger.info(f"Loaded {len(scales)} scales and {len(personas)} personas")

    yield

    # Shutdown
    logger.info("Ethics Engine API shutting down...")


app = FastAPI(
    title="Ethics Engine API",
    description="Psychometric assessment of Large Language Models",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # Vercel deployments
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Match all Vercel subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router, prefix="/api")
app.include_router(scales.router, prefix="/api")
app.include_router(personas.router, prefix="/api")
app.include_router(keys.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Ethics Engine API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
