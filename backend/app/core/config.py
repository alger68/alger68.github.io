"""Application configuration management."""
from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Environment settings loaded from `.env` or environment variables."""

    app_name: str = "Quant Platform API"
    debug: bool = False
    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/quant"
    )
    redis_url: str = Field(default="redis://localhost:6379/0")
    jwt_public_key: str = Field(default="", description="PEM formatted public key")
    jwt_private_key: str = Field(default="", description="PEM formatted private key")
    jwt_algorithm: str = Field(default="RS256")
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()
