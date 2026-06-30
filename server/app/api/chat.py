from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Dict, Any

from app.database.session import get_db
from app.models import User, ChatLog
from app.auth.dependencies import get_current_user
from app.ai.rag import generate_rag_answer

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    extractedFields: Dict[str, Any]

@router.post("", response_model=ChatResponse)
async def chat_with_documents(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """POST /chat endpoint executing semantic retrieval + LLM synthesized answering."""
    result = await generate_rag_answer(payload.question, user_id=str(current_user.id))
    
    # Log the chat conversation to chat_logs
    try:
        log = ChatLog(
            user_id=current_user.id,
            question=payload.question,
            answer=result["answer"]
        )
        db.add(log)
        await db.commit()
    except Exception as e:
        # Don't crash RAG if logging fails
        pass

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        extractedFields=result["extractedFields"]
    )
