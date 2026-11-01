# ECHO Architecture & Design Specification

## Overview
ECHO is a local-first conversational simulation platform connecting users with a technological realization of their Future Self. The application runs entirely on the user's local machine, providing air-gapped security, zero external telemetry, and offline inference.

```
                          ┌────────────────────────┐
                          │   React 18 Frontend    │
                          │   (Vite + TypeScript)  │
                          └───────────┬────────────┘
                                      │ REST & SSE
                                      ▼
                          ┌────────────────────────┐
                          │    FastAPI Backend     │
                          │      (Python 3)        │
                          └─────┬────────────┬─────┘
                                │            │
           ┌────────────────────┴───┐    ┌───┴────────────────────┐
           ▼                        ▼    ▼                        ▼
┌─────────────────────┐  ┌─────────────┐┌───────────────────────────┐
│ SQLite Database     │  │  ChromaDB   ││ Local Ollama Service      │
│ (Users, Goals,      │  │ (Embeddings ││ - Chat: gemma4:latest     │
│  Personas, History) │  │  & Metadata)││ - Embed: all-minilm:latest│
└─────────────────────┘  └─────────────┘└───────────────────────────┘
```

## System Subsystems

### 1. Future Self Persona Engine
- **Dynamic Context Injection**: Combines current circumstances, long-term ambitions, active milestones, conversation mode, and retrieved vector memories.
- **First-Person Perspective**: Strict system prompt constraints enforce communication in the first person ("I", "we", "our journey").
- **Truth Anchoring**: Explicit instructions prevent hallucinating unachieved events or fabricating unearned accomplishments.

### 2. Conversational Memory Subsystem
- **Short-Term Memory**: Chronological sliding window of recent conversation turns maintained per session.
- **Long-Term Memory**: Extracted breakthroughs, realizations, and stated obstacles stored in SQLite and indexed in ChromaDB.
- **Bi-directional Sync**: Memory deletions or updates immediately synchronize across SQLite and ChromaDB.

### 3. RAG Orchestration Engine
- Ingests PDF, DOCX, TXT, and Markdown files.
- Splits text into recursive semantic chunks with overlap.
- Employs local Ollama embedding models (`all-minilm:latest`) for vector generation.
- Queries ChromaDB using HNSW cosine distance with metadata filtering.
