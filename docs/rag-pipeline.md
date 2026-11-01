# ECHO RAG Pipeline Documentation

## Pipeline Workflow

```
[Document: PDF/DOCX/TXT/MD]
            │
            ▼
[DocumentExtractor] ──> Clean text extraction
            │
            ▼
[Recursive Text Chunker] ──> Chunks (e.g., 500 chars, 50 overlap)
            │
            ▼
[Ollama Embeddings (/api/embed)] ──> all-minilm:latest
            │
            ▼
[ChromaDB Local Collection] ──> Upsert with metadata
                                (user_id, persona_id, filename, chunk_index)
```

## Retrieval Strategy

When a user submits a query:
1. **Query Embedding**: The query text is vectorized through Ollama's local embedding endpoint.
2. **Metadata Filtering**: The query filters against `user_id` and active `persona_id` (or shared `all`).
3. **Similarity Calculation**: ChromaDB calculates cosine distance; similarity is mapped via `max(0, 1 - dist/2)`.
4. **Context Injection**: Top results are assembled into the `RETRIEVED PERSONAL MEMORIES & DOCUMENTS` block in the system prompt.
5. **Source Citation**: Citation metadata is attached to the assistant response SSE stream, allowing users to inspect exact source snippets in the UI.
