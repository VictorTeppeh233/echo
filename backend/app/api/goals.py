from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Goal, Milestone, UserProfile
from app.schemas.schemas import (
    GoalCreate, GoalUpdate, GoalResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse
)
from app.services.memory.manager import memory_manager

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("", response_model=List[GoalResponse])
def list_goals(persona_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all goals with optional persona filter."""
    query = db.query(Goal)
    if persona_id:
        query = query.filter((Goal.persona_id == persona_id) | (Goal.persona_id.is_(None)))
    return query.order_by(Goal.created_at.desc()).all()

@router.post("", response_model=GoalResponse)
async def create_goal(data: GoalCreate, db: Session = Depends(get_db)):
    """Create a new goal and optional initial milestones."""
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="UserProfile does not exist.")

    goal = Goal(
        user_id=profile.id,
        persona_id=data.persona_id,
        title=data.title,
        description=data.description,
        category=data.category,
        target_date=data.target_date,
        status=data.status,
        progress=data.progress,
        importance=data.importance,
        challenges=data.challenges,
        why_matters=data.why_matters
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    if data.milestones:
        for m in data.milestones:
            ms = Milestone(
                goal_id=goal.id,
                title=m.title,
                description=m.description,
                completed=m.completed
            )
            db.add(ms)
        db.commit()
        db.refresh(goal)

    # Record into memory for RAG context
    await memory_manager.create_memory(
        db=db,
        user_id=profile.id,
        persona_id=data.persona_id,
        category="Goals",
        content=f"Goal created: {goal.title}. Category: {goal.category}. Importance: {goal.importance}. Why it matters: {goal.why_matters or 'Personal ambition'}.",
        source="goal",
        source_id=goal.id,
        importance=4
    )

    return goal

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, data: GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    old_progress = goal.progress
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)

    # If progress reached 100%, record milestone achievement memory
    if goal.progress == 100 and old_progress < 100:
        await memory_manager.create_memory(
            db=db,
            user_id=goal.user_id,
            persona_id=goal.persona_id,
            category="Milestones",
            content=f"Completed Goal: '{goal.title}'. Successfully achieved 100% progress.",
            source="goal_completion",
            source_id=goal.id,
            importance=5
        )

    return goal

@router.delete("/{goal_id}")
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"status": "ok", "message": "Goal deleted"}

# --- Milestones ---

@router.get("/{goal_id}/milestones", response_model=List[MilestoneResponse])
def get_goal_milestones(goal_id: str, db: Session = Depends(get_db)):
    return db.query(Milestone).filter(Milestone.goal_id == goal_id).all()

@router.post("/{goal_id}/milestones", response_model=MilestoneResponse)
def add_milestone(goal_id: str, data: MilestoneCreate, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    ms = Milestone(
        goal_id=goal.id,
        title=data.title,
        description=data.description,
        completed=data.completed,
        completed_at=datetime.now(timezone.utc) if data.completed else None
    )
    db.add(ms)
    db.commit()
    db.refresh(ms)
    return ms

milestones_router = APIRouter(prefix="/milestones", tags=["Milestones"])

@milestones_router.put("/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(milestone_id: str, data: MilestoneUpdate, db: Session = Depends(get_db)):
    ms = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if data.title is not None:
        ms.title = data.title
    if data.description is not None:
        ms.description = data.description
    if data.completed is not None:
        ms.completed = data.completed
        if data.completed and not ms.completed_at:
            ms.completed_at = datetime.now(timezone.utc)
            # Record milestone memory
            goal = db.query(Goal).filter(Goal.id == ms.goal_id).first()
            if goal:
                await memory_manager.create_memory(
                    db=db,
                    user_id=goal.user_id,
                    persona_id=goal.persona_id,
                    category="Milestones",
                    content=f"Achieved milestone: '{ms.title}' for goal '{goal.title}'.",
                    source="milestone",
                    source_id=ms.id,
                    importance=4
                )
        elif not data.completed:
            ms.completed_at = None

    db.commit()
    db.refresh(ms)
    return ms

@milestones_router.delete("/{milestone_id}")
def delete_milestone(milestone_id: str, db: Session = Depends(get_db)):
    ms = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(ms)
    db.commit()
    return {"status": "ok", "message": "Milestone deleted"}
