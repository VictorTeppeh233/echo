import json
import logging
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.timeout = httpx.Timeout(settings.OLLAMA_TIMEOUT, connect=10.0)

    async def check_health(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is reachable and return models."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "available": True,
                        "base_url": self.base_url,
                        "chat_model": settings.OLLAMA_CHAT_MODEL,
                        "embed_model": settings.OLLAMA_EMBED_MODEL,
                        "models_available": models,
                        "error": None
                    }
                return {
                    "available": False,
                    "base_url": self.base_url,
                    "chat_model": settings.OLLAMA_CHAT_MODEL,
                    "embed_model": settings.OLLAMA_EMBED_MODEL,
                    "models_available": [],
                    "error": f"Ollama returned status {res.status_code}"
                }
        except Exception as e:
            logger.warning(f"Ollama connection check failed: {e}")
            return {
                "available": False,
                "base_url": self.base_url,
                "chat_model": settings.OLLAMA_CHAT_MODEL,
                "embed_model": settings.OLLAMA_EMBED_MODEL,
                "models_available": [],
                "error": f"Cannot connect to Ollama at {self.base_url}. Ensure Ollama is running (`ollama serve`)."
            }

    async def list_models(self) -> List[Dict[str, Any]]:
        """List all models available locally in Ollama."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    return res.json().get("models", [])
        except Exception as e:
            logger.error(f"Error listing Ollama models: {e}")
        return []

    async def generate_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
        """Generate embedding vector using local Ollama model."""
        embed_model = model or settings.OLLAMA_EMBED_MODEL
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # First try modern Ollama /api/embed
                payload = {"model": embed_model, "input": text}
                res = await client.post(f"{self.base_url}/api/embed", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    embeddings = data.get("embeddings", [])
                    if embeddings and len(embeddings) > 0:
                        return embeddings[0]

                # Fallback to legacy /api/embeddings
                payload_legacy = {"model": embed_model, "prompt": text}
                res_legacy = await client.post(f"{self.base_url}/api/embeddings", json=payload_legacy)
                if res_legacy.status_code == 200:
                    data = res_legacy.json()
                    return data.get("embedding", [])

                err_msg = f"Ollama embedding failed ({res.status_code}): {res.text}"
                logger.error(err_msg)
                raise RuntimeError(err_msg)
        except Exception as e:
            logger.error(f"Failed to generate embedding with {embed_model}: {e}")
            raise

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens from Ollama using SSE chunks."""
        chat_model = model or settings.OLLAMA_CHAT_MODEL
        payload = {
            "model": chat_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p
            }
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        yield f"[ERROR] Ollama request failed with status {response.status_code}: {err_text.decode('utf-8', errors='ignore')}"
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                            msg = chunk.get("message", {})
                            content = msg.get("content", "")
                            if content:
                                yield content
                            if chunk.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except httpx.ConnectError:
            yield f"[ERROR] Cannot connect to local Ollama at {self.base_url}. Is Ollama running?"
        except httpx.TimeoutException:
            yield f"[ERROR] Ollama request timed out after {settings.OLLAMA_TIMEOUT}s."
        except Exception as e:
            logger.exception("Error in chat streaming")
            yield f"[ERROR] Generation failed: {str(e)}"

    async def chat_complete(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Non-streaming chat completion from Ollama."""
        chat_model = model or settings.OLLAMA_CHAT_MODEL
        payload = {
            "model": chat_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}/api/chat", json=payload)
            if res.status_code == 200:
                data = res.json()
                return data.get("message", {}).get("content", "")
            raise RuntimeError(f"Ollama chat error {res.status_code}: {res.text}")

ollama_service = OllamaService()
