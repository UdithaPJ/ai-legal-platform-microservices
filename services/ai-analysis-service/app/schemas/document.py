import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisResult(BaseModel):
    summary: str | None
    risky_clauses: list[Any] | None
    simplified_explanation: str | None

    model_config = {"from_attributes": True}


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    created_at: datetime
    analysis: AnalysisResult | None

    model_config = {"from_attributes": True}
