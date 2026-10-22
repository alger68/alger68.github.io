"""Tests for system health endpoint."""
from fastapi.testclient import TestClient

from app.main import create_app


client = TestClient(create_app())


def test_health_endpoint_returns_ok_status() -> None:
    """Health check endpoint should return HTTP 200 with ok status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
