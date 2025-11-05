"""Security utilities for authentication and authorization."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import jwt
from passlib.context import CryptContext

from .config import get_settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with Argon2id."""

    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password with Argon2id."""

    return pwd_context.hash(password)


def create_access_token(subject: str, claims: Dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create JWT access token signed with configured algorithm."""

    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode = {"sub": subject, "iat": int(now.timestamp()), "exp": int(expire.timestamp())}
    to_encode.update(claims)
    token = jwt.encode(
        to_encode,
        settings.jwt_private_key or "development-secret",
        algorithm=settings.jwt_algorithm,
    )
    return token
