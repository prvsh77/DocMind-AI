from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid

from app.database.session import get_db
from app.models import Document, ExtractedData, User, SearchLog
from app.auth.dependencies import get_current_user
from app.ai.retriever import retrieve_documents

router = APIRouter()

class SearchRequest(BaseModel):
    query: str

class SearchResultResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    vendor: str
    amount: str
    date: str
    excerpt: str
    confidence: int
    summary: Optional[str] = None

@router.get("", response_model=List[SearchResultResponse])
async def search_documents_get(
    q: str = Query(..., description="Natural language search query"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Semantic search endpoint (GET method, used by the existing frontend searchService)."""
    return await execute_search(q, db, current_user.id)

@router.post("", response_model=List[SearchResultResponse])
async def search_documents_post(
    payload: SearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Semantic search endpoint (POST method, matching prompt specification)."""
    return await execute_search(payload.query, db, current_user.id)

async def execute_search(query: str, db: AsyncSession, user_id: uuid.UUID) -> List[Dict[str, Any]]:
    # Log query to SearchLogs table
    try:
        log = SearchLog(user_id=user_id, query=query)
        db.add(log)
        await db.commit()
    except Exception as e:
        # Don't crash search if logging fails
        pass

    # Retrieve top 5 semantic matches
    retrieved = await retrieve_documents(query, limit=5, user_id=str(user_id))
    
    results = []
    for match in retrieved:
        doc_id = uuid.UUID(match["document_id"])
        
        # Load document from db to get correct original_filename and type
        stmt = select(Document).where(Document.id == doc_id)
        res = await db.execute(stmt)
        doc = res.scalars().first()
        if not doc:
            continue
            
        # Load extracted fields if available to show vendor and amount
        ext_stmt = select(ExtractedData).where(ExtractedData.document_id == doc.id)
        ext_res = await db.execute(ext_stmt)
        ext_data = ext_res.scalars().first()
        
        vendor = "-"
        amount = "-"
        
        if ext_data and ext_data.json_data:
            fields = ext_data.json_data.get("fields", {})
            vendor = fields.get("vendor") or fields.get("bankName") or fields.get("name") or "-"
            
            # Map total or closing balance to amount
            amount_val = fields.get("totalAmount") or fields.get("total") or fields.get("closingBalance") or fields.get("amount") or "-"
            if amount_val != "-":
                amount = str(amount_val)
                
        # Synthesize a preview excerpt from OCR text
        excerpt = "Match found in document."
        if doc.ocr_text:
            text = doc.ocr_text.strip()
            # Try to grab a snippet containing query keywords
            query_words = [w.lower() for w in query.split() if len(w) > 3]
            found = False
            for word in query_words:
                idx = text.lower().find(word)
                if idx != -1:
                    start = max(0, idx - 40)
                    end = min(len(text), idx + 80)
                    excerpt = f"...{text[start:end].replace('\n', ' ')}..."
                    found = True
                    break
            if not found:
                excerpt = text[:120].replace('\n', ' ') + "..."
                
        results.append({
            "id": doc.id,
            "name": doc.original_filename,
            "type": doc.file_type,
            "vendor": vendor,
            "amount": amount,
            "date": doc.uploaded_at.strftime("%b %d, %Y"),
            "excerpt": excerpt,
            "confidence": int(match["score"] * 100),
            "summary": doc.summary
        })
        
    return results
