"""API route registration."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Simple health check endpoint."""

    return {"status": "ok"}
