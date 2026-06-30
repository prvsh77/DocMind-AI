from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import os
import uuid
import datetime
import logging

from app import config
from app.database.session import get_db
from app.models import Document, ExtractedData, DocumentStatus, User, SearchLog, ChatLog
from app.auth.dependencies import get_current_user
from app.schemas.document import (
    DocumentSummary,
    PaginatedResponse,
    DocumentDetailResponse
)
from app.ai.ocr import run_ocr
from app.ai.classifier import classify_document
from app.ai.extractor import extract_fields
from app.ai.embeddings import get_embedding
from app.ai.vector_store import add_to_vector_store, delete_from_vector_store
from app.ai.summarizer import generate_summary
import collections
from pydantic import BaseModel
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded"
        )
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type {ext}. Only PDF, PNG, and JPG are allowed."
        )
    
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read file size"
        )
        
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 20MB."
        )
        
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(config.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(8192):
                f.write(chunk)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    file_type = ext[1:].upper()
    if file_type == "JPEG":
        file_type = "JPG"
        
    new_doc = Document(
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=file_type,
        status=DocumentStatus.UPLOADED
    )
    
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    
    return {
        "id": str(new_doc.id),
        "name": new_doc.original_filename,
        "type": new_doc.file_type,
        "status": new_doc.status.value,
        "uploadedAt": new_doc.uploaded_at.strftime("%b %d, %Y %I:%M %p"),
        "document": {
            "id": str(new_doc.id)
        }
    }

@router.get("", response_model=PaginatedResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query total count
    count_stmt = select(func.count(Document.id)).where(Document.user_id == current_user.id)
    
    # Filter conditions
    filters = [Document.user_id == current_user.id]
    if search:
        filters.append(Document.original_filename.ilike(f"%{search}%"))
    if status:
        filters.append(Document.status == DocumentStatus(status.lower()))
    if type:
        filters.append(Document.file_type.ilike(f"%{type}%"))
        
    for cond in filters[1:]:
        count_stmt = count_stmt.where(cond)
        
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    # Query items
    items_stmt = select(Document).options(selectinload(Document.extracted_data)).where(Document.user_id == current_user.id)
    for cond in filters[1:]:
        items_stmt = items_stmt.where(cond)
        
    items_stmt = items_stmt.order_by(Document.uploaded_at.desc()).offset((page - 1) * pageSize).limit(pageSize)
    items_result = await db.execute(items_stmt)
    docs = items_result.scalars().all()
    
    items = []
    for doc in docs:
        vendor = "-"
        confidence = 100
        if doc.extracted_data and doc.extracted_data.json_data:
            fields = doc.extracted_data.json_data.get("fields", {})
            vendor = fields.get("vendor") or fields.get("bankName") or fields.get("name") or "-"
            
            conf_dict = doc.extracted_data.json_data.get("confidence", {})
            if conf_dict:
                confidence = int(sum(conf_dict.values()) / len(conf_dict))
                
        items.append(
            DocumentSummary(
                id=doc.id,
                name=doc.original_filename,
                type=doc.file_type,
                status=doc.status.value,
                uploadedAt=doc.uploaded_at.strftime("%b %d, %Y %I:%M %p"),
                vendor=vendor,
                confidence=confidence
            )
        )
        
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        pageSize=pageSize
    )

class DashboardCharts(BaseModel):
    uploadsPerMonth: List[Dict[str, Any]]
    documentTypeDistribution: List[Dict[str, Any]]
    processingSuccessRate: List[Dict[str, Any]]
    confidenceDistribution: List[Dict[str, Any]]

class RecentDoc(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    uploadedAt: str

class DashboardStatsResponse(BaseModel):
    totalDocuments: int
    documentsProcessed: int
    documentTypes: Dict[str, int]
    averageConfidence: int
    totalSearches: int
    totalAIChats: int
    recentUploads: List[RecentDoc]
    charts: DashboardCharts

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve summarized analytical data and chart metrics for the dashboard."""
    # Fetch all user documents
    stmt = select(Document).where(Document.user_id == current_user.id)
    res = await db.execute(stmt)
    user_docs = res.scalars().all()
    
    total_docs = len(user_docs)
    processed_docs = sum(1 for d in user_docs if d.status == DocumentStatus.COMPLETED)
    failed_docs = sum(1 for d in user_docs if d.status == DocumentStatus.FAILED)
    uploaded_docs = sum(1 for d in user_docs if d.status == DocumentStatus.UPLOADED)
    processing_docs = sum(1 for d in user_docs if d.status == DocumentStatus.PROCESSING)
    
    # Calculate average confidence score and gather distribution data
    confidence_scores = []
    for d in user_docs:
        if d.status == DocumentStatus.COMPLETED:
            ext_stmt = select(ExtractedData).where(ExtractedData.document_id == d.id)
            ext_res = await db.execute(ext_stmt)
            ext = ext_res.scalars().first()
            if ext and ext.json_data:
                conf_dict = ext.json_data.get("confidence", {})
                if conf_dict:
                    avg_c = sum(conf_dict.values()) / len(conf_dict)
                    confidence_scores.append(avg_c)
                    
    avg_confidence = int(sum(confidence_scores) / len(confidence_scores)) if confidence_scores else 100
    
    # Total searches and chats counts
    search_stmt = select(func.count(SearchLog.id)).where(SearchLog.user_id == current_user.id)
    search_res = await db.execute(search_stmt)
    total_searches = search_res.scalar() or 0
    
    chat_stmt = select(func.count(ChatLog.id)).where(ChatLog.user_id == current_user.id)
    chat_res = await db.execute(chat_stmt)
    total_chats = chat_res.scalar() or 0
    
    # Get top 5 recent uploads
    sorted_docs = sorted(user_docs, key=lambda x: x.uploaded_at, reverse=True)
    recent_uploads = [
        RecentDoc(
            id=d.id,
            name=d.original_filename,
            status=d.status.value,
            uploadedAt=d.uploaded_at.strftime("%b %d, %Y")
        ) for d in sorted_docs[:5]
    ]
    
    # Document Type Distribution
    type_counts = collections.Counter()
    for d in user_docs:
        # Standardize labels to fit chart
        type_label = d.file_type.title()
        type_counts[type_label] += 1
        
    document_types = dict(type_counts)
    document_type_distribution = [{"type": t, "value": count} for t, count in type_counts.items()]
    
    # Processing Success Rate
    processing_success_rate = [
        {"status": "Completed", "value": processed_docs},
        {"status": "Processing", "value": processing_docs},
        {"status": "Failed", "value": failed_docs},
        {"status": "Uploaded", "value": uploaded_docs}
    ]
    
    # Confidence Distribution
    ranges = {"< 70%": 0, "70-85%": 0, "85-95%": 0, "95-100%": 0}
    for score in confidence_scores:
        if score < 70:
            ranges["< 70%"] += 1
        elif score < 85:
            ranges["70-85%"] += 1
        elif score < 95:
            ranges["85-95%"] += 1
        else:
            ranges["95-100%"] += 1
    confidence_distribution = [{"range": r, "count": count} for r, count in ranges.items()]
    
    # Uploads per Month (chronological last 6 months rolling list)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    month_counts = collections.Counter()
    for d in user_docs:
        month_counts[d.uploaded_at.strftime("%b")] += 1
        
    today = datetime.date.today()
    uploads_per_month = []
    for i in range(5, -1, -1):
        m_idx = (today.month - i - 1) % 12 + 1
        m_name = months[m_idx - 1]
        uploads_per_month.append({
            "month": m_name,
            "count": month_counts[m_name]
        })
        
    return DashboardStatsResponse(
        totalDocuments=total_docs,
        documentsProcessed=processed_docs,
        documentTypes=document_types,
        averageConfidence=avg_confidence,
        totalSearches=total_searches,
        totalAIChats=total_chats,
        recentUploads=recent_uploads,
        charts=DashboardCharts(
            uploadsPerMonth=uploads_per_month,
            documentTypeDistribution=document_type_distribution,
            processingSuccessRate=processing_success_rate,
            confidenceDistribution=confidence_distribution
        )
    )

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    ext_stmt = select(ExtractedData).where(ExtractedData.document_id == doc.id)
    ext_result = await db.execute(ext_stmt)
    ext_data = ext_result.scalars().first()
    
    default_fields = {
        "invoiceNumber": "",
        "vendor": "",
        "vendorAddress": "",
        "customerName": "",
        "customerAddress": "",
        "invoiceDate": "",
        "dueDate": "",
        "subtotal": "",
        "tax": "",
        "total": "",
        "items": []
    }
    
    extracted_fields = default_fields
    confidence_score = 100
    
    if ext_data:
        json_data = ext_data.json_data
        extracted_fields = json_data.get("fields", {})
        conf_dict = json_data.get("confidence", {})
        if conf_dict:
            # Safely average the field-level confidence scores
            scores = [int(v) for v in conf_dict.values() if str(v).isdigit()]
            if scores:
                confidence_score = int(sum(scores) / len(scores))
                
    processed_at_str = ext_data.created_at.strftime("%b %d, %Y %I:%M %p") if ext_data else None
    
    return DocumentDetailResponse(
        id=doc.id,
        name=doc.original_filename,
        type=doc.file_type,
        status=doc.status.value,
        confidence=confidence_score,
        uploadedAt=doc.uploaded_at.strftime("%b %d, %Y %I:%M %p"),
        processedAt=processed_at_str,
        extractedFields=extracted_fields,
        confidenceScores=confidence_scores,
        summary=doc.summary
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    file_path = os.path.join(config.UPLOAD_DIR, doc.filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
            
    # Delete from vector store
    try:
        delete_from_vector_store(str(doc.id))
    except Exception as e:
        logger.error(f"Failed to delete document from vector store: {e}")

    await db.delete(doc)
    await db.commit()
    
    return {"status": "ok"}

@router.post("/{document_id}/process")
async def process_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    # Transition status: processing
    doc.status = DocumentStatus.PROCESSING
    await db.commit()
    
    file_path = os.path.join(config.UPLOAD_DIR, doc.filename)
    
    try:
        # Step 1: Run OCR text extraction
        ocr_text = run_ocr(file_path)
        doc.ocr_text = ocr_text
        
        # Step 2: Classify document type
        doc_type = await classify_document(ocr_text)
        doc.file_type = doc_type
        
        # Step 3: Extract structured fields & confidence scores
        fields, confidence = await extract_fields(ocr_text, doc_type)
        
        # Step 3.5: Generate brief document summary
        doc_summary = await generate_summary(ocr_text)
        doc.summary = doc_summary
        
        # Save to ExtractedData
        ext_stmt = select(ExtractedData).where(ExtractedData.document_id == doc.id)
        ext_result = await db.execute(ext_stmt)
        ext_data = ext_result.scalars().first()
        
        extracted_payload = {
            "fields": fields,
            "confidence": confidence
        }
        
        if ext_data:
            ext_data.json_data = extracted_payload
            ext_data.created_at = datetime.datetime.utcnow()
        else:
            ext_data = ExtractedData(
                document_id=doc.id,
                json_data=extracted_payload
            )
            db.add(ext_data)
            
        # Step 4: Index document in vector store for semantic search and RAG
        extracted_str = ""
        if fields:
            extracted_str = "\n".join([f"{k}: {v}" for k, v in fields.items() if v])
        text_to_embed = f"Document Type: {doc_type}\nExtracted Fields:\n{extracted_str}\n\nOCR Text:\n{ocr_text}"
        
        try:
            embedding_vector = await get_embedding(text_to_embed)
            add_to_vector_store(
                doc_id=str(doc.id),
                embedding=embedding_vector,
                text=text_to_embed,
                metadata={
                    "original_filename": doc.original_filename,
                    "doc_type": doc_type,
                    "user_id": str(current_user.id)
                }
            )
        except Exception as embed_err:
            logger.error(f"Failed to index document {doc.id} in vector store: {embed_err}")

        doc.status = DocumentStatus.COMPLETED
        await db.commit()
        await db.refresh(doc)
        
    except Exception as e:
        logger.error(f"Failed to process document {doc.id}: {str(e)}")
        doc.status = DocumentStatus.FAILED
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )
        
    return {
        "status": doc.status.value,
        "type": doc.file_type,
        "ocr_length": len(doc.ocr_text) if doc.ocr_text else 0
    }

@router.get("/{document_id}/ocr")
async def get_document_ocr(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    return {"ocr_text": doc.ocr_text or ""}

@router.get("/{document_id}/extracted")
async def get_document_extracted(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    ext_stmt = select(ExtractedData).where(ExtractedData.document_id == doc.id)
    ext_result = await db.execute(ext_stmt)
    ext_data = ext_result.scalars().first()
    
    if not ext_data:
        return {
            "extractedFields": {},
            "confidence": {}
        }
        
    json_data = ext_data.json_data
    return {
        "extractedFields": json_data.get("fields", {}),
        "confidence": json_data.get("confidence", {})
    }
