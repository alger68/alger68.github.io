from datetime import date, datetime, timedelta

def _is_trading_day(d: date, holidays: set[date] | None=None) -> bool:
    return d.weekday()<5 and d not in (holidays or set())

def _latest_trading_day(on_or_before: date, holidays: set[date] | None=None) -> date:
    d=on_or_before
    while not _is_trading_day(d,holidays): d-=timedelta(days=1)
    return d

def quote_freshness(quote_date: date, checked_at: datetime, trading_calendar: set[date] | None=None) -> dict:
    checked_date=checked_at.date()
    latest=_latest_trading_day(checked_date,trading_calendar)
    if quote_date>=latest:
        non_trading=not _is_trading_day(checked_date,trading_calendar)
        return {'freshness':'current_market_close','lag_trading_days':0,'label':'最近收盤' if non_trading else '今日收盤','quote_date':quote_date.isoformat(),'checked_at':checked_at.isoformat()}
    d=quote_date+timedelta(days=1); lag=0
    while d<=latest:
        if _is_trading_day(d,trading_calendar): lag+=1
        d+=timedelta(days=1)
    return {'freshness':'stale','lag_trading_days':lag,'label':'昨日收盤' if lag==1 else '較舊收盤','quote_date':quote_date.isoformat(),'checked_at':checked_at.isoformat(),'warning':'今日行情尚未由主要來源發布'}
