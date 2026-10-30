def candles(n=260):
    return [{'date':f'2026-{(i//28)%9+1:02d}-{i%28+1:02d}','open':100+i,'high':102+i,'low':98+i,'close':100+i,'volume':1000+i} for i in range(n)]


def test_technical_summary_has_required_indicators_when_history_is_sufficient():
    from app.services.technicals import technical_summary
    r=technical_summary(candles())
    assert r['available'] is True
    assert r['sma']['5'] is not None
    assert r['sma']['240'] is not None
    assert r['rsi14'] is not None
    assert set(r['macd'])=={'macd','signal','histogram'}
    assert set(r['kd'])=={'k','d'}
    assert set(r['bollinger'])=={'middle','upper','lower'}


def test_insufficient_history_returns_unavailable_not_fake_values():
    from app.services.technicals import technical_summary
    r=technical_summary(candles(10))
    assert r['available'] is False
    assert r['sma']['20'] is None
    assert r['rsi14'] is None
    assert r['warnings']
