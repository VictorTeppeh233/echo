import pytest
from app.services.documents.extractor import extractor
from app.services.persona.engine import persona_engine

def test_chunking():
    sample_text = "This is sentence one. This is sentence two. This is sentence three. " * 30
    chunks = extractor.chunk_text(sample_text, chunk_size=200, chunk_overlap=30)
    assert len(chunks) > 1
    assert all(len(c) <= 300 for c in chunks)

def test_persona_prompt_generation():
    prompt = persona_engine.construct_system_prompt(
        user_name="Devin",
        current_situation="Learning ML fundamentals and linear algebra",
        personal_description="Aiming to become an AI researcher at OpenAI or Anthropic",
        values="Consistency, Curiosity, Rigor",
        persona_name="The Frontier AI Researcher",
        personality="Disciplined and direct, Calm and reflective",
        system_configuration=None,
        goals=[
            {
                "title": "Master Linear Algebra & PyTorch",
                "category": "Education",
                "progress": 35,
                "status": "active",
                "challenges": "Hard to stay consistent with math drills",
                "why_matters": "Fundamental to understanding deep learning papers"
            }
        ],
        retrieved_context=[
            {
                "title": "Roadmap Note",
                "source_type": "memory",
                "similarity": 0.88,
                "content": "Spent 2 hours studying matrix decompositions and singular value decomposition."
            }
        ],
        conversation_mode="Strategic Guidance"
    )

    assert "Devin" in prompt
    assert "FIRST PERSON" in prompt
    assert "The Frontier AI Researcher" in prompt
    assert "Master Linear Algebra & PyTorch" in prompt
    assert "matrix decompositions" in prompt
    assert "Strategic Guidance" in prompt

def test_document_plain_text_extraction(tmp_path):
    test_file = tmp_path / "notes.md"
    test_file.write_text("# Machine Learning Study Notes\nLinear algebra is key.", encoding="utf-8")
    extracted = extractor.extract_text(str(test_file), "md")
    assert "Machine Learning Study Notes" in extracted
    assert "Linear algebra is key." in extracted
