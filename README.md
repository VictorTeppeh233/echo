# ECHO
### *Your future self is waiting.*

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20Inference-black.svg?logo=ollama)](https://ollama.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange.svg)](https://www.trychroma.com)

---

## 1. Problem Statement & Product Vision
Most conversational AI companions act as generic corporate assistants or detached third-party advisors. They lack personal context, start every conversation from scratch, and demand that your sensitive thoughts, struggles, and aspirations be uploaded to centralized cloud servers.

**ECHO** is fundamentally different. It is a **local-first, open-source AI platform** that allows you to converse with an imagined, accomplished future version of yourself who has already navigated the exact struggles you face today. 

By leveraging **local Ollama inference**, **persistent SQLite state**, **ChromaDB vector retrieval**, and a **dynamic Persona Engine**, ECHO synthesizes your roadmap, past journal reflections, and milestones into an emotionally engaging, intellectually rigorous dialogue.

> *"We didn't become better by suddenly becoming intelligent. We became better by consistently working through what we didn't understand. Tell me, what are we struggling with today?"*

---

## 2. Core Features
- **Cinematic Sci-Fi Terminal**: Dark sci-fi aesthetic with glowing status markers, waveform transmission animators, and responsive panels.
- **Dynamic Future Self Persona Engine**: System prompts constructed on the fly from your current circumstances, long-term ambitions, values, active goals, and conversation modes.
- **Local RAG Memory Vault**: Ingest study roadmaps, documents (PDF, DOCX, TXT, MD), and daily reflections into a local ChromaDB collection using local `all-minilm` embeddings.
- **Bi-Level Conversational Memory**:
  - *Short-Term*: Sliding context window preserving immediate session flow.
  - *Long-Term*: Insight extraction capturing commitments, obstacles, and milestones.
- **Four Interaction Modes**:
  - `Reflection`: Introspection and deeper purpose.
  - `Strategic Guidance`: Practical execution roadmaps and frameworks.
  - `Accountability`: Strict adherence to habits, questioning excuses.
  - `Decision-Making`: Trade-off analysis weighing short-term pain against compounding long-term gains.
- **Inspectable Source Citations**: Every retrieved document or memory attached to an AI response can be clicked to view its exact snippet.
- **Multiple Future Selves**: Create and switch between distinct personas (e.g. *The Frontier AI Researcher*, *The Founder*, *The Athlete*).
- **100% Local-First & Air-Gapped**: Zero cloud APIs. No telemetry. Your data stays on your machine.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic, SQLAlchemy 2.0 |
| **Local Vector DB** | ChromaDB (Local persistent client) |
| **Relational DB** | SQLite3 |
| **Local LLM Engine** | Ollama (`gemma4:latest`, `all-minilm:latest`) |
| **Document Processing**| PyMuPDF, python-docx, native Python text parsing |
| **Testing** | Pytest, pytest-asyncio |

---

## 4. System Architecture

```
USER
 │
 ▼
REACT FRONTEND (Vite, TypeScript, Tailwind)
 │
 │  HTTP REST / SSE Stream
 ▼
FASTAPI BACKEND
 ├── Future Self Persona Engine (Dynamic prompt synthesis)
 ├── Memory Management (Short-term window + Long-term extraction)
 ├── Document Ingestion & Chunking (PDF, DOCX, TXT, MD)
 ├── Local ChromaDB Interface (Cosine vector similarity)
 └── Centralized Ollama Service (Inference & Embeddings)
 │
 ├── SQLite Database (echo.db: Users, Personas, Goals, Chats, Journal)
 ├── ChromaDB Storage (HNSW cosine index on local disk)
 └── Local Ollama Daemon (http://localhost:11434)
```

---

## 5. Prerequisites & Local Installation

### Operating System Setup

#### Ubuntu / Debian
```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm curl
curl -fsSL https://ollama.com/install.sh | sh
```

#### Fedora / RHEL
```bash
sudo dnf install -y python3 python3-pip nodejs npm curl
curl -fsSL https://ollama.com/install.sh | sh
```

---

### Step 1: Start Ollama & Pull Local Models
Ensure Ollama is running:
```bash
ollama serve
```

In a separate terminal, pull the recommended models:
```bash
# Pull conversational reasoning model (e.g., Gemma 4)
ollama pull gemma4:latest

# Pull high-speed embedding model
ollama pull all-minilm:latest
```

---

### Step 2: Configure & Run Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the FastAPI server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000` (interactive API documentation available at `http://localhost:8000/docs`).

---

### Step 3: Run Frontend

In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 6. Testing

Run the automated backend test suite:
```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/
```

Run the frontend TypeScript & build verification:
```bash
cd frontend
npm run build
```

---

## 7. How RAG Works in ECHO
1. **Ingestion**: Documents uploaded through the *Document Vault* are cleaned, extracted via PyMuPDF or python-docx, and segmented into recursive chunks with 50-character overlap.
2. **Local Vectorization**: Chunks are embedded using `all-minilm:latest` directly via Ollama's local embedding endpoint.
3. **Retrieval**: When a message is sent, query embeddings are compared against ChromaDB collections filtered by `user_id` and active `persona_id`.
4. **Context Injection & Citation**: Relevant passages are injected into the prompt, and citation pills are returned in the SSE metadata event for user inspection.

---

## 8. Privacy Architecture
ECHO does not include analytics, tracking pixels, or cloud fallback services. 
- All SQLite database files reside in `data/database/echo.db`.
- All ChromaDB vector files reside in `data/chroma/`.
- All document storage resides in `data/documents/`.
- Users can export their complete data to JSON or wipe all local data at any time from the **Settings & Privacy** tab.

---

## 9. License
Distributed under the **Apache 2.0 License**. See [LICENSE](LICENSE) and [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.
