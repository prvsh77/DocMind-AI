import logging
import os
import numpy as np
from typing import List

logger = logging.getLogger(__name__)

# Try to load SentenceTransformer locally
TRANSFORMERS_AVAILABLE = False
model = None

try:
    from sentence_transformers import SentenceTransformer
    # BAAI/bge-small-en-v1.5 outputs 384-dimensional dense vectors
    model = SentenceTransformer('BAAI/bge-small-en-v1.5')
    TRANSFORMERS_AVAILABLE = True
    logger.info("SentenceTransformer model 'BAAI/bge-small-en-v1.5' loaded successfully.")
except Exception as e:
    logger.warning(f"SentenceTransformer not available locally: {e}. Fallback embedding options will be used.")

async def get_embedding(text: str) -> List[float]:
    """Generates a 384-dimensional embedding vector for the input text."""
    if not text or not text.strip():
        # Return all zeros vector
        return [0.0] * 384
        
    # 1. Local BGE Model
    if TRANSFORMERS_AVAILABLE and model is not None:
        try:
            # We normalize embeddings to easily calculate cosine similarity via dot product
            embedding = model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Local SentenceTransformer embedding failed: {e}")
            
    # 2. Gemini Embedding API
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            # text-embedding-004 yields 768 dimensions. We can truncate or project it, but to keep 
            # vectors uniform, we project/truncate it to 384 dimensions. Truncation works well.
            emb = result['embedding']
            if len(emb) > 384:
                emb = emb[:384]
            # Normalize
            arr = np.array(emb)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            return arr.tolist()
        except Exception as e:
            logger.error(f"Gemini embedding API failed: {e}")
            
    # 3. OpenAI Embedding API
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=openai_key)
            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            emb = response.data[0].embedding
            # text-embedding-3-small has 1536 dimensions. Truncate it to 384 and normalize.
            if len(emb) > 384:
                emb = emb[:384]
            arr = np.array(emb)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            return arr.tolist()
        except Exception as e:
            logger.error(f"OpenAI embedding API failed: {e}")
            
    # 4. Pure Python Math Fallback (Deterministic mapping)
    logger.warning("All primary embedding channels failed. Using deterministic math fallback.")
    import random
    # Seed with the hash of the text so that identical texts receive identical vectors!
    h = hash(text)
    random.seed(h)
    vec = [random.uniform(-1, 1) for _ in range(384)]
    arr = np.array(vec)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()
