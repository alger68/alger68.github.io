def test_history_normalizes_candles_without_inventing_missing_rows():
    from app.providers.history import normalize_candles
    rows=[
      {'date':'2026-10-13','open':708,'high':730,'low':702,'close':718,'volume':1985656},
      {'date':'2026-10-14','open':720,'high':725,'low':710,'close':715,'volume':1500000},
    ]
    out=normalize_candles(rows)
    assert len(out)==2
    assert out[0]['close']==718.0
    assert out[1]['date']=='2026-10-14'
