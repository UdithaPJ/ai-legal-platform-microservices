import os
import uuid
from typing import Annotated

import aiofiles
from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.document import KnowledgeChunk
from app.services.csv_parser import ingest_cuad_csv
from app.services.knowledge_service import ingest

router = APIRouter(prefix="/analysis/knowledge", tags=["knowledge"])


@router.post("/ingest")
async def ingest_knowledge(
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    tmp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(await file.read())

    try:
        count = await ingest(tmp_path, file.filename, db)
    finally:
        os.unlink(tmp_path)

    return {"source": file.filename, "chunks_ingested": count}


@router.post("/ingest-csv")
async def ingest_csv_knowledge(
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    tmp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(await file.read())

    try:
        count = await ingest_cuad_csv(tmp_path, file.filename, db)
    finally:
        os.unlink(tmp_path)

    return {"source": file.filename, "chunks_ingested": count}


@router.get("/stats")
async def knowledge_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(KnowledgeChunk.source, func.count(KnowledgeChunk.id)).group_by(KnowledgeChunk.source)
    )
    rows = result.fetchall()
    return {
        "total_chunks": sum(r[1] for r in rows),
        "sources": [{"source": r[0], "chunks": r[1]} for r in rows],
    }
