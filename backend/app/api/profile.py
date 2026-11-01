from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import UserProfile, Persona, Goal, Milestone, Memory
from app.schemas.schemas import (
    UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    OnboardingRequest
)
from app.services.rag.chroma import rag_service

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=UserProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    """Fetch the active local user profile, or return 404 if not yet onboarded."""
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    return profile

@router.put("", response_model=UserProfileResponse)
def update_profile(data: UserProfileUpdate, db: Session = Depends(get_db)):
    """Update profile attributes."""
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    
    if data.name is not None:
        profile.name = data.name
    if data.current_situation is not None:
        profile.current_situation = data.current_situation
    if data.personal_description is not None:
        profile.personal_description = data.personal_description
    if data.values is not None:
        profile.values = data.values

    db.commit()
    db.refresh(profile)
    return profile

@router.delete("")
def delete_profile(db: Session = Depends(get_db)):
    """Wipe all user data locally (privacy-first complete reset)."""
    profile = db.query(UserProfile).first()
    if not profile:
        return {"status": "ok", "message": "No profile existed."}
    
    # Wipe ChromaDB vectors for this user
    try:
        rag_service.delete_by_user_id(profile.id)
    except Exception:
        pass

    from app.models.models import (
        Persona, Goal, Milestone, Conversation, Message,
        Memory, Document, JournalEntry
    )
    db.query(Message).delete()
    db.query(Conversation).delete()
    db.query(Milestone).delete()
    db.query(Goal).delete()
    db.query(Memory).delete()
    db.query(Document).delete()
    db.query(JournalEntry).delete()
    db.query(Persona).delete()
    db.delete(profile)
    db.commit()
    return {"status": "ok", "message": "All local user data wiped completely."}

@router.post("/onboarding", response_model=UserProfileResponse)
async def complete_onboarding(req: OnboardingRequest, db: Session = Depends(get_db)):
    """Complete initial onboarding: initialize user, persona, goals, and starter memories."""
    # Check if a profile already exists
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            name=req.name,
            current_situation=req.current_situation,
            personal_description=req.desired_future,
            values="Resilience, Growth, Strategic Focus"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        profile.name = req.name
        profile.current_situation = req.current_situation
        profile.personal_description = req.desired_future
        db.commit()

    # Create primary Future Self persona
    traits_str = ", ".join(req.personality_traits) if req.personality_traits else "Calm and reflective, Disciplined and direct"
    persona = Persona(
        user_id=profile.id,
        name=req.persona_name or "Future Self",
        description=f"Accomplished future version who achieved: {req.desired_future[:200]}",
        personality=traits_str,
        is_active=True
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)

    # Create goals
    for g in req.goals:
        goal = Goal(
            user_id=profile.id,
            persona_id=persona.id,
            title=g.title,
            description=g.description,
            category=g.category,
            importance=g.importance,
            challenges=g.challenges,
            why_matters=g.why_matters,
            progress=0,
            status="active"
        )
        db.add(goal)
    db.commit()

    # Index starter memories in SQLite and ChromaDB
    starter_memories = [
        ("Personal identity", f"I am {req.name}. My current starting situation is: {req.current_situation}."),
        ("Goals", f"My ultimate desired future and who I want to become: {req.desired_future}."),
    ]
    if req.challenges:
        starter_memories.append(("Challenges", f"Current key obstacles: {req.challenges}."))
    if req.skills_to_develop:
        starter_memories.append(("Career and education", f"Skills to develop: {req.skills_to_develop}."))
    if req.success_definition:
        starter_memories.append(("Personal identity", f"What success means to me: {req.success_definition}."))

    for cat, content in starter_memories:
        mem = Memory(
            user_id=profile.id,
            persona_id=persona.id,
            category=cat,
            content=content,
            source="onboarding",
            importance=4
        )
        db.add(mem)
        db.commit()
        db.refresh(mem)
        try:
            await rag_service.add_or_update_memory(
                memory_id=mem.id,
                user_id=profile.id,
                persona_id=persona.id,
                category=cat,
                content=content,
                importance=4
            )
        except Exception:
            pass

    return profile
