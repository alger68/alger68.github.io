from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient

TZ=ZoneInfo('Asia/Taipei')

class FakeProvider:
    def quote(self,ticker):
        from app.models.provider import ProviderResult
        return ProviderResult(source_name='TWSE',source_url='q',fetched_at=datetime(2026,10,14,17,29,tzinfo=TZ),scope_hint='single_day',data={'Code':ticker,'Date':'1151013','ClosingPrice':'718.00','OpeningPrice':'708.00','HighestPrice':'730.00','LowestPrice':'702.00'})
    def revenue(self,ticker):
        from app.models.provider import ProviderResult
        return ProviderResult(source_name='TWSE',source_url='r',fetched_at=datetime(2026,10,14,17,29,tzinfo=TZ),scope_hint='single_month',data={'公司代號':ticker,'資料年月':'11509','營業收入-當月營收':'10748681','營業收入-去年同月增減(%)':'73.14'})
    def valuation(self,ticker):
        from app.models.provider import ProviderResult
        return ProviderResult(source_name='TWSE',source_url='v',fetched_at=datetime(2026,10,14,17,29,tzinfo=TZ),scope_hint='single_day',data={'Code':ticker,'Date':'1151013','PEratio':'45.47','DividendYield':'1.55'})
    def financial_summary(self,ticker):
        from app.models.provider import ProviderResult
        return ProviderResult(source_name='TWSE',source_url='f',fetched_at=datetime(2026,10,14,17,29,tzinfo=TZ),scope_hint='quarter_unspecified',data={'公司代號':ticker,'年度':'115','季別':'2','基本每股盈餘（元）':'9.05'})


def test_summary_exposes_stale_quote_and_verified_boundaries():
    from app.main import app
    from app.services.stock_service import StockService
    app.state.stock_service=StockService(lambda exchange: FakeProvider(), now=lambda: datetime(2026,10,14,17,29,tzinfo=TZ))
    client=TestClient(app)
    r=client.get('/api/stocks/2395/summary?exchange=TWSE')
    assert r.status_code==200
    j=r.json()
    assert j['identity']=={'exchange':'TWSE','ticker':'2395'}
    assert j['price']['price']==718.0
    assert j['price']['freshness']=='stale'
    assert j['price']['label']=='昨日收盤'
    assert j['price']['quote_date']=='2026-10-13'
    assert j['eps']['verified'] is False
    assert j['warnings']
