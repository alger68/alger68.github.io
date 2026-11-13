from datetime import date

def test_twse_history_provider_parses_official_monthly_rows_and_sorts():
    from app.providers.history_twse import TwseHistoryProvider
    calls=[]
    def fetch(url,params):
        calls.append((url,params.copy()))
        return {'stat':'OK','data':[
          ['115/10/14','1,500','1,000,000','720.00','725.00','710.00','715.00','-3.00','300'],
          ['115/10/13','1,985','1,400,000','708.00','730.00','702.00','718.00','-3.00','3676'],
        ]}
    p=TwseHistoryProvider(fetch_json=fetch,today=lambda:date(2026,10,14))
    rows=p.history('TWSE','2395','1m')
    assert [x['date'] for x in rows]==['2026-10-13','2026-10-14']
    assert rows[0]['close']==718.0
    assert rows[1]['volume']==1500.0
    assert calls[0][1]['stockNo']=='2395'
    assert calls[0][1]['date']=='20261001'

def test_twse_history_provider_returns_empty_for_tpex_and_bad_payload():
    from app.providers.history_twse import TwseHistoryProvider
    p=TwseHistoryProvider(fetch_json=lambda u,p:{'stat':'查無資料'},today=lambda:date(2026,10,14))
    assert p.history('TPEX','1240','1m')==[]
    assert p.history('TWSE','2395','1m')==[]
