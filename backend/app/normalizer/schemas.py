from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class NormalizedReading(BaseModel):
    """
    The one shape every vendor adapter's output must take. Nothing outside
    app/normalizer/adapters/ should ever see a vendor's raw response format --
    if you find yourself checking `if vendor == "..."` anywhere else in the
    codebase, that logic belongs in an adapter instead.

    Field names intentionally mirror app.schemas.SensorReadingCreate so a
    NormalizedReading can be handed straight to the existing ingestion path
    (see normalizer/service.py) without any extra translation step.
    """

    sensor_type: str  # e.g. "heartRate" -- must match a value the app/alert rules expect
    value: float
    unit: str  # e.g. "bpm"
    recorded_at: datetime
    quality_status: str = "ok"

    @field_validator("sensor_type", "unit")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be blank")
        return v
