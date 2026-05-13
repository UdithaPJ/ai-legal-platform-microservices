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
    app_port: int = 8083
    service_host: str = _local_ip()
    consul_host: str = "localhost"
    consul_port: int = 8500

    model_config = {"env_file": ".env"}


settings = Settings()
