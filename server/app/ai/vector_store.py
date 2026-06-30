import os
import logging
import numpy as np
from typing import List, Dict, Any
from app import config

logger = logging.getLogger(__name__)

# Fallback store in memory if chromadb has issues
class InMemoryVectorStore:
    def __init__(self):
        self.records = [] # List of {"id": str, "embedding": list, "document": str, "metadata": dict}
        logger.info("Initialized memory-based fallback vector store.")

    def add(self, ids: List[str], embeddings: List[List[float]], documents: List[str], metadatas: List[Dict[str, Any]]):
        for i, idx in enumerate(ids):
            # Remove duplicate if exists
            self.records = [r for r in self.records if r["id"] != idx]
            self.records.append({
                "id": idx,
                "embedding": embeddings[i],
                "document": documents[i],
                "metadata": metadatas[i]
            })
        logger.info(f"Added {len(ids)} document(s) to in-memory vector store.")

    def query(self, query_embeddings: List[List[float]], n_results: int, where: Dict[str, Any]) -> Dict[str, List[List[Any]]]:
        user_id = where.get("user_id")
        # Filter by user_id
        filtered = [r for r in self.records if r["metadata"].get("user_id") == user_id]
        
        q_emb = np.array(query_embeddings[0])
        q_norm = np.linalg.norm(q_emb)
        
        scores = []
        for r in filtered:
            r_emb = np.array(r["embedding"])
            r_norm = np.linalg.norm(r_emb)
            if q_norm > 0 and r_norm > 0:
                similarity = np.dot(q_emb, r_emb) / (q_norm * r_norm)
            else:
                similarity = 0.0
            scores.append((r, float(similarity)))
            
        # Sort by similarity descending
        scores.sort(key=lambda x: x[1], reverse=True)
        top = scores[:n_results]
        
        # Return format matching ChromaDB query dictionary output
        return {
            "ids": [[t[0]["id"] for t in top]],
            "distances": [[1.0 - t[1] for t in top]], # distance = 1 - similarity
            "documents": [[t[0]["document"] for t in top]],
            "metadatas": [[t[0]["metadata"] for t in top]]
        }

    def delete(self, ids: List[str]):
        self.records = [r for r in self.records if r["id"] not in ids]
        logger.info(f"Deleted documents {ids} from in-memory vector store.")


# Load ChromaDB Persistent Client
CHROMA_AVAILABLE = False
collection = None

try:
    import chromadb
    persist_dir = os.path.join(config.BASE_DIR, "chroma_db")
    os.makedirs(persist_dir, exist_ok=True)
    
    chroma_client = chromadb.PersistentClient(path=persist_dir)
    collection = chroma_client.get_or_create_collection(name="docmind_collection")
    CHROMA_AVAILABLE = True
    logger.info(f"ChromaDB initialized at: {persist_dir}")
except Exception as e:
    logger.warning(f"ChromaDB not available: {e}. Initializing in-memory fallback.")
    collection = InMemoryVectorStore()

# Global wrappers
def add_to_vector_store(doc_id: str, embedding: List[float], text: str, metadata: Dict[str, Any]):
    global collection, CHROMA_AVAILABLE
    if CHROMA_AVAILABLE:
        try:
            if hasattr(collection, "upsert"):
                collection.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[metadata]
                )
            else:
                collection.delete(ids=[doc_id])
                collection.add(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[metadata]
                )
        except Exception as e:
            logger.error(f"Failed to save in ChromaDB: {e}. Saving in fallback.")
            CHROMA_AVAILABLE = False
            fallback_store = InMemoryVectorStore()
            fallback_store.add([doc_id], [embedding], [text], [metadata])
            collection = fallback_store
    else:
        collection.add([doc_id], [embedding], [text], [metadata])

def query_vector_store(query_embedding: List[float], limit: int, user_id: str) -> Dict[str, List[List[Any]]]:
    if CHROMA_AVAILABLE and hasattr(collection, "query"):
        try:
            return collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where={"user_id": user_id}
            )
        except Exception as e:
            logger.error(f"Failed to query ChromaDB: {e}")
            return {"ids": [[]], "distances": [[]], "documents": [[]], "metadatas": [[]]}
    else:
        return collection.query([query_embedding], limit, {"user_id": user_id})

def delete_from_vector_store(doc_id: str):
    if CHROMA_AVAILABLE and hasattr(collection, "delete"):
        try:
            collection.delete(ids=[doc_id])
        except Exception as e:
            logger.error(f"Failed to delete from ChromaDB: {e}")
    else:
        collection.delete([doc_id])
