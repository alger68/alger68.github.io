def test_fallback_market_uses_public_when_nova_empty():
    from app.providers.fallback_market import FallbackMarketProvider
    class Primary:
        checked_at='p'
        def rows(self): return []
        def status(self): return {'provider':'taishin_nova','enabled':True,'connected':False}
    class Fallback:
        checked_at='f'
        def rows(self): return [{'exchange':'TWSE','ticker':'2395','price':718,'change_pct':-0.4,'sector':'電腦及週邊設備業'}]
        def status(self): return {'provider':'public_twse_tpex','enabled':True,'connected':True,'errors':{}}
    p=FallbackMarketProvider(Primary(),Fallback())
    rows=p.rows()
    assert rows[0]['ticker']=='2395'
    assert p.status()['provider']=='fallback_market'
    assert p.status()['active']=='public_twse_tpex'
    assert p.checked_at=='f'


def test_fallback_market_prefers_nova_when_rows_exist():
    from app.providers.fallback_market import FallbackMarketProvider
    class Primary:
        checked_at='p'
        def rows(self): return [{'exchange':'TWSE','ticker':'2395','price':720,'change_pct':0.2}]
        def status(self): return {'provider':'taishin_nova','enabled':True,'connected':True}
    class Fallback:
        checked_at='f'
        def rows(self): raise AssertionError('fallback should not be called')
        def status(self): return {'provider':'public_twse_tpex','connected':True}
    p=FallbackMarketProvider(Primary(),Fallback())
    assert p.rows()[0]['price']==720
    assert p.status()['active']=='taishin_nova'
    assert p.checked_at=='p'
