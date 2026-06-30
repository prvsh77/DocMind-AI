import logging
import os
from typing import List

import numpy as np

logger = logging.getLogger(__name__)

TRANSFORMERS_AVAILABLE = False
model = None


def get_local_model():
    """
    Lazy-load the SentenceTransformer model only when needed.
    This prevents Render from loading hundreds of MB during startup.
    """
    global model, TRANSFORMERS_AVAILABLE

    if model is not None:
        return model

    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading local embedding model...")
        model = SentenceTransformer("BAAI/bge-small-en-v1.5")
        TRANSFORMERS_AVAILABLE = True
        logger.info("Embedding model loaded successfully.")

        return model

    except Exception as e:
        logger.warning(f"Unable to load SentenceTransformer: {e}")
        TRANSFORMERS_AVAILABLE = False
        return None


async def get_embedding(text: str) -> List[float]:
    if not text or not text.strip():
        return [0.0] * 384

    # --------------------------
    # Local SentenceTransformer
    # --------------------------
    local_model = get_local_model()

    if local_model:
        try:
            embedding = local_model.encode(
                text,
                normalize_embeddings=True,
            )
            return embedding.tolist()

        except Exception as e:
            logger.error(f"Local embedding failed: {e}")

    # --------------------------
    # Gemini
    # --------------------------
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=gemini_key)

            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",
            )

            emb = result["embedding"][:384]

            arr = np.array(emb)
            arr /= np.linalg.norm(arr)

            return arr.tolist()

        except Exception as e:
            logger.error(f"Gemini embedding failed: {e}")

    # --------------------------
    # OpenAI
    # --------------------------
    openai_key = os.getenv("OPENAI_API_KEY")

    if openai_key:
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=openai_key)

            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )

            emb = response.data[0].embedding[:384]

            arr = np.array(emb)
            arr /= np.linalg.norm(arr)

            return arr.tolist()

        except Exception as e:
            logger.error(f"OpenAI embedding failed: {e}")

    # --------------------------
    # Fallback
    # --------------------------
    import random

    random.seed(hash(text))

    arr = np.array(
        [random.uniform(-1, 1) for _ in range(384)]
    )

    arr /= np.linalg.norm(arr)

    return arr.tolist()