import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.services.ollama.client import ollama_service

logger = logging.getLogger(__name__)

class ChromaRAGService:
    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection_name = "echo_personal_knowledge"
        self._collection = None

    def get_collection(self):
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collection

    async def add_document_chunks(
        self,
        document_id: str,
        user_id: str,
        persona_id: Optional[str],
        filename: str,
        file_type: str,
        chunks: List[str]
    ) -> int:
        """Embed and store document chunks in ChromaDB."""
        if not chunks:
            return 0

        coll = self.get_collection()
        ids = []
        embeddings = []
        metadatas = []
        documents = []

        for idx, chunk in enumerate(chunks):
            chunk_id = f"doc_{document_id}_chunk_{idx}"
            ids.append(chunk_id)
            documents.append(chunk)
            
            # Generate local Ollama embedding
            emb = await ollama_service.generate_embedding(chunk)
            embeddings.append(emb)

            metadata = {
                "source_type": "document",
                "source_id": document_id,
                "document_id": document_id,
                "user_id": user_id,
                "persona_id": persona_id or "all",
                "filename": filename,
                "file_type": file_type,
                "chunk_index": idx
            }
            metadatas.append(metadata)

        coll.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        return len(chunks)

    async def add_or_update_memory(
        self,
        memory_id: str,
        user_id: str,
        persona_id: Optional[str],
        category: str,
        content: str,
        importance: int = 3
    ):
        """Embed and store a personal memory in ChromaDB."""
        coll = self.get_collection()
        mem_id = f"mem_{memory_id}"
        emb = await ollama_service.generate_embedding(content)

        metadata = {
            "source_type": "memory",
            "source_id": memory_id,
            "memory_id": memory_id,
            "user_id": user_id,
            "persona_id": persona_id or "all",
            "category": category,
            "importance": importance
        }

        coll.upsert(
            ids=[mem_id],
            embeddings=[emb],
            metadatas=[metadata],
            documents=[content]
        )

    async def add_or_update_journal(
        self,
        journal_id: str,
        user_id: str,
        persona_id: Optional[str],
        title: str,
        content: str
    ):
        """Embed and store a journal reflection."""
        coll = self.get_collection()
        j_id = f"journal_{journal_id}"
        full_text = f"Journal Entry: {title}\n{content}"
        emb = await ollama_service.generate_embedding(full_text)

        metadata = {
            "source_type": "journal",
            "source_id": journal_id,
            "user_id": user_id,
            "persona_id": persona_id or "all",
            "title": title
        }

        coll.upsert(
            ids=[j_id],
            embeddings=[emb],
            metadatas=[metadata],
            documents=[full_text]
        )

    def delete_by_source_id(self, source_id: str):
        """Remove all vectors associated with a document, memory, or journal entry."""
        try:
            coll = self.get_collection()
            # Find matching items
            results = coll.get(where={"source_id": source_id})
            if results and results.get("ids"):
                coll.delete(ids=results["ids"])
                logger.info(f"Deleted {len(results['ids'])} vectors for source_id {source_id}")
        except Exception as e:
            logger.error(f"Error deleting vectors for {source_id}: {e}")

    def delete_by_user_id(self, user_id: str):
        """Wipe all vector knowledge for a user (local privacy guarantee)."""
        try:
            coll = self.get_collection()
            results = coll.get(where={"user_id": user_id})
            if results and results.get("ids"):
                coll.delete(ids=results["ids"])
        except Exception as e:
            logger.error(f"Error wiping vectors for user {user_id}: {e}")

    async def search(
        self,
        query: str,
        user_id: str,
        persona_id: Optional[str] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Retrieve semantically relevant knowledge for a user query."""
        try:
            coll = self.get_collection()
            count = coll.count()
            if count == 0:
                return []

            query_embedding = await ollama_service.generate_embedding(query)
            
            # Query ChromaDB with user_id filter
            where_filter = {"user_id": user_id}
            
            results = coll.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, count),
                where=where_filter
            )

            retrieved = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

                for doc, meta, dist in zip(docs, metas, distances):
                    # Chroma cosine distance ranges from 0 (identical) to 2 (opposite)
                    # Similarity: 1 - (dist / 2)
                    similarity = max(0.0, 1.0 - (dist / 2.0))
                    
                    # Also filter by persona_id if specific, allowing 'all'
                    item_persona = meta.get("persona_id", "all")
                    if persona_id and item_persona not in ["all", persona_id]:
                        continue

                    retrieved.append({
                        "content": doc,
                        "metadata": meta,
                        "similarity": round(similarity, 4),
                        "source_type": meta.get("source_type", "unknown"),
                        "source_id": meta.get("source_id"),
                        "filename": meta.get("filename"),
                        "title": meta.get("title") or meta.get("filename") or meta.get("category", "Memory")
                    })

            return retrieved
        except Exception as e:
            logger.error(f"Error searching ChromaDB: {e}")
            return []

rag_service = ChromaRAGService()
