import logging
import os
import uuid
from typing import Annotated

import aiofiles
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.document import Analysis, Document
from app.schemas.document import DocumentStatusResponse, DocumentUploadResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis/documents", tags=["documents"])

ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


async def _save_file(file: UploadFile, dest: str) -> None:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    async with aiofiles.open(dest, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            await f.write(chunk)


async def _run_analysis(document_id: uuid.UUID) -> None:
    from app.database import AsyncSessionLocal
    from app.services.document_parser import extract_text
    from app.services.ai_service import analyse

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            return

        try:
            doc.status = "processing"
            await db.commit()

            text = extract_text(doc.file_path)
            analysis_result = await analyse(text, db)

            db.add(Analysis(
                id=uuid.uuid4(),
                document_id=doc.id,
                summary=analysis_result.get("summary"),
                risky_clauses=analysis_result.get("risky_clauses"),
                simplified_explanation=analysis_result.get("simplified_explanation"),
            ))
            doc.status = "completed"
            await db.commit()

        except Exception as exc:
            logger.exception("Analysis failed for document %s: %s", document_id, exc)
            doc.status = "failed"
            await db.commit()


@router.post("", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    x_user_id: Annotated[str | None, Header()] = None,
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Only PDF and DOCX files are supported")

    doc_id = uuid.uuid4()
    dest = os.path.join(settings.upload_dir, str(doc_id), file.filename)
    await _save_file(file, dest)

    doc = Document(
        id=doc_id,
        user_id=x_user_id or "anonymous",
        filename=file.filename,
        file_path=dest,
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    background_tasks.add_task(_run_analysis, doc.id)

    return doc


@router.get("/{document_id}", response_model=DocumentStatusResponse)
async def get_document(
    document_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.analysis))
        .where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("", response_model=list[DocumentStatusResponse])
async def list_documents(
    db: Annotated[AsyncSession, Depends(get_db)],
    x_user_id: Annotated[str | None, Header()] = None,
):
    query = select(Document).options(selectinload(Document.analysis))
    if x_user_id:
        query = query.where(Document.user_id == x_user_id)
    result = await db.execute(query)
    return result.scalars().all()
