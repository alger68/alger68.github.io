from datetime import date


def test_tpex_history_provider_parses_monthly_rows_and_sorts():
    from app.providers.history_tpex import TpexHistoryProvider
    calls=[]
    def fetch(url, params):
        calls.append((url, params.copy()))
        return {'tables':[{'fields':['日期','成交仟股','成交仟元','開盤','最高','最低','收盤','漲跌','筆數'], 'data':[
            ['115/10/14','1,500','1,000,000','520.00','525.00','510.00','515.00','-3.00','300'],
            ['115/10/13','1,985','1,400,000','508.00','530.00','502.00','518.00','-3.00','3676'],
        ]}]}
    p=TpexHistoryProvider(fetch_json=fetch,today=lambda:date(2026,10,14))
    rows=p.history('TPEX','6488','1m')
    assert [x['date'] for x in rows]==['2026-10-13','2026-10-14']
    assert rows[0]['close']==518.0
    assert rows[1]['volume']==1500000.0
    assert calls[0][1]['code']=='6488'
    assert calls[0][1]['date']=='2026/10/01'


def test_tpex_history_provider_accepts_dict_rows_and_ignores_other_market():
    from app.providers.history_tpex import TpexHistoryProvider
    def fetch(url, params):
        return {'data':[{'Date':'115/10/14','TradingShares':'1500','Open':'520','High':'525','Low':'510','Close':'515'}]}
    p=TpexHistoryProvider(fetch_json=fetch,today=lambda:date(2026,10,14))
    assert p.history('TWSE','6488','1m')==[]
    rows=p.history('TPEX','6488','1m')
    assert rows[0]['date']=='2026-10-14'
    assert rows[0]['close']==515.0


def test_composite_history_routes_each_exchange():
    from app.providers.history_tpex import CompositeHistoryProvider
    class A:
        def history(self,e,t,r): return ['twse']
    class B:
        def history(self,e,t,r): return ['tpex']
    p=CompositeHistoryProvider(A(),B())
    assert p.history('TWSE','2330','1y')==['twse']
    assert p.history('TPEX','6488','1y')==['tpex']
    assert p.history('OTHER','x','1y')==[]


def test_tpex_history_accepts_root_fields_data_and_spaced_date_label():
    from app.providers.history_tpex import TpexHistoryProvider
    def fetch(url, params):
        return {
            'fields':['日 期','成交仟股','成交仟元','開盤','最高','最低','收盤','漲跌','筆數'],
            'data':[
                ['115/10/13','1,985','1,400,000','508.00','530.00','502.00','518.00','-3.00','3676'],
            ],
        }
    p=TpexHistoryProvider(fetch_json=fetch,today=lambda:date(2026,10,14))
    rows=p.history('TPEX','6488','1m')
    assert rows == [{'date':'2026-10-13','open':508.0,'high':530.0,'low':502.0,'close':518.0,'volume':1985000.0}]


def test_tpex_history_status_is_configured_before_first_live_query():
    from app.providers.history_tpex import TpexHistoryProvider
    p=TpexHistoryProvider(fetch_json=lambda u,p: {})
    s=p.status()
    assert s['provider']=='tpex_tradingStock'
    assert s['status']=='configured'
    assert s['last_count'] is None


def test_tpex_history_status_becomes_ready_after_rows_are_parsed():
    from app.providers.history_tpex import TpexHistoryProvider
    def fetch(url,params):
        return {'tables':[{'fields':['日期','成交仟股','成交仟元','開盤','最高','最低','收盤'], 'data':[
            ['115/10/13','10','100','10','11','9','10.5']
        ]}]}
    p=TpexHistoryProvider(fetch_json=fetch,today=lambda:date(2026,10,14))
    assert len(p.history('TPEX','6488','1m'))==1
    s=p.status()
    assert s['status']=='ready'
    assert s['last_count']==1
    assert s['last_error'] is None


def test_tpex_history_uses_official_column_position_when_volume_header_has_markup_or_variant():
    from app.providers.history_tpex import TpexHistoryProvider
    def fetch(url, params):
        return {
            'fields':['日 期','成交量<br>仟股','成交仟元','開盤','最高','最低','收盤','漲跌','筆數'],
            'data':[
                ['115/10/14','12,345','9,999,999','1020','1030','994','1020','5','1234'],
            ],
        }
    p=TpexHistoryProvider(fetch_json=fetch,today=lambda:date(2026,10,15))
    rows=p.history('TPEX','6488','1m')
    assert rows[0]['volume']==12345000.0
