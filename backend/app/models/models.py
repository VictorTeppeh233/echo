import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    current_situation = Column(Text, nullable=True)
    personal_description = Column(Text, nullable=True)
    values = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    personas = relationship("Persona", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")

class Persona(Base):
    __tablename__ = "personas"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False) # e.g., "The Frontier AI Researcher", "The Startup Founder"
    description = Column(Text, nullable=True)
    personality = Column(Text, nullable=False) # JSON or comma-separated traits: "Calm and reflective, Disciplined and direct"
    system_configuration = Column(Text, nullable=True) # Custom prompt adjustments
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("UserProfile", back_populates="personas")
    goals = relationship("Goal", back_populates="persona", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="persona", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="persona", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="persona")
    journal_entries = relationship("JournalEntry", back_populates="persona")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(36), ForeignKey("personas.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="Career")
    target_date = Column(String(50), nullable=True)
    status = Column(String(20), default="active") # active, completed, paused
    progress = Column(Integer, default=0) # 0 - 100
    importance = Column(String(20), default="high") # high, medium, low
    challenges = Column(Text, nullable=True)
    why_matters = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("UserProfile", back_populates="goals")
    persona = relationship("Persona", back_populates="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    goal_id = Column(String(36), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    goal = relationship("Goal", back_populates="milestones")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(36), ForeignKey("personas.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(200), default="Echo Session")
    mode = Column(String(50), default="Reflection") # Reflection, Strategic Guidance, Accountability, Decision-Making
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("UserProfile", back_populates="conversations")
    persona = relationship("Persona", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    sources_json = Column(Text, nullable=True) # JSON list of cited memories / docs
    created_at = Column(DateTime(timezone=True), default=utc_now)

    conversation = relationship("Conversation", back_populates="messages")

class Memory(Base):
    __tablename__ = "memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(36), ForeignKey("personas.id", ondelete="CASCADE"), nullable=True)
    category = Column(String(50), default="Personal identity") # Personal identity, Career and education, Goals, Experiences, Challenges, Preferences, Milestones, Reflections
    content = Column(Text, nullable=False)
    source = Column(String(50), default="manual") # manual, conversation, journal, document, onboarding
    source_id = Column(String(100), nullable=True)
    importance = Column(Integer, default=3) # 1 - 5
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("UserProfile", back_populates="memories")
    persona = relationship("Persona", back_populates="memories")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(36), ForeignKey("personas.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, txt, md
    file_size = Column(Integer, default=0) # in bytes
    storage_path = Column(String(500), nullable=False)
    chunk_count = Column(Integer, default=0)
    processing_status = Column(String(50), default="processed") # pending, processing, processed, failed
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("UserProfile", back_populates="documents")
    persona = relationship("Persona", back_populates="documents")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(36), ForeignKey("personas.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    mood = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("UserProfile", back_populates="journal_entries")
    persona = relationship("Persona", back_populates="journal_entries")
