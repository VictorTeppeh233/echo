import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.config import settings
from app.models.models import Document, UserProfile
from app.schemas.schemas import DocumentResponse
from app.services.documents.extractor import extractor
from app.services.rag.chroma import rag_service

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".json", ".csv"}

@router.get("", response_model=List[DocumentResponse])
def list_documents(persona_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Document)
    if persona_id:
        query = query.filter((Document.persona_id == persona_id) | (Document.persona_id.is_(None)))
    return query.order_by(Document.created_at.desc()).all()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    persona_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload and ingest a document into the local RAG pipeline."""
    profile = db.query(UserProfile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="User profile must be initialized first.")

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Save to disk safely
    unique_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    save_path = settings.DOCS_DIR / unique_filename

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(save_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file to local disk: {e}")

    # Extract text
    try:
        extracted_text = extractor.extract_text(str(save_path), file_ext)
    except Exception as e:
        if save_path.exists():
            os.remove(save_path)
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {e}")

    # Chunk text
    chunks = extractor.chunk_text(
        text=extracted_text,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )

    # Create document record
    doc = Document(
        user_id=profile.id,
        persona_id=persona_id,
        filename=file.filename,
        file_type=file_ext.replace(".", ""),
        file_size=file_size,
        storage_path=str(save_path),
        chunk_count=len(chunks),
        processing_status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Embed and index into ChromaDB
    try:
        if chunks:
            await rag_service.add_document_chunks(
                document_id=doc.id,
                user_id=profile.id,
                persona_id=persona_id,
                filename=doc.filename,
                file_type=doc.file_type,
                chunks=chunks
            )
        doc.processing_status = "processed"
        db.commit()
    except Exception as e:
        doc.processing_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Vector embedding failed: {e}")

    return doc

@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete ChromaDB vectors
    rag_service.delete_by_source_id(doc.id)

    # Delete local file if it exists
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"status": "ok", "message": "Document and all vector embeddings deleted"}
