class FakeHttp:
    def __init__(self, data): self.data=data
    def get_json(self,url): return self.data[url]


def test_public_market_provider_combines_twse_tpex_and_computes_pct():
    from app.providers.public_market import PublicMarketProvider
    p=PublicMarketProvider(FakeHttp({
      PublicMarketProvider.URLS['TWSE']:[
        {'Code':'2395','Name':'研華','ClosingPrice':'110','Change':'10','TradeVolume':'1000'},
      ],
      PublicMarketProvider.URLS['TPEX']:[
        {'SecuritiesCompanyCode':'6488','CompanyName':'環球晶','Close':'90','Change':'-10','TradingShares':'2000'},
      ],
    }))
    rows=p.rows()
    assert rows[0]['exchange']=='TWSE'
    assert round(rows[0]['change_pct'],2)==10.0
    assert rows[1]['exchange']=='TPEX'
    assert round(rows[1]['change_pct'],2)==-10.0
    assert p.status()['provider']=='public_twse_tpex'
    assert p.checked_at is not None


def test_public_market_provider_survives_one_source_failure():
    from app.providers.public_market import PublicMarketProvider
    class Partial:
        def get_json(self,url):
            if 'twse' in url: return [{'Code':'2395','Name':'研華','ClosingPrice':'100','Change':'0'}]
            raise RuntimeError('down')
    p=PublicMarketProvider(Partial())
    assert len(p.rows())==1
    assert p.status()['connected'] is True
    assert 'TPEX' in p.status()['errors']
