import json
import os
from typing import Optional

import chromadb
from pypdf import PdfReader

from app.config import settings
from app.services.llm_service import llm_service


class RAGService:
    def __init__(self):
        os.makedirs(settings.chroma_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=settings.chroma_dir)
        self.collection = self.client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        self.embeddings = llm_service.get_embeddings()

    def ingest_all(self) -> dict:
        """Ingest all curriculum JSON files from data/curriculum/ into ChromaDB."""
        curriculum_dir = settings.curriculum_dir
        total_docs = 0
        errors = []

        for root, _dirs, files in os.walk(curriculum_dir):
            for filename in files:
                filepath = os.path.join(root, filename)

                if filename.endswith(".json"):
                    count = self._ingest_json(filepath)
                    total_docs += count
                elif filename.endswith(".pdf"):
                    count = self._ingest_pdf(filepath)
                    total_docs += count

        return {
            "status": "success",
            "documents_ingested": total_docs,
            "collection": settings.chroma_collection_name,
        }

    def _ingest_json(self, filepath: str) -> int:
        """Ingest a single JSON file with documents[] array."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        documents = data.get("documents", [])
        if not documents:
            return 0

        # Process in batches to avoid memory issues
        batch_size = 100
        count = 0
        seen_ids: set[str] = set()

        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]

            ids = []
            texts = []
            metadatas = []

            for doc in batch:
                doc_id = doc.get("id", f"doc_{count}")
                # Ensure unique IDs within this file
                base_id = doc_id
                suffix = 0
                while doc_id in seen_ids:
                    suffix += 1
                    doc_id = f"{base_id}-{suffix}"
                seen_ids.add(doc_id)

                content = doc.get("content", "")
                metadata = doc.get("metadata", {})

                if not content.strip():
                    continue

                # ChromaDB metadata must be str, int, float, or bool
                clean_metadata = {}
                for k, v in metadata.items():
                    if v is None:
                        clean_metadata[k] = ""
                    elif isinstance(v, (str, int, float, bool)):
                        clean_metadata[k] = v
                    else:
                        clean_metadata[k] = str(v)

                ids.append(doc_id)
                texts.append(content)
                metadatas.append(clean_metadata)

            if texts:
                embeddings = self.embeddings.embed_documents(texts)
                self.collection.add(
                    ids=ids,
                    documents=texts,
                    embeddings=embeddings,
                    metadatas=metadatas,
                )
                count += len(texts)

        return count

    def _ingest_pdf(self, filepath: str) -> int:
        """Ingest a PDF by extracting text, chunking, and embedding."""
        reader = PdfReader(filepath)
        filename = os.path.basename(filepath)
        count = 0

        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text or not text.strip():
                continue

            # Chunk by ~800 chars with 150 overlap
            chunks = self._chunk_text(text, chunk_size=800, overlap=150)
            for i, chunk in enumerate(chunks):
                doc_id = f"pdf-{filename}-p{page_num}-c{i}"
                metadata = {
                    "source": filename,
                    "content_type": "naplan_pdf",
                    "subject": "NAPLAN",
                    "year_level": "",
                    "page": page_num + 1,
                }

                embedding = self.embeddings.embed_documents([chunk])
                self.collection.add(
                    ids=[doc_id],
                    documents=[chunk],
                    embeddings=embedding,
                    metadatas=[metadata],
                )
                count += 1

        return count

    def _chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end - overlap
        return chunks

    def query(
        self,
        question: str,
        year_level: Optional[str] = None,
        subject: Optional[str] = None,
        n_results: int = 5,
    ) -> dict:
        """Query the curriculum RAG system."""
        # Build metadata filter
        where_filter = None
        conditions = []
        if year_level:
            conditions.append({"year_level": year_level})
        if subject:
            conditions.append({"subject": subject})

        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}

        # Embed query and search
        query_embedding = self.embeddings.embed_query(question)

        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            # Fallback without filter if metadata filter fails
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["documents", "metadatas", "distances"],
            )

        if not results or not results.get("ids") or not results["ids"][0]:
            return {
                "answer": "I couldn't find relevant curriculum information to answer your question.",
                "sources": [],
            }

        # Build context from retrieved chunks
        context_parts = []
        sources = []
        for i, doc_id in enumerate(results["ids"][0]):
            text = results["documents"][0][i]
            metadata = results["metadatas"][0][i]
            distance = results["distances"][0][i]

            subject_name = metadata.get("subject", "Unknown")
            year = metadata.get("year_level", "")
            strand = metadata.get("strand", "")

            label = f"{subject_name}"
            if year:
                label += f" - {year}"
            if strand:
                label += f" ({strand})"

            context_parts.append(f"[Source: {label}]\n{text}\n")
            sources.append({
                "id": doc_id,
                "subject": subject_name,
                "year_level": year,
                "strand": strand,
                "distance": distance,
            })

        context = "\n".join(context_parts)

        # Generate answer using LLM
        answer = llm_service.answer_question(question, context)

        return {
            "answer": answer,
            "sources": sources,
        }

    def get_stats(self) -> dict:
        """Get collection statistics."""
        count = self.collection.count()
        return {
            "collection": settings.chroma_collection_name,
            "document_count": count,
            "status": "active" if count > 0 else "empty",
        }


# Singleton
rag_service = RAGService()
