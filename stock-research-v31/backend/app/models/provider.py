from datetime import datetime
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class ProviderResult(BaseModel, Generic[T]):
    source_name: str
    source_url: str | None = None
    fetched_at: datetime
    published_at: datetime | None = None
    period: str | None = None
    scope_hint: str | None = None
    data: T | None = None
    error: str | None = None
