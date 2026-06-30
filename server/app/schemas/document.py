from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid

class DocumentSummary(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    status: str
    uploadedAt: str
    vendor: Optional[str] = "-"
    confidence: Optional[int] = 100

class PaginatedResponse(BaseModel):
    items: List[DocumentSummary]
    total: int
    page: int
    pageSize: int

class DocumentDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    status: str
    confidence: int = 100
    uploadedAt: str
    processedAt: Optional[str] = None
    extractedFields: Optional[Dict[str, Any]] = None
    confidenceScores: Optional[Dict[str, int]] = None
    summary: Optional[str] = None
