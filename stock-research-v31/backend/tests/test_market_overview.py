def test_market_overview_computes_breadth_and_top_movers():
    from app.services.market_overview import build_market_overview
    rows=[
      {'ticker':'A','name':'甲','change_pct':3.2,'sector':'電子'},
      {'ticker':'B','name':'乙','change_pct':-2.1,'sector':'電子'},
      {'ticker':'C','name':'丙','change_pct':0,'sector':'金融'},
    ]
    r=build_market_overview(rows,checked_at='2026-10-14T17:29:00+08:00')
    assert r['breadth']=={'up':1,'down':1,'flat':1}
    assert r['top_gainers'][0]['ticker']=='A'
    assert r['top_losers'][0]['ticker']=='B'
    assert r['checked_at'].startswith('2026-10-14')
