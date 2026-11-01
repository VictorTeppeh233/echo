from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- User Profile Schemas ---
class UserProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    current_situation: Optional[str] = None
    personal_description: Optional[str] = None
    values: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    current_situation: Optional[str] = None
    personal_description: Optional[str] = None
    values: Optional[str] = None

class UserProfileResponse(UserProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Persona Schemas ---
class PersonaBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    personality: str = Field(..., description="E.g. Calm and reflective, Disciplined and direct")
    system_configuration: Optional[str] = None
    is_active: bool = True

class PersonaCreate(PersonaBase):
    pass

class PersonaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    personality: Optional[str] = None
    system_configuration: Optional[str] = None
    is_active: Optional[bool] = None

class PersonaResponse(PersonaBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Milestone Schemas ---
class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    completed: bool = False

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class MilestoneResponse(MilestoneBase):
    id: str
    goal_id: str
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Goal Schemas ---
class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: str = "Career"
    target_date: Optional[str] = None
    status: str = "active"
    progress: int = Field(default=0, ge=0, le=100)
    importance: str = "high"
    challenges: Optional[str] = None
    why_matters: Optional[str] = None

class GoalCreate(GoalBase):
    persona_id: Optional[str] = None
    milestones: Optional[List[MilestoneCreate]] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    importance: Optional[str] = None
    challenges: Optional[str] = None
    why_matters: Optional[str] = None

class GoalResponse(GoalBase):
    id: str
    user_id: str
    persona_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True

# --- Conversation & Message Schemas ---
class MessageBase(BaseModel):
    role: str # user, assistant, system
    content: str

class MessageCreate(MessageBase):
    sources_json: Optional[str] = None

class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    sources_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: str = "Echo Session"
    mode: str = "Reflection" # Reflection, Strategic Guidance, Accountability, Decision-Making

class ConversationCreate(ConversationBase):
    persona_id: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None

class ConversationResponse(ConversationBase):
    id: str
    user_id: str
    persona_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ChatStreamRequest(BaseModel):
    message: str
    mode: Optional[str] = "Reflection"

# --- Memory Schemas ---
class MemoryBase(BaseModel):
    category: str = "Personal identity"
    content: str
    source: str = "manual"
    source_id: Optional[str] = None
    importance: int = Field(default=3, ge=1, le=5)

class MemoryCreate(MemoryBase):
    persona_id: Optional[str] = None

class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    content: Optional[str] = None
    importance: Optional[int] = Field(None, ge=1, le=5)

class MemoryResponse(MemoryBase):
    id: str
    user_id: str
    persona_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: str
    user_id: str
    persona_id: Optional[str] = None
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    processing_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Journal Schemas ---
class JournalEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str
    mood: Optional[str] = None

class JournalEntryCreate(JournalEntryBase):
    persona_id: Optional[str] = None

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    user_id: str
    persona_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Ollama & System Schemas ---
class OllamaStatusResponse(BaseModel):
    available: bool
    base_url: str
    chat_model: str
    embed_model: str
    models_available: List[str] = []
    error: Optional[str] = None

class OllamaConfigUpdate(BaseModel):
    chat_model: Optional[str] = None
    embed_model: Optional[str] = None
    base_url: Optional[str] = None

# --- Onboarding Initialization Schema ---
class OnboardingGoal(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str = "Career"
    importance: str = "high"
    challenges: Optional[str] = ""
    why_matters: Optional[str] = ""

class OnboardingRequest(BaseModel):
    # A. About User
    name: str
    current_situation: str
    challenges: Optional[str] = ""
    # B. Desired Future
    desired_future: str
    skills_to_develop: Optional[str] = ""
    success_definition: Optional[str] = ""
    # C. Goals
    goals: List[OnboardingGoal] = []
    # D. Persona Personality
    persona_name: Optional[str] = "Future Self"
    personality_traits: List[str] = ["Calm and reflective", "Disciplined and direct"]
    conversation_mode: Optional[str] = "Reflection"
