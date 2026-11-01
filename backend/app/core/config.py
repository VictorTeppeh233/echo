import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ECHO"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_DIR: Path = DATA_DIR / "database"
    CHROMA_DIR: Path = DATA_DIR / "chroma"
    DOCS_DIR: Path = DATA_DIR / "documents"
    
    # SQLite Database
    DATABASE_URL: str = f"sqlite:///{DB_DIR}/echo.db"
    
    # ChromaDB
    CHROMA_PERSIST_DIR: str = str(CHROMA_DIR)
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_CHAT_MODEL: str = "gemma4:latest"
    OLLAMA_EMBED_MODEL: str = "all-minilm:latest"
    OLLAMA_TIMEOUT: float = 120.0
    
    # RAG Settings
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOP_K_RETRIEVAL: int = 4
    SIMILARITY_THRESHOLD: float = 0.65
    
    # Persona Settings
    CONVERSATION_HISTORY_LIMIT: int = 10
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DB_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_DIR, exist_ok=True)
os.makedirs(settings.DOCS_DIR, exist_ok=True)
