from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ai-analysis-service"
    app_port: int = 8083
    service_host: str = "127.0.0.1"
    consul_host: str = "localhost"
    consul_port: int = 8500

    model_config = {"env_file": ".env"}


settings = Settings()
