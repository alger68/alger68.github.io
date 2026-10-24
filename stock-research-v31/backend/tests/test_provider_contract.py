from datetime import datetime, timezone

def test_provider_result_preserves_source_metadata():
    from app.models.provider import ProviderResult
    r = ProviderResult(source_name='TWSE', source_url='https://example.test', fetched_at=datetime(2026,10,14,tzinfo=timezone.utc), published_at=None, period='2026-10-13', scope_hint='single_day', data={'price':718})
    assert r.source_name == 'TWSE'
    assert r.scope_hint == 'single_day'
    assert r.data['price'] == 718
    assert r.error is None
