import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from app.config import settings
from app.database import Base, engine
from app.routers import documents, health, knowledge

logger = logging.getLogger(__name__)


def _consul_base() -> str:
    return f"http://{settings.consul_host}:{settings.consul_port}"


def _registration_payload() -> dict:
    return {
        "ID": f"{settings.app_name}-1",
        "Name": settings.app_name,
        "Address": settings.service_host,
        "Port": settings.app_port,
        "Check": {
            "HTTP": f"http://{settings.service_host}:{settings.app_port}/health",
            "Interval": "10s",
            "DeregisterCriticalServiceAfter": "30s",
        },
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        from app.models import document  # ensure models are registered
        await conn.run_sync(Base.metadata.create_all)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.put(
                f"{_consul_base()}/v1/agent/service/register",
                json=_registration_payload(),
            )
            resp.raise_for_status()
            logger.info("Registered with Consul as '%s'", settings.app_name)
        except Exception as exc:
            logger.warning("Consul registration failed: %s", exc)

    yield

    async with httpx.AsyncClient() as client:
        try:
            await client.put(
                f"{_consul_base()}/v1/agent/service/deregister/{settings.app_name}-1"
            )
            logger.info("Deregistered from Consul")
        except Exception as exc:
            logger.warning("Consul deregistration failed: %s", exc)


app = FastAPI(title="AI Analysis Service", lifespan=lifespan)

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(knowledge.router)

if __name__ == "__main__":
    import uvicorn
    print(_consul_base())
    uvicorn.run(
        "app.main:app",          # same as: uvicorn app.main:app
        host="0.0.0.0",
        port=settings.app_port,  # 8083 by default
        reload=True,
    )