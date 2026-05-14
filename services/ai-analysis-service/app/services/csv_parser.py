import csv
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import KnowledgeChunk
from app.services.embedding_service import embed

_SKIP_VALUES = {"", "-", "n/a", "none"}


def _format_chunk(row: dict) -> str | None:
    category = row.get("Category (incl. context and answer)", "").strip()
    description = row.get("Description", "").strip()
    answer_fmt = row.get("Answer Format", "").strip()

    if not category or description.lower() in _SKIP_VALUES:
        return None

    parts = [category]
    if description and description.lower() not in _SKIP_VALUES:
        parts.append(f"Description: {description}")
    if answer_fmt and answer_fmt.lower() not in _SKIP_VALUES:
        parts.append(f"Answer Format: {answer_fmt}")

    return "\n".join(parts)


async def ingest_cuad_csv(file_path: str, source: str, db: AsyncSession) -> int:
    with open(file_path, newline="", encoding="utf-8-sig") as f:
        # Auto-detect delimiter (handles both CSV and TSV)
        sample = f.read(4096)
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t")
        f.seek(0)
        reader = csv.DictReader(f, dialect=dialect)

        count = 0
        for row in reader:
            text = _format_chunk(row)
            if not text:
                continue

            vector = embed(text)
            db.add(KnowledgeChunk(
                id=uuid.uuid4(),
                source=source,
                content=text,
                embedding=vector,
            ))
            count += 1

    await db.commit()
    return count
