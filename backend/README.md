# Code Buddy Backend (FastAPI + Gemini)

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Endpoints

- `POST /hint` — Get a hint for a problem
- `POST /explain_error` — Explain code errors
- `POST /analyze` — Analyze code for complexity and optimization
- `POST /optimal_code` — Get optimal code for a problem

## Gemini API

- Uses Gemini for all AI responses (API key is in `gemini_client.py`)
