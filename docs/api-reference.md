# ECHO API Reference

Base URL: `http://localhost:8000/api`

## Endpoints

### System & Health
- `GET /health` - System health probe
- `GET /system/status` - Aggregated counts of stored entities and active Ollama config
- `GET /privacy/export` - Export complete local user database as JSON

### Profile & Onboarding
- `GET /profile` - Retrieve active user profile
- `PUT /profile` - Update profile fields
- `DELETE /profile` - Wipe profile and all associated vectors
- `POST /profile/onboarding` - Initialize user, primary Future Self persona, goals, and starter vector memories

### Personas (Future Selves)
- `GET /personas` - List all configured personas
- `POST /personas` - Create a new Future Self persona
- `GET /personas/{id}` - Get persona details
- `PUT /personas/{id}` - Update persona configuration
- `DELETE /personas/{id}` - Delete persona
- `POST /personas/{id}/activate` - Set persona as active

### Goals & Milestones
- `GET /goals` - List goals (optional `?persona_id=`)
- `POST /goals` - Create a new goal
- `GET /goals/{id}` - Get goal details
- `PUT /goals/{id}` - Update goal progress or fields
- `DELETE /goals/{id}` - Delete goal
- `POST /goals/{id}/milestones` - Add milestone
- `PUT /milestones/{id}` - Update milestone completion
- `DELETE /milestones/{id}` - Delete milestone

### Conversations & SSE Streaming
- `GET /conversations` - List conversations
- `POST /conversations` - Create a conversation
- `GET /conversations/{id}` - Get full conversation with messages
- `PUT /conversations/{id}` - Update title or mode
- `DELETE /conversations/{id}` - Delete conversation
- `POST /conversations/{id}/stream` - Server-Sent Events (SSE) chat stream with RAG retrieval

### Documents
- `GET /documents` - List uploaded documents
- `POST /documents/upload` - Multipart file upload (PDF, DOCX, TXT, MD)
- `DELETE /documents/{id}` - Delete document and ChromaDB vectors

### Memories
- `GET /memories` - List memories (optional `?category=`, `?persona_id=`)
- `POST /memories` - Create memory and index into ChromaDB
- `PUT /memories/{id}` - Update memory
- `DELETE /memories/{id}` - Delete memory and purge from ChromaDB

### Journal
- `GET /journal` - List daily reflections
- `POST /journal` - Create reflection and index into ChromaDB
- `PUT /journal/{id}` - Update journal entry
- `DELETE /journal/{id}` - Delete journal entry

### Ollama Control
- `GET /ollama/status` - Check daemon availability and local models
- `GET /ollama/models` - List local models
- `POST /ollama/test` - Run ping inference
- `PUT /ollama/config` - Update active models or host URL
