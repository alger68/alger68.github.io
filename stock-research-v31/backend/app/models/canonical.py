from datetime import datetime
from pydantic import BaseModel

class CanonicalDatum(BaseModel):
    metric: str
    value: float | int | str | None
    unit: str | None = None
    period: str | None = None
    scope: str
    source_name: str
    source_url: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime
    verified: bool = False
    confidence: float = 0.0
    verification_note: str | None = None
