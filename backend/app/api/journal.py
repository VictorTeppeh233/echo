from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import JournalEntry, UserProfile
from app.schemas.schemas import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from app.services.rag.chroma import rag_service

router = APIRouter(prefix="/journal", tags=["Journal"])

@router.get("", response_model=List[JournalEntryResponse])
def list_journal_entries(persona_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(JournalEntry)
    if persona_id:
        query = query.filter((JournalEntry.persona_id == persona_id) | (JournalEntry.persona_id.is_(None)))
    return query.order_by(JournalEntry.created_at.desc()).all()

@router.post("", response_model=JournalEntryResponse)
async def create_journal_entry(data: JournalEntryCreate, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="User profile must be initialized first.")

    entry = JournalEntry(
        user_id=profile.id,
        persona_id=data.persona_id,
        title=data.title,
        content=data.content,
        mood=data.mood
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Embed in ChromaDB as reflection knowledge
    try:
        await rag_service.add_or_update_journal(
            journal_id=entry.id,
            user_id=profile.id,
            persona_id=data.persona_id,
            title=entry.title,
            content=entry.content
        )
    except Exception:
        pass

    return entry

@router.put("/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(entry_id: str, data: JournalEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if data.title is not None:
        entry.title = data.title
    if data.content is not None:
        entry.content = data.content
    if data.mood is not None:
        entry.mood = data.mood

    db.commit()
    db.refresh(entry)

    # Update in ChromaDB
    try:
        await rag_service.add_or_update_journal(
            journal_id=entry.id,
            user_id=entry.user_id,
            persona_id=entry.persona_id,
            title=entry.title,
            content=entry.content
        )
    except Exception:
        pass

    return entry

@router.delete("/{entry_id}")
def delete_journal_entry(entry_id: str, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Delete vectors
    rag_service.delete_by_source_id(entry.id)

    db.delete(entry)
    db.commit()
    return {"status": "ok", "message": "Journal entry deleted"}
