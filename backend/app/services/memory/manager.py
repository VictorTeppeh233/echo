import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Memory, Message, Conversation, UserProfile
from app.services.rag.chroma import rag_service
from app.services.ollama.client import ollama_service

logger = logging.getLogger(__name__)

class MemoryManager:
    @staticmethod
    def get_short_term_history(
        db: Session,
        conversation_id: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Fetch recent message history formatted for LLM conversation."""
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        # Reverse to chronological order
        chronological = list(reversed(messages))
        return [{"role": m.role, "content": m.content} for m in chronological]

    @staticmethod
    async def create_memory(
        db: Session,
        user_id: str,
        category: str,
        content: str,
        persona_id: Optional[str] = None,
        source: str = "manual",
        source_id: Optional[str] = None,
        importance: int = 3
    ) -> Memory:
        """Create memory in SQLite and sync vector embedding to ChromaDB."""
        memory = Memory(
            user_id=user_id,
            persona_id=persona_id,
            category=category,
            content=content,
            source=source,
            source_id=source_id,
            importance=importance
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)

        # Index in ChromaDB
        try:
            await rag_service.add_or_update_memory(
                memory_id=memory.id,
                user_id=user_id,
                persona_id=persona_id,
                category=category,
                content=content,
                importance=importance
            )
        except Exception as e:
            logger.error(f"Error vectorizing memory {memory.id}: {e}")

        return memory

    @staticmethod
    async def delete_memory(db: Session, memory_id: str) -> bool:
        """Delete memory from SQLite and remove vectors from ChromaDB."""
        memory = db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            return False

        # Remove from ChromaDB
        rag_service.delete_by_source_id(memory.id)

        # Remove from SQLite
        db.delete(memory)
        db.commit()
        return True

    @staticmethod
    async def extract_insights_from_conversation(
        db: Session,
        user_id: str,
        persona_id: Optional[str],
        user_message: str,
        ai_response: str
    ) -> Optional[Memory]:
        """Extract high-value personal commitments, obstacles, or milestones from dialogue."""
        # Check if exchange contains meaningful content
        if len(user_message.strip()) < 25:
            return None

        prompt = f"""Analyze this single conversation turn between a user and their Future Self AI.
Identify if the user stated any significant personal goal, recurring obstacle, major commitment, breakthrough insight, or personal preference that should be remembered permanently.

USER: "{user_message}"
FUTURE SELF: "{ai_response}"

If there is a significant long-term insight worth remembering, output JSON format:
{{"has_memory": true, "category": "Goals"|"Challenges"|"Experiences"|"Preferences"|"Milestones", "content": "Concise summary of the memory", "importance": 1 to 5}}

If it is just casual conversation, general questions, or transient chatter, output:
{{"has_memory": false}}
Return ONLY valid JSON."""

        try:
            extraction = await ollama_service.chat_complete(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            # Parse JSON safely
            cleaned = extraction.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()

            data = json.loads(cleaned)
            if data.get("has_memory") and data.get("content"):
                mem = await MemoryManager.create_memory(
                    db=db,
                    user_id=user_id,
                    persona_id=persona_id,
                    category=data.get("category", "Personal identity"),
                    content=data.get("content"),
                    source="conversation",
                    importance=data.get("importance", 3)
                )
                return mem
        except Exception as e:
            logger.debug(f"Insight extraction skipped or failed: {e}")
            return None

memory_manager = MemoryManager()
