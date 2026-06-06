import socket

from pydantic_settings import BaseSettings


def _local_ip() -> str:
    # Opens a UDP socket to a public address to discover the outbound interface IP.
    # No data is actually sent — this just picks the right interface on multi-homed machines.
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]


class Settings(BaseSettings):
    app_name: str = "ai-analysis-service"
    app_port: int = 8087
    service_host: str = _local_ip()

    # Docker: set CONSUL_HOST=consul  (defaults to localhost for local dev)
    consul_host: str = "localhost"
    consul_port: int = 8500

    # Docker: set DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/ai_analysis_db
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5433/ai_analysis_db"

    # Docker: set UPLOAD_DIR=/app/uploads
    upload_dir: str = "services/ai-analysis-service/uploads"

    # Docker: set OLLAMA_BASE_URL=http://ollama:11434
    ollama_base_url: str = "http://localhost:11434"
    ollama_embed_model: str = "nomic-embed-text"
    ollama_gen_model: str = "phi3:mini"

    retrieval_top_k: int = 5
    chunk_size: int = 512
    chunk_overlap: int = 50

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
