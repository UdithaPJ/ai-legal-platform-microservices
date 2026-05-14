import json

import ollama
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.retrieval_service import retrieve

_RETRIEVAL_QUERIES = [
    "risky clauses legal contract liability indemnification termination penalty",
    "contract summary key terms parties obligations rights",
    "plain language legal terms definitions explanation",
]

# ~3000 tokens — safe headroom for phi3:mini's context window
_MAX_DOC_CHARS = 10_000


async def analyse(document_text: str, db: AsyncSession) -> dict:
    # Retrieve relevant legal context across all query types
    seen: set[str] = set()
    context_chunks: list[str] = []
    for query in _RETRIEVAL_QUERIES:
        for chunk in await retrieve(query, db):
            if chunk not in seen:
                seen.add(chunk)
                context_chunks.append(chunk)

    context_text = "\n\n---\n\n".join(context_chunks)
    doc_excerpt = document_text[:_MAX_DOC_CHARS]

    prompt = f"""You are a legal document analyst. Use the reference material below to analyse the contract.
Return ONLY valid JSON with no other text before or after it.

REFERENCE MATERIAL:
{context_text}

DOCUMENT TO ANALYSE:
{doc_excerpt}

Return JSON with exactly this structure:
{{
  "summary": "A concise paragraph summarising the document",
  "risky_clauses": [
    {{"clause": "clause text or description", "risk_level": "high", "explanation": "why this is risky"}}
  ],
  "simplified_explanation": "Plain English explanation of the key terms and obligations"
}}"""

    response = ollama.chat(
        model=settings.ollama_gen_model,
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0.1},
    )

    content = response.message.content.strip()

    # Strip markdown code fences if the model wraps output in ```json ... ```
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    return json.loads(content)
