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


def test_source_health_marks_recent_news_and_tpex_history_ready_after_154b():
    from app.api.status import router
    app=FastAPI(); app.include_router(router)
    class M:
        def status(self): return {'provider':'public_twse_tpex','connected':True,'errors':{}}
    class N:
        enabled=False
        def status(self): return {'provider':'taishin_nova','enabled':False,'connected':False,'error':None}
    class H:
        def status(self): return {'provider':'tpex_tradingStock','status':'ready','connected':True,'last_count':20}
    app.state.market_provider=M(); app.state.private_provider=N(); app.state.news_provider=object(); app.state.financial_provider=object(); app.state.history_provider=object(); app.state.history_tpex_provider=H()
    data=TestClient(app).get('/api/status/sources').json()['sources']
    assert data['recent_news']['status']=='ready'
    assert data['history_tpex']['status']=='ready'


def test_source_health_does_not_claim_tpex_history_ready_before_runtime_probe():
    from app.api.status import router
    app=FastAPI(); app.include_router(router)
    class Market:
        def status(self): return {'provider':'public_twse_tpex','connected':True,'errors':{}}
    class Nova:
        enabled=False
        def status(self): return {'provider':'taishin_nova','enabled':False,'connected':False,'error':None}
    class TpexHistory:
        def status(self): return {'provider':'tpex_tradingStock','status':'configured','connected':False,'last_count':None}
    app.state.market_provider=Market(); app.state.private_provider=Nova(); app.state.news_provider=object(); app.state.financial_provider=object(); app.state.history_provider=object(); app.state.history_tpex_provider=TpexHistory()
    data=TestClient(app).get('/api/status/sources').json()
    assert data['sources']['history_tpex']['status']=='configured'


def test_source_health_is_partial_while_cashflow_is_missing():
    from app.api.status import router
    app=FastAPI(); app.include_router(router)
    class M:
        def status(self): return {'provider':'public_twse_tpex','connected':True,'errors':{}}
    class N:
        enabled=False
        def status(self): return {'provider':'taishin_nova','enabled':False,'connected':False,'error':None}
    class H:
        def status(self): return {'provider':'tpex_tradingStock','status':'ready','connected':True,'last_count':230}
    app.state.market_provider=M(); app.state.private_provider=N(); app.state.news_provider=object(); app.state.financial_provider=object(); app.state.history_provider=object(); app.state.history_tpex_provider=H()
    data=TestClient(app).get('/api/status/sources').json()
    assert data['sources']['cashflow']['status']=='missing'
    assert data['overall']=='partial'
