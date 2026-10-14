from fastapi import FastAPI
from fastapi.testclient import TestClient


def test_source_health_reports_public_ready_and_nova_optional():
    from app.api.status import router
    app=FastAPI(); app.include_router(router)
    class P:
        def status(self): return {'provider':'public_twse_tpex','connected':True,'errors':{}}
    class N:
        enabled=False
        def status(self): return {'provider':'taishin_nova','enabled':False,'connected':False,'error':None}
    app.state.market_provider=P(); app.state.private_provider=N(); app.state.news_provider=object(); app.state.financial_provider=object(); app.state.history_provider=object()
    data=TestClient(app).get('/api/status/sources').json()
    assert data['overall'] in ('ready','partial')
    assert data['sources']['public_market']['status']=='ready'
    assert data['sources']['taishin_nova']['status']=='optional'
    assert data['sources']['cashflow']['status']=='missing'
