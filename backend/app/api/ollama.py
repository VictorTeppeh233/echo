from fastapi import APIRouter
from app.core.config import settings
from app.schemas.schemas import OllamaStatusResponse, OllamaConfigUpdate
from app.services.ollama.client import ollama_service

router = APIRouter(prefix="/ollama", tags=["Ollama"])

@router.get("/status", response_model=OllamaStatusResponse)
async def get_ollama_status():
    status = await ollama_service.check_health()
    return status

@router.get("/models")
async def get_models():
    models = await ollama_service.list_models()
    return {"models": models}

@router.post("/test")
async def test_ollama():
    try:
        reply = await ollama_service.chat_complete(
            messages=[{"role": "user", "content": "Respond with: 'OLLAMA_ONLINE'"}]
        )
        return {"status": "ok", "response": reply.strip()}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.put("/config")
def update_ollama_config(data: OllamaConfigUpdate):
    if data.chat_model:
        settings.OLLAMA_CHAT_MODEL = data.chat_model
    if data.embed_model:
        settings.OLLAMA_EMBED_MODEL = data.embed_model
    if data.base_url:
        settings.OLLAMA_BASE_URL = data.base_url
        ollama_service.base_url = data.base_url.rstrip("/")

    return {
        "status": "ok",
        "chat_model": settings.OLLAMA_CHAT_MODEL,
        "embed_model": settings.OLLAMA_EMBED_MODEL,
        "base_url": settings.OLLAMA_BASE_URL
    }
