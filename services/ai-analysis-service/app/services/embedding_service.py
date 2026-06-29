import ollama

from app.config import settings

_client = ollama.Client(host=settings.ollama_base_url)


def embed(text: str) -> list[float]:
    response = _client.embed(model=settings.ollama_embed_model, input=text)
    return response.embeddings[0]
