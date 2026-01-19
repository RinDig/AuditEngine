# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ethics Engine is a web application for psychometric assessment of Large Language Models. It applies validated psychological instruments (authoritarianism scales, moral foundations questionnaires) to LLMs, measuring how models respond across different ideological framings ("personas").

The application supports two assessment modes:
1. **Text Assessment**: Traditional psychometric scales with Likert-type responses
2. **Visual Stimulus Assessment**: Image-based assessment using vision-capable models (e.g., Rorschach inkblots)

**Status**: Backend and frontend fully implemented with both text and visual assessment capabilities.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript, shadcn/ui)
- **Backend**: FastAPI (Python, async-native)
- **Database**: Supabase (PostgreSQL with row-level security)
- **Job Queue**: Redis + Bull or Supabase Edge Functions
- **Hosting**: Vercel (frontend) + Railway/Fly.io (backend)

## Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload    # Dev server
pytest                           # Run tests
black app/                       # Format code
flake8 app/                      # Lint
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev                      # Dev server (port 3000)
npm run build                    # Production build
npm test                         # Run tests
npm run lint                     # ESLint
```

## Architecture

```
Frontend (Next.js) ──HTTP/WebSocket──▶ Backend (FastAPI) ──SQL──▶ Supabase
                                              │
                                              ├──▶ OpenAI API (text + vision)
                                              ├──▶ Anthropic API (text + vision)
                                              ├──▶ Google Gemini API (text + vision)
                                              ├──▶ xAI/Grok API
                                              ├──▶ DeepSeek API
                                              ├──▶ Groq API (text + vision)
                                              └──▶ Llama endpoints
```

Key data flow (Text Assessment):
1. User configures API keys, selects scales/models/personas in frontend
2. Backend orchestrates async API calls with provider-specific rate limiting
3. Responses parsed using multi-strategy parser
4. Scores reverse-coded per scale definition
5. Results stored in Supabase, progress streamed via WebSocket

Key data flow (Visual Stimulus Assessment):
1. User uploads image, selects vision-capable models and personas
2. Image sent as base64 with prompt to each model/persona combination
3. Open-ended text responses collected (no parsing/scoring)
4. Results available for download as CSV/JSON

## API Key Security & Flow

**Important**: User API keys are NEVER stored on the server. They flow through the system in-memory only.

### Production Flow (Vercel → Railway)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. BROWSER (Vercel)                                                         │
│    User enters API keys → Stored in React state (browser memory only)       │
│    Keys validated via POST /api/keys/validate                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ HTTPS POST /api/jobs
                                      │ (keys in request body)
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. BACKEND (Railway)                                                        │
│    jobs.py: create_job() receives keys in CreateJobRequest                  │
│    Keys passed to background task run_job_async()                           │
│    orchestrator.py: Keys used to create provider instances (in-memory)      │
│    LLM calls made → Keys discarded when job completes                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Storage Summary

| Location | Storage Type | Duration |
|----------|--------------|----------|
| Browser (Vercel) | React state | Until page refresh/close |
| Network | HTTPS request body | Transit only |
| Railway backend | In-memory (function params) | Duration of job only |
| Database | **Never stored** | N/A |

### Key Files in the Flow

1. **Frontend input**: `frontend/src/components/wizard/APIKeysSection.tsx`
   - User enters keys, stored in React state
   - Validation calls `validateAPIKey()` from `api.ts`

2. **Frontend submission**: `frontend/src/app/page.tsx` (handleStartAssessment)
   - Builds `apiKeyConfigs` array from validated keys
   - Calls `createJob()` with keys in request body

3. **Backend validation**: `backend/app/routers/keys.py`
   - POST `/api/keys/validate` - tests key validity with provider

4. **Backend job creation**: `backend/app/routers/jobs.py`
   - POST `/api/jobs` - receives keys in `CreateJobRequest.api_keys`
   - `run_job_async()` creates providers with keys, runs assessment

5. **Job processing**: `backend/app/services/orchestrator.py`
   - `Orchestrator.run_assessment()` - core job processor
   - Providers hold keys in memory during execution only

### CLI Script (Development Only)

`backend/run_assessment.py` is a standalone CLI tool that reads API keys from environment variables (`.env` file). This is **only for local testing** and is not used in the production web flow.

## Critical Implementation Details

### Provider-Specific Rate Limiting (MUST preserve)
```python
openai_sem = asyncio.Semaphore(3)      # 3 concurrent
anthropic_sem = asyncio.Semaphore(5)   # 5 concurrent
llama_sem = asyncio.Semaphore(10)      # 10 concurrent

RATE_LIMITS = {
    "openai": 1.0,      # seconds between chunks
    "anthropic": 0.5,
    "llama": 0.2
}
```

### Multi-Strategy Response Parser (order matters)
1. JSON format: `{"rating": 5, "justification": "..."}`
2. Simple format: "Rating: 5" or "Score: 5"
3. First valid number in text within scale range
4. Text-to-number conversion ("strongly agree" → 7)
5. Fallback: scale midpoint with warning flag

Never discard a response—always extract something usable.

### Reverse Scoring Formula
```python
scored_value = (max + min) - score  # Only when reverse_score: True
```
Store both raw `numeric_score` and `scored_value` after reverse coding.

## Built-in Data

### Scales (10 validated instruments)
| Scale | Items | Range | Notes |
|-------|-------|-------|-------|
| RWA | 34 | 1-7 | Right-Wing Authoritarianism, 3 subscales |
| RWA2 | 22 | 1-7 | Shortened RWA |
| LWA | 39 | 1-7 | Left-Wing Authoritarianism, 3 subscales |
| MFQ | 36 | 1-5 | Moral Foundations Questionnaire, 6 subscales |
| NFC | 18 | -4 to 4 | Need for Cognition |
| BFI-10 | 10 | 1-5 | Big Five Inventory (short form) |
| SDO-7 | 8 | 1-7 | Social Dominance Orientation |
| RSES | 10 | 1-4 | Rosenberg Self-Esteem Scale |
| GSE | 10 | 1-4 | General Self-Efficacy Scale |
| LOT-R | 10 | 0-4 | Life Orientation Test-Revised (Optimism) |

### Personas (Text Assessment)
- Built-in: Minimal (empty prefix), Neutral, Moderately Liberal/Conservative, Extremely Liberal/Conservative
- Custom personas supported via manual entry or AI-assisted generation

### Personas (Visual Stimulus Assessment)
- Built-in: Minimal only (no prompt prefix - raw model response)
- Custom personas supported via manual entry or AI-assisted generation
- Note: Visual assessment uses separate persona management from text assessment

## Extensibility Features

### Custom Personas
Users can create custom personas in two ways:
1. **Manual Entry**: Form with name, description (optional), and prompt_prefix
   - IDs auto-generated with `custom_` prefix
   - Character limits: name (50), description (200), prompt_prefix (500)
2. **AI-Assisted Generation**: Describe a persona type, get 2-5 variations
   - Uses connected OpenAI or Anthropic API key
   - User reviews and selects which generated personas to add

### Custom Scales
Users can upload custom psychometric scales via guided form:
- Basic info: name, description (optional), citation (optional)
- Response scale: configurable min (0-1) and max (3-10)
- Items: ID, question text, reverse scoring flag
- Validated server-side before adding
- Custom scales prefixed with "Custom: " for identification
- Max 100 items per scale

## Key Files

### Backend (implemented)
- `backend/app/main.py` - FastAPI application entry point
- `backend/app/models/schemas.py` - Pydantic models for Scale, Job, Response, etc.
- `backend/app/services/orchestrator.py` - Core assessment logic with async orchestration
- `backend/app/services/parser.py` - Multi-strategy response parsing
- `backend/app/services/scorer.py` - Reverse coding and aggregation
- `backend/app/services/providers/` - Provider clients (OpenAI, Anthropic, xAI, Llama)
- `backend/app/services/persona_generator.py` - AI-assisted persona generation
- `backend/app/data/builtin_scales.py` - 10 built-in validated scales in Python dict format
- `backend/app/data/personas.yaml` - Built-in persona definitions
- `backend/app/routers/` - API endpoints (jobs, scales, personas, keys, visual)
  - `scales.py` - includes POST `/validate` for custom scale validation
  - `personas.py` - includes POST `/generate` for AI persona generation
  - `visual.py` - Visual assessment endpoints (jobs, results, downloads)

### Frontend (implemented)
- `frontend/src/app/page.tsx` - Main single-page wizard with assessment mode tabs (text/visual)
- `frontend/src/app/layout.tsx` - Root layout with header/footer
- `frontend/src/components/wizard/` - Wizard section components
  - `APIKeysSection.tsx` - Provider API key configuration
  - `ScalesSection.tsx` - Scale selection with preview + custom scale support
  - `ModelsSection.tsx` - Model selection grouped by provider
  - `PersonasSection.tsx` - Persona selection with prompt preview + custom persona support
  - `ConfigSection.tsx` - Temperature, runs per item, summary
  - `JobProgress.tsx` - Real-time progress display
  - `ResultsView.tsx` - Results summary and download
  - `CustomPersonaModal.tsx` - Manual custom persona entry form
  - `AIPersonaGeneratorModal.tsx` - AI-assisted persona generation modal
  - `CustomScaleModal.tsx` - Custom scale creation with guided form
  - `VisualAssessment.tsx` - Visual stimulus assessment (image upload, vision model selection, custom personas)
- `frontend/src/components/ui/` - Reusable UI components (Button, Input, Checkbox, Modal, etc.)
- `frontend/src/lib/api.ts` - API client for backend communication
  - `validateCustomScale()` - Validate custom scale definitions
  - `generatePersonas()` - AI-assisted persona generation
  - `createVisualJob()` - Create visual assessment job
  - `fetchVisualJob()` - Get visual job status
  - `fetchVisualJobSummary()` - Get visual job results
- `frontend/src/lib/types.ts` - TypeScript types matching backend schemas (includes VISION_MODELS constant)

## Environment Variables

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
ANTHROPIC_API_KEY=          # For AI-assisted schema transformation
NEXT_PUBLIC_API_URL=
```

## Vision-Capable Models

Models that support image input for Visual Stimulus Assessment:

| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | gpt-5.2, gpt-5.1, gpt-5, gpt-5-mini, gpt-5-pro, gpt-4.1 series, gpt-4o series, o3, o4-mini, o1 series | gpt-5.1/5.2 require `max_completion_tokens` instead of `max_tokens` |
| Anthropic | claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5, claude-4 series, claude-3-7 series, claude-3-5-haiku | All Claude 3+ models support vision |
| Gemini | gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.0-flash series | All Gemini models support vision natively |
| Groq | llama-3.2-90b-vision-preview, llama-3.2-11b-vision-preview | Vision preview models |

### Vision API Implementation Notes
- **OpenAI**: Uses `image_url` content type with base64 data URI
- **Anthropic**: Uses `image` content type with `source.type: "base64"`
- **Gemini**: Uses native SDK `types.Part.from_bytes()` method
- **Groq**: Uses OpenAI-compatible format

## Important Constraints

1. **Port existing logic exactly** - The async orchestration patterns exist because they work. Don't simplify away the provider-specific semaphores.
2. **Parser robustness** - LLMs respond inconsistently. Test with real API responses.
3. **Scale definitions are canonical** - All custom uploads must validate against the YAML schema.
4. **Progress is essential** - Jobs can have 10,000+ calls. WebSocket updates required.
5. **Max 100 items per custom scale** - Input validation requirement.
6. **Vision model parameters** - Some newer models (gpt-5.1, gpt-5.2, o-series) require `max_completion_tokens` instead of `max_tokens`.
