import ollama

from app.config import settings

_client = ollama.AsyncClient(host=settings.ollama_base_url)


async def embed(text: str) -> list[float]:
    response = await _client.embed(model=settings.ollama_embed_model, input=text)
    return response.embeddings[0]
