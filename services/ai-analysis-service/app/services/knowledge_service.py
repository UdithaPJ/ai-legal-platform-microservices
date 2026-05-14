import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import KnowledgeChunk
from app.services.chunking_service import chunk_text
from app.services.document_parser import extract_text
from app.services.embedding_service import embed


async def ingest(file_path: str, source: str, db: AsyncSession) -> int:
    text = extract_text(file_path)
    chunks = chunk_text(text)

    for chunk in chunks:
        vector = embed(chunk)
        db.add(KnowledgeChunk(
            id=uuid.uuid4(),
            source=source,
            content=chunk,
            embedding=vector,
        ))

    await db.commit()
    return len(chunks)
