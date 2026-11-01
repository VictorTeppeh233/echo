import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Conversation, Message, UserProfile, Persona, Goal
from app.schemas.schemas import (
    ConversationCreate, ConversationUpdate, ConversationResponse,
    MessageCreate, MessageResponse, ChatStreamRequest
)
from app.services.persona.engine import persona_engine
from app.services.rag.chroma import rag_service
from app.services.memory.manager import memory_manager
from app.services.ollama.client import ollama_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=List[ConversationResponse])
def list_conversations(persona_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Conversation)
    if persona_id:
        query = query.filter((Conversation.persona_id == persona_id) | (Conversation.persona_id.is_(None)))
    return query.order_by(Conversation.updated_at.desc()).all()

@router.post("", response_model=ConversationResponse)
def create_conversation(data: ConversationCreate, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="User profile must be initialized first.")

    # Determine persona
    persona_id = data.persona_id
    if not persona_id:
        active_persona = db.query(Persona).filter(Persona.is_active == True).first()
        if active_persona:
            persona_id = active_persona.id

    conv = Conversation(
        user_id=profile.id,
        persona_id=persona_id,
        title=data.title or "Echo Session",
        mode=data.mode or "Reflection"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.put("/{conversation_id}", response_model=ConversationResponse)
def update_conversation(conversation_id: str, data: ConversationUpdate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if data.title is not None:
        conv.title = data.title
    if data.mode is not None:
        conv.mode = data.mode

    db.commit()
    db.refresh(conv)
    return conv

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "ok", "message": "Conversation deleted"}

@router.post("/{conversation_id}/stream")
async def stream_chat(
    conversation_id: str,
    req: ChatStreamRequest,
    db: Session = Depends(get_db)
):
    """Server-Sent Events (SSE) streaming endpoint with RAG context assembly."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    # Get active persona
    persona = None
    if conv.persona_id:
        persona = db.query(Persona).filter(Persona.id == conv.persona_id).first()
    if not persona:
        persona = db.query(Persona).filter(Persona.is_active == True).first()
    
    persona_name = persona.name if persona else "Future Self"
    personality = persona.personality if persona else "Calm and reflective, Disciplined and direct"
    sys_config = persona.system_configuration if persona else None

    # Update conversation mode if requested
    if req.mode and req.mode != conv.mode:
        conv.mode = req.mode
        db.commit()

    # Save user message to database
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 1. RAG Retrieval from ChromaDB
    retrieved_sources = await rag_service.search(
        query=req.message,
        user_id=profile.id,
        persona_id=conv.persona_id,
        top_k=4
    )

    # 2. Get active user goals for prompt injection
    goals_query = db.query(Goal).filter(Goal.user_id == profile.id)
    if conv.persona_id:
        goals_query = goals_query.filter((Goal.persona_id == conv.persona_id) | (Goal.persona_id.is_(None)))
    active_goals = [
        {
            "title": g.title,
            "category": g.category,
            "progress": g.progress,
            "status": g.status,
            "challenges": g.challenges,
            "why_matters": g.why_matters,
            "milestones": [{"title": m.title, "completed": m.completed} for m in g.milestones]
        }
        for g in goals_query.all()
    ]

    # 3. Dynamic system prompt construction
    system_prompt = persona_engine.construct_system_prompt(
        user_name=profile.name,
        current_situation=profile.current_situation,
        personal_description=profile.personal_description,
        values=profile.values,
        persona_name=persona_name,
        personality=personality,
        system_configuration=sys_config,
        goals=active_goals,
        retrieved_context=retrieved_sources,
        conversation_mode=conv.mode
    )

    # 4. Short-term conversation history
    history = memory_manager.get_short_term_history(db=db, conversation_id=conv.id, limit=8)
    
    # Form message list for Ollama
    messages_payload = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages_payload.append(h)

    # SSE Event Generator
    async def event_generator():
        full_response_text = ""
        sources_payload = [
            {
                "title": s.get("title"),
                "source_type": s.get("source_type"),
                "filename": s.get("filename"),
                "similarity": s.get("similarity"),
                "snippet": s.get("content", "")[:120] + "..."
            }
            for s in retrieved_sources
        ]

        # Send initial metadata event with sources
        meta_event = {
            "type": "meta",
            "sources": sources_payload,
            "mode": conv.mode
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        # Stream Ollama tokens
        async for token in ollama_service.chat_stream(messages=messages_payload):
            full_response_text += token
            data = {"type": "token", "content": token}
            yield f"data: {json.dumps(data)}\n\n"

        # Save assistant message to DB
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=full_response_text,
            sources_json=json.dumps(sources_payload) if sources_payload else None
        )
        db.add(assistant_msg)
        
        # Auto-generate title if it's the first exchange
        msg_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
        if msg_count <= 2 and (conv.title == "Echo Session" or not conv.title):
            conv.title = req.message[:35] + ("..." if len(req.message) > 35 else "")

        db.commit()

        # Trigger automatic memory extraction in background if significant
        try:
            await memory_manager.extract_insights_from_conversation(
                db=db,
                user_id=profile.id,
                persona_id=conv.persona_id,
                user_message=req.message,
                ai_response=full_response_text
            )
        except Exception as e:
            logger.debug(f"Memory extraction background skipped: {e}")

        # Send completion event
        done_event = {"type": "done", "message_id": assistant_msg.id}
        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
