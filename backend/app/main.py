"""FastAPI application entrypoint."""
from fastapi import FastAPI

from .api.routes import router as api_router
from .core.config import get_settings


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""

    settings = get_settings()
    application = FastAPI(title=settings.app_name, debug=settings.debug)
    application.include_router(api_router, prefix="/api")
    return application


app = create_app()
