# Ethics Engine

A web application for psychometric assessment of Large Language Models. Ethics Engine applies validated psychological instruments (authoritarianism scales, moral foundations questionnaires, personality inventories) to LLMs, measuring how models respond across different ideological framings.

**Live Demo**: [ethicsengine.eduba.io](https://ethicsengine.eduba.io)

## Features

### Text Assessment
- **10 Built-in Psychometric Scales**: RWA, LWA, MFQ, NFC, BFI-10, SDO-7, RSES, GSE, LOT-R, and more
- **7 LLM Providers**: OpenAI, Anthropic, xAI, Google Gemini, DeepSeek, Groq, and self-hosted Llama
- **Custom Personas**: Create manual personas or use AI to generate persona variations
- **Custom Scales**: Upload your own psychometric instruments with guided validation

### Visual Stimulus Assessment
- **Image-based Assessment**: Upload images (Rorschach inkblots, visual stimuli) for multimodal analysis
- **Vision-Capable Models**: Automatically filters to models that support image input (GPT-5.x, GPT-4o, Claude 4.x, Gemini 2.x, etc.)
- **Custom Personas**: Create or AI-generate personas specifically for visual assessment
- **Open-ended Responses**: Get detailed model interpretations of visual stimuli

### Common Features
- **Real-time Progress**: Live updates during assessment runs
- **Export Results**: Download data as CSV or JSON for analysis

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python, async-native)
- **Deployment**: Vercel (frontend) + Railway/Fly.io (backend)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- API keys for at least one LLM provider

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### Environment Variables

Create `backend/.env`:
```env
# Optional - only needed for specific features
ANTHROPIC_API_KEY=your_key_here  # For AI persona generation
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage

### Text Assessment
1. **Connect API Keys**: Enter your LLM provider API keys (validated in real-time)
2. **Select Scales**: Choose from 10 built-in instruments or add custom scales
3. **Choose Models**: Select which models to test from connected providers
4. **Configure Personas**: Use built-in personas, create custom ones, or AI-generate variations
5. **Run Assessment**: Start the job and monitor real-time progress
6. **Download Results**: Export comprehensive CSV/JSON data for analysis

### Visual Stimulus Assessment
1. **Connect API Keys**: Enter API keys for providers with vision-capable models
2. **Upload Image**: Drag & drop or browse to upload an image (JPEG, PNG, GIF, WebP up to 10MB)
3. **Set Prompt**: Customize the question/prompt to ask about the image
4. **Choose Models**: Select from available vision-capable models
5. **Configure Personas**: Use the Minimal persona (no framing) or create custom personas
6. **Run Assessment**: Start the job and view responses from each model/persona combination
7. **Download Results**: Export responses as CSV or JSON

## Built-in Scales

| Scale | Items | Range | Description |
|-------|-------|-------|-------------|
| RWA | 34 | 1-7 | Right-Wing Authoritarianism |
| RWA2 | 22 | 1-7 | Shortened RWA |
| LWA | 39 | 1-7 | Left-Wing Authoritarianism |
| MFQ | 36 | 1-5 | Moral Foundations Questionnaire |
| NFC | 18 | -4 to 4 | Need for Cognition |
| BFI-10 | 10 | 1-5 | Big Five Inventory (short form) |
| SDO-7 | 8 | 1-7 | Social Dominance Orientation |
| RSES | 10 | 1-4 | Rosenberg Self-Esteem Scale |
| GSE | 10 | 1-4 | General Self-Efficacy Scale |
| LOT-R | 10 | 0-4 | Life Orientation Test-Revised |

## Built-in Personas

### Text Assessment
- **Minimal**: No framing (baseline)
- **Neutral**: Explicitly neutral perspective
- **US Political Spectrum**: Moderate/Extreme Liberal/Conservative variations

### Visual Stimulus Assessment
- **Minimal**: No framing - raw model response to the image
- Custom personas can be created manually or AI-generated

## Vision-Capable Models

The following models support image input for Visual Assessment:

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5.2, GPT-5.1, GPT-5, GPT-5-mini, GPT-5-pro, GPT-4.1 series, GPT-4o series, o3, o4-mini, o1 series |
| Anthropic | Claude 4.5 series, Claude 4 series, Claude 3.7 series, Claude 3.5 Haiku |
| Gemini | Gemini 2.5 Pro/Flash, Gemini 2.0 Flash |
| Groq | Llama 3.2 90B/11B Vision |

## API Endpoints

### Text Assessment
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scales` | GET | List all scales |
| `/api/scales/validate` | POST | Validate custom scale |
| `/api/personas` | GET | List all personas |
| `/api/personas/generate` | POST | AI-generate personas |
| `/api/jobs` | POST | Create assessment job |
| `/api/jobs/{id}` | GET | Get job status |
| `/api/jobs/{id}/download` | GET | Download results |
| `/api/keys/validate` | POST | Validate API key |

### Visual Stimulus Assessment
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/visual/jobs` | POST | Create visual assessment job |
| `/api/visual/jobs/{id}` | GET | Get visual job status |
| `/api/visual/jobs/{id}/summary` | GET | Get visual job results |
| `/api/visual/jobs/{id}/download` | GET | Download visual results |
| `/api/visual/models` | GET | List vision-capable models |

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set build settings:
   - Framework: Next.js
   - Root Directory: `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend URL

### Backend (Railway/Fly.io)

1. Deploy from the `backend` directory
2. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add any required environment variables

## Development

```bash
# Backend formatting
cd backend
black app/
flake8 app/

# Frontend linting
cd frontend
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
