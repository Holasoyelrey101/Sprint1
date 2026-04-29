from pydantic import BaseModel, Field
from typing import Optional


class TelemetryInput(BaseModel):
    deveui: str = Field(..., example="ABC123")
    humedad: Optional[float] = None
    temperatura: Optional[float] = None
    ph: Optional[float] = None
    voltaje: Optional[float] = None
    # New optional fields for agricultural readings
    humedad_aire: Optional[float] = None
    humedad_suelo: Optional[float] = None