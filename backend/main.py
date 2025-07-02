from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_client import get_hint, explain_error, analyze_code, get_optimal_code, get_similar_problems, get_companies_asked
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HintRequest(BaseModel):
    problem_description: str

class ErrorExplainRequest(BaseModel):
    code: str
    error: str

class AnalyzeRequest(BaseModel):
    code: str
    problem_description: str

class OptimalCodeRequest(BaseModel):
    problem_description: str

class ExplainErrorRequest(BaseModel):
    code: str
    error: str

class SimilarProblemsRequest(BaseModel):
    problem_description: str

class YouTubeSearchRequest(BaseModel):
    query: str

YOUTUBE_API_KEY = "AIzaSyC4FFBdp7gVn3XuU68f-FKdP-giSF_5GIc"

@app.post("/hint")
async def hint(req: HintRequest):
    return {"hint": get_hint(req.problem_description)}

@app.post("/explain_error")
async def explain_error_ep(req: ErrorExplainRequest):
    return {"explanation": explain_error(req.code, req.error)}

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    return analyze_code(req.code, req.problem_description)

@app.post("/optimal_code")
async def optimal_code(req: OptimalCodeRequest):
    return get_optimal_code(req.problem_description)

@app.post("/explain_error")
async def explain_error_api(req: ExplainErrorRequest):
    return {"explanation": explain_error(req.code, req.error)}

@app.post("/similar_problems")
async def similar_problems(req: SimilarProblemsRequest):
    return {"similar": get_similar_problems(req.problem_description)}

@app.post("/youtube_search")
async def youtube_search(req: YouTubeSearchRequest):
    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": req.query,
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video"
    }
    try:
        response = requests.get(search_url, params=params)
        data = response.json()
        if (
            "items" in data and
            len(data["items"]) > 0 and
            "id" in data["items"][0] and
            "videoId" in data["items"][0]["id"]
        ):
            return {"videoId": data["items"][0]["id"]["videoId"]}
        else:
            return {"error": "No video found"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/companies_asked")
async def companies_asked(req: SimilarProblemsRequest):
    return {"companies": get_companies_asked(req.problem_description)} 