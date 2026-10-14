from fastapi.testclient import TestClient


def test_health_returns_version_and_mode():
    from app.main import app
    client = TestClient(app)
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.json() == {'status': 'ok', 'mode': 'local', 'version': '3.1'}


def test_config_mode_matches_health():
    from app.main import app
    client = TestClient(app)
    r = client.get('/api/config/mode')
    assert r.status_code == 200
    assert r.json() == {'mode': 'local'}
