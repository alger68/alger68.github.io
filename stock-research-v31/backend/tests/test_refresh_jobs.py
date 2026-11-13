from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient

TZ=ZoneInfo('Asia/Taipei')

class EmptyProvider:
    def _r(self):
        from app.models.provider import ProviderResult
        return ProviderResult(source_name='TWSE',fetched_at=datetime(2026,10,14,tzinfo=TZ),data=None,error='not_found')
    quote=revenue=valuation=financial_summary=lambda self,ticker: self._r()


def test_refresh_job_is_queryable_even_when_provider_has_no_data():
    from app.main import app
    from app.services.stock_service import StockService
    app.state.stock_service=StockService(lambda exchange: EmptyProvider(), now=lambda: datetime(2026,10,14,17,29,tzinfo=TZ))
    client=TestClient(app)
    r=client.post('/api/stocks/2395/refresh?exchange=TWSE')
    assert r.status_code==200
    job=r.json()
    check=client.get('/api/jobs/'+job['job_id'])
    assert check.status_code==200
    assert check.json()['status'] in {'complete','warning'}
