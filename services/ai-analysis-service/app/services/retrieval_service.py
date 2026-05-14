from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.document import KnowledgeChunk
from app.services.embedding_service import embed


async def retrieve(query: str, db: AsyncSession) -> list[str]:
    query_vector = embed(query)
    result = await db.execute(
        select(KnowledgeChunk.content)
        .order_by(KnowledgeChunk.embedding.cosine_distance(query_vector))
        .limit(settings.retrieval_top_k)
    )
    return [row[0] for row in result.fetchall()]
