from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import (
    UserProfile, Persona, Goal, Milestone,
    Conversation, Message, Memory, Document, JournalEntry
)
from app.services.rag.chroma import rag_service
from app.core.config import settings

router = APIRouter(tags=["System"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

@router.get("/system/status")
def system_status(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    return {
        "is_onboarded": profile is not None,
        "user_name": profile.name if profile else None,
        "stats": {
            "personas": db.query(Persona).count(),
            "goals": db.query(Goal).count(),
            "milestones": db.query(Milestone).count(),
            "conversations": db.query(Conversation).count(),
            "messages": db.query(Message).count(),
            "memories": db.query(Memory).count(),
            "documents": db.query(Document).count(),
            "journal_entries": db.query(JournalEntry).count(),
        },
        "config": {
            "chat_model": settings.OLLAMA_CHAT_MODEL,
            "embed_model": settings.OLLAMA_EMBED_MODEL,
            "ollama_base_url": settings.OLLAMA_BASE_URL,
            "local_only": True
        }
    }

@router.get("/privacy/export")
def export_user_data(db: Session = Depends(get_db)):
    """Export all user data in clean JSON format for local backup."""
    profile = db.query(UserProfile).first()
    if not profile:
        return {"data": None}

    return {
        "profile": {
            "name": profile.name,
            "current_situation": profile.current_situation,
            "personal_description": profile.personal_description,
            "values": profile.values
        },
        "personas": [
            {"name": p.name, "description": p.description, "personality": p.personality}
            for p in profile.personas
        ],
        "goals": [
            {
                "title": g.title,
                "description": g.description,
                "category": g.category,
                "progress": g.progress,
                "status": g.status,
                "importance": g.importance,
                "challenges": g.challenges,
                "why_matters": g.why_matters,
                "milestones": [{"title": m.title, "completed": m.completed} for m in g.milestones]
            }
            for g in profile.goals
        ],
        "memories": [
            {"category": m.category, "content": m.content, "source": m.source, "importance": m.importance}
            for m in profile.memories
        ],
        "journal_entries": [
            {"title": j.title, "content": j.content, "mood": j.mood, "created_at": str(j.created_at)}
            for j in profile.journal_entries
        ],
        "documents": [
            {"filename": d.filename, "file_type": d.file_type, "chunk_count": d.chunk_count}
            for d in profile.documents
        ]
    }
