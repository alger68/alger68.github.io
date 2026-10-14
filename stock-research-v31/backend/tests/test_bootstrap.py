from fastapi import FastAPI

class FakeHttp:
    def get_json(self,url): return []

def test_configure_app_wires_runtime_services_without_network():
    from app.bootstrap import configure_app
    app=FastAPI()
    configure_app(app,http=FakeHttp())
    assert hasattr(app.state,'stock_service')
    assert hasattr(app.state,'history_provider')
    assert hasattr(app.state,'financial_provider')
    assert hasattr(app.state,'news_provider')
    assert hasattr(app.state,'market_provider')
    assert app.state.history_provider.history('TPEX','1240','1y') == []

def test_main_app_is_bootstrapped_for_direct_uvicorn_start():
    from app.main import app
    assert hasattr(app.state,'stock_service')
    assert hasattr(app.state,'history_provider')
    assert hasattr(app.state,'financial_provider')


def test_nova_market_rows_are_enriched_with_official_industry_name():
    from app.bootstrap import configure_app
    from app.services.directory import DirectoryService
    class Http:
        def get_json(self,url):
            if url==DirectoryService.URLS['TWSE']:
                return [{'公司代號':'2395','公司名稱':'研華','公司簡稱':'研華','產業別':'25'}]
            if url==DirectoryService.URLS['TPEX']:
                return []
            return []
    class Nova:
        enabled=True; checked_at='2026-10-14T13:45:00+08:00'
        def rows(self): return [{'exchange':'TWSE','ticker':'2395','name':'研華','change_pct':1.2,'sector':'其他'}]
        def quote(self,ticker):
            from app.models.provider import ProviderResult
            from datetime import datetime, timezone
            return ProviderResult(source_name='Taishin Nova',fetched_at=datetime.now(timezone.utc),data=None,error='not_used')
        def status(self): return {'enabled':True,'provider':'taishin_nova','connected':True,'error':None}
    app=FastAPI()
    configure_app(app,http=Http(),nova_provider=Nova())
    rows=app.state.market_provider.rows()
    assert rows[0]['sector']=='電腦及週邊設備業'
    assert rows[0]['industry_code']=='25'
