from datetime import datetime, timezone

class FakeHttp:
    def __init__(self, payload): self.payload=payload
    def get_json(self, url): return self.payload[url]


def test_tpex_provider_uses_tpex_identity_fields_only():
    from app.providers.tpex import TpexProvider
    urls=TpexProvider.URLS
    http=FakeHttp({
      urls['quote']:[{'SecuritiesCompanyCode':'1240','Date':'1151013','Close':'30.0'}],
      urls['revenue']:[{'公司代號':'1240','資料年月':'11509'}],
      urls['valuation']:[{'SecuritiesCompanyCode':'1240','Date':'1151013','PriceEarningRatio':'10.02'}],
      urls['income']:[{'SecuritiesCompanyCode':'1240','Year':'115','Season':'2','基本每股盈餘（元）':'2.85'}],
    })
    p=TpexProvider(http, now=lambda: datetime(2026,10,14,tzinfo=timezone.utc))
    assert p.quote('1240').data['SecuritiesCompanyCode']=='1240'
    assert p.quote('2395').error=='not_found'
    assert p.valuation('1240').scope_hint=='single_day'
