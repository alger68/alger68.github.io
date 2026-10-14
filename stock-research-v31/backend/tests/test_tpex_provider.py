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


def test_tpex_realistic_openapi_shapes_flow_into_summary():
    from app.providers.tpex import TpexProvider
    from app.services.stock_service import StockService
    urls=TpexProvider.URLS
    payload={
      urls['quote']:[{
        'Date':'1151014','SecuritiesCompanyCode':'6488','CompanyName':'環球晶',
        'Close':'518.00','Change':'-3.00','Open':'508.00','High':'530.00','Low':'502.00',
        'TradingShares':'1,985,000'
      }],
      urls['revenue']:[{
        '出表日期':'1151014','資料年月':'11509','公司代號':'6488','公司名稱':'環球晶',
        '營業收入-當月營收':'6000000','營業收入-去年同月增減(%)':'12.50'
      }],
      urls['valuation']:[{
        'Date':'1151014','SecuritiesCompanyCode':'6488','CompanyName':'環球晶',
        'PriceEarningRatio':'18.20','YieldRatio':'2.10','PriceBookRatio':'2.50'
      }],
      urls['income']:[{
        '出表日期':'1151014','SecuritiesCompanyCode':'6488','Year':'115','Season':'2',
        '基本每股盈餘（元）':'15.20'
      }],
    }
    p=TpexProvider(FakeHttp(payload), now=lambda: datetime(2026,10,14,15,0,tzinfo=timezone.utc))
    svc=StockService(lambda ex:p, now=lambda: datetime(2026,10,14,15,0))
    data=svc.summary('TPEX','6488')
    assert data['identity']=={'exchange':'TPEX','ticker':'6488'}
    assert data['price']['price']==518.0
    assert data['price']['quote_date']=='2026-10-14'
    assert data['revenue']['period']=='2026-09'
    assert data['revenue']['yoy']==12.5
    assert data['valuation']['pe']==18.2
    assert data['valuation']['yield']==2.1
    assert data['eps']['value']==15.2
    assert data['eps']['verified'] is False


def test_tpex_na_valuation_is_missing_not_zero():
    from app.providers.tpex import TpexProvider
    from app.services.stock_service import StockService
    urls=TpexProvider.URLS
    payload={
      urls['quote']:[{'Date':'1151014','SecuritiesCompanyCode':'6488','Close':'518'}],
      urls['revenue']:[],
      urls['valuation']:[{'Date':'1151014','SecuritiesCompanyCode':'6488','PriceEarningRatio':'N/A','YieldRatio':'0.00'}],
      urls['income']:[],
    }
    p=TpexProvider(FakeHttp(payload))
    data=StockService(lambda ex:p, now=lambda: datetime(2026,10,14,15,0)).summary('TPEX','6488')
    assert data['valuation']['pe'] is None
    assert data['valuation']['yield']==0.0
