from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.database import init_db
from app.api import (
    profile, goals, personas, conversations,
    documents, memories, journal, ollama, system
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite tables exist
    init_db()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="A Local-First, Open-Source, RAG-Powered Future-Self AI Companion",
    lifespan=lifespan
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(system.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(goals.milestones_router, prefix="/api")
app.include_router(personas.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(memories.router, prefix="/api")
app.include_router(journal.router, prefix="/api")
app.include_router(ollama.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "ECHO Core API is active.",
        "tagline": "Your future self is waiting.",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
