from datetime import datetime, timezone

class FakeHttp:
    def __init__(self, payload): self.payload=payload
    def get_json(self, url): return self.payload[url]


def test_twse_provider_filters_exact_ticker_and_preserves_scope():
    from app.providers.twse import TwseProvider
    urls=TwseProvider.URLS
    http=FakeHttp({
      urls['quote']:[{'Code':'2395','Date':'1151013','ClosingPrice':'718.00'},{'Code':'2454','Date':'1151013','ClosingPrice':'1400'}],
      urls['revenue']:[{'公司代號':'2395','資料年月':'11509','營業收入-當月營收':'10748681'}],
      urls['valuation']:[{'Code':'2395','Date':'1151013','PEratio':'45.47'}],
      urls['income']:[{'公司代號':'2395','年度':'115','季別':'2','基本每股盈餘（元）':'9.05'}],
    })
    p=TwseProvider(http, now=lambda: datetime(2026,10,14,tzinfo=timezone.utc))
    assert p.quote('2395').data['Code']=='2395'
    assert p.quote('2395').scope_hint=='single_day'
    assert p.revenue('2395').scope_hint=='single_month'
    assert p.financial_summary('2395').scope_hint=='quarter_unspecified'
    assert p.quote('9999').data is None
    assert p.quote('9999').error=='not_found'
