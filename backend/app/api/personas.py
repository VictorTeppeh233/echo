from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Persona, UserProfile
from app.schemas.schemas import PersonaCreate, PersonaUpdate, PersonaResponse

router = APIRouter(prefix="/personas", tags=["Personas"])

@router.get("", response_model=List[PersonaResponse])
def list_personas(db: Session = Depends(get_db)):
    return db.query(Persona).order_by(Persona.created_at.desc()).all()

@router.post("", response_model=PersonaResponse)
def create_persona(data: PersonaCreate, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="User profile must be initialized first.")

    # If this persona is set active, deactivate others
    if data.is_active:
        db.query(Persona).update({"is_active": False})

    persona = Persona(
        user_id=profile.id,
        name=data.name,
        description=data.description,
        personality=data.personality,
        system_configuration=data.system_configuration,
        is_active=data.is_active
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona

@router.get("/{persona_id}", response_model=PersonaResponse)
def get_persona(persona_id: str, db: Session = Depends(get_db)):
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    return p

@router.put("/{persona_id}", response_model=PersonaResponse)
def update_persona(persona_id: str, data: PersonaUpdate, db: Session = Depends(get_db)):
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")

    if data.is_active is True:
        db.query(Persona).filter(Persona.id != persona_id).update({"is_active": False})

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(p, key, value)

    db.commit()
    db.refresh(p)
    return p

@router.delete("/{persona_id}")
def delete_persona(persona_id: str, db: Session = Depends(get_db)):
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    db.delete(p)
    db.commit()
    return {"status": "ok", "message": "Persona deleted"}

@router.post("/{persona_id}/activate", response_model=PersonaResponse)
def activate_persona(persona_id: str, db: Session = Depends(get_db)):
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    db.query(Persona).update({"is_active": False})
    p.is_active = True
    db.commit()
    db.refresh(p)
    return p
