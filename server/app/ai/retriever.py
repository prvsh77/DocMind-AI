import logging
from typing import List, Dict, Any
from app.ai.embeddings import get_embedding
from app.ai.vector_store import query_vector_store

logger = logging.getLogger(__name__)

async def retrieve_documents(query: str, limit: int, user_id: str) -> List[Dict[str, Any]]:
    """Retrieves semantically similar documents from the vector store for the query."""
    if not query or not query.strip():
        return []
        
    try:
        # Step 1: Generate embedding for the query
        query_emb = await get_embedding(query)
        
        # Step 2: Query the vector store
        results = query_vector_store(query_emb, limit, user_id)
        
        # Parse query output
        ids = results.get("ids", [[]])[0]
        distances = results.get("distances", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        
        retrieved = []
        for i in range(len(ids)):
            dist = distances[i]
            # Convert distance back to similarity score
            score = 1.0 - dist
            # Bound similarity score between 0.0 and 1.0
            score = max(0.0, min(1.0, score))
            
            retrieved.append({
                "document_id": ids[i],
                "score": score,
                "text": documents[i],
                "metadata": metadatas[i]
            })
            
        logger.info(f"Retrieved {len(retrieved)} matches for query '{query}' from vector store.")
        return retrieved
    except Exception as e:
        logger.error(f"Failed retrieving documents for query '{query}': {e}")
        return []
