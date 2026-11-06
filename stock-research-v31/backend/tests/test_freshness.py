from datetime import date, datetime
from zoneinfo import ZoneInfo

TZ=ZoneInfo('Asia/Taipei')

def dt(y,m,d,h=17,minute=29): return datetime(y,m,d,h,minute,tzinfo=TZ)


def test_oct14_check_with_oct13_quote_is_yesterday_close():
    from app.services.freshness import quote_freshness
    r=quote_freshness(date(2026,10,13),dt(2026,10,14))
    assert r['freshness']=='stale'
    assert r['lag_trading_days']==1
    assert r['label']=='昨日收盤'
    assert r['quote_date']=='2026-10-13'
    assert r['checked_at'].startswith('2026-10-14T17:29')


def test_weekend_does_not_claim_one_day_lag():
    from app.services.freshness import quote_freshness
    r=quote_freshness(date(2026,10,16),dt(2026,10,17,12,0))
    assert r['lag_trading_days']==0
    assert r['freshness']=='current_market_close'
    assert r['label']=='最近收盤'


def test_premarket_previous_trading_day_close_is_expected_not_stale():
    from app.services.freshness import quote_freshness
    r=quote_freshness(date(2026,10,14),dt(2026,10,15,6,26))
    assert r['freshness']=='premarket_previous_close'
    assert r['lag_trading_days']==0
    assert r['label']=='昨日收盤'
    assert 'warning' not in r
