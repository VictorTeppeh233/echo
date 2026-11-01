from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Memory, UserProfile
from app.schemas.schemas import MemoryCreate, MemoryUpdate, MemoryResponse
from app.services.memory.manager import memory_manager
from app.services.rag.chroma import rag_service

router = APIRouter(prefix="/memories", tags=["Memories"])

@router.get("", response_model=List[MemoryResponse])
def list_memories(
    category: Optional[str] = None,
    persona_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Memory)
    if category and category != "All":
        query = query.filter(Memory.category == category)
    if persona_id:
        query = query.filter((Memory.persona_id == persona_id) | (Memory.persona_id.is_(None)))
    return query.order_by(Memory.created_at.desc()).all()

@router.post("", response_model=MemoryResponse)
async def create_memory(data: MemoryCreate, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="User profile must be initialized first.")

    mem = await memory_manager.create_memory(
        db=db,
        user_id=profile.id,
        category=data.category,
        content=data.content,
        persona_id=data.persona_id,
        source=data.source,
        importance=data.importance
    )
    return mem

@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(memory_id: str, data: MemoryUpdate, db: Session = Depends(get_db)):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    if data.category is not None:
        mem.category = data.category
    if data.content is not None:
        mem.content = data.content
    if data.importance is not None:
        mem.importance = data.importance

    db.commit()
    db.refresh(mem)

    # Update in ChromaDB
    try:
        await rag_service.add_or_update_memory(
            memory_id=mem.id,
            user_id=mem.user_id,
            persona_id=mem.persona_id,
            category=mem.category,
            content=mem.content,
            importance=mem.importance
        )
    except Exception:
        pass

    return mem

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    success = await memory_manager.delete_memory(db=db, memory_id=memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "ok", "message": "Memory deleted from local database and vector store"}
