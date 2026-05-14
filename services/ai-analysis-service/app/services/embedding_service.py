import ollama

from app.config import settings


def embed(text: str) -> list[float]:
    response = ollama.embed(model=settings.ollama_embed_model, input=text)
    return response.embeddings[0]
