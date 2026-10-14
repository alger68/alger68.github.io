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
    assert app.state.history_provider.history('TWSE','2395','1y') == []

def test_main_app_is_bootstrapped_for_direct_uvicorn_start():
    from app.main import app
    assert hasattr(app.state,'stock_service')
    assert hasattr(app.state,'history_provider')
    assert hasattr(app.state,'financial_provider')
