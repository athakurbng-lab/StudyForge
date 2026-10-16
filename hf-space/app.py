import os
import time
import uuid
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("studyforge-bonsai")

# Configuration via environment variables
STUDYFORGE_API_KEY = os.environ.get("STUDYFORGE_API_KEY", "").strip()
MODEL_REPO_ID = os.environ.get("MODEL_REPO_ID", "prism-ml/Ternary-Bonsai-2-4B-gguf").strip()
MODEL_FILENAME = os.environ.get("MODEL_FILENAME", "Ternary-Bonsai-2-4B-Q2_0.gguf").strip()
N_CTX = int(os.environ.get("N_CTX", "2048"))
N_THREADS = int(os.environ.get("N_THREADS", "2"))

logger.info(f"Configuration: REPO={MODEL_REPO_ID}, FILE={MODEL_FILENAME}, CTX={N_CTX}, THREADS={N_THREADS}")

# Global LLM instance
llm: Optional[Llama] = None

app = FastAPI(
    title="StudyForge Ternary Bonsai 2 Engine",
    description="Self-hosted OpenAI-compatible LLM endpoint running Ternary Bonsai 2 on free Hugging Face Spaces",
    version="1.0.0"
)

# Enable CORS for StudyForge Web and Mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_or_load_model() -> Llama:
    global llm
    if llm is None:
        logger.info(f"Downloading/Locating model {MODEL_FILENAME} from {MODEL_REPO_ID}...")
        model_path = hf_hub_download(
            repo_id=MODEL_REPO_ID,
            filename=MODEL_FILENAME
        )
        logger.info(f"Model downloaded to: {model_path}. Initializing Llama runtime...")
        llm = Llama(
            model_path=model_path,
            n_ctx=N_CTX,
            n_threads=N_THREADS,
            verbose=False
        )
        logger.info("Llama model initialized successfully!")
    return llm

@app.on_event("startup")
async def startup_event():
    try:
        get_or_load_model()
    except Exception as e:
        logger.error(f"Error during startup model loading: {e}", exc_info=True)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "prism-ml/Ternary-Bonsai-2-4B-gguf"
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.2
    response_format: Optional[Dict[str, Any]] = None

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "StudyForge AI Engine",
        "model": MODEL_REPO_ID,
        "file": MODEL_FILENAME,
        "auth_required": bool(STUDYFORGE_API_KEY)
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}

@app.post("/v1/chat/completions")
async def chat_completions(
    req: ChatCompletionRequest,
    authorization: Optional[str] = Header(None)
):
    # Authenticate via Bearer token if STUDYFORGE_API_KEY is set
    if STUDYFORGE_API_KEY:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or malformed Authorization header. Expected Bearer token."
            )
        token = authorization.split("Bearer ", 1)[1].strip()
        if token != STUDYFORGE_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid StudyForge API key."
            )

    try:
        model_instance = get_or_load_model()
    except Exception as e:
        logger.error(f"Failed to load model: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model failed to initialize: {str(e)}"
        )

    # Format messages for llama_cpp chat completion
    formatted_messages = [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        start_time = time.time()
        logger.info(f"Generating completion with {len(formatted_messages)} messages (temp={req.temperature})...")
        
        output = model_instance.create_chat_completion(
            messages=formatted_messages,
            max_tokens=req.max_tokens or 512,
            temperature=req.temperature or 0.2,
        )
        elapsed = time.time() - start_time
        logger.info(f"Completion generated successfully in {elapsed:.2f}s")
        return output
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )
