from datetime import date, datetime, time, timedelta


def _is_trading_day(d: date, holidays: set[date] | None=None) -> bool:
    return d.weekday()<5 and d not in (holidays or set())


def _latest_trading_day(on_or_before: date, holidays: set[date] | None=None) -> date:
    d=on_or_before
    while not _is_trading_day(d,holidays):
        d-=timedelta(days=1)
    return d


def _previous_trading_day(before: date, holidays: set[date] | None=None) -> date:
    return _latest_trading_day(before-timedelta(days=1), holidays)


def quote_freshness(quote_date: date, checked_at: datetime, trading_calendar: set[date] | None=None) -> dict:
    checked_date=checked_at.date()
    is_session_day=_is_trading_day(checked_date,trading_calendar)

    # Public close-only feeds should not be expected to have today's completed
    # close before the Taiwan market close/publication window.  During premarket
    # and the trading session, the previous trading-day close is current context.
    before_close=is_session_day and checked_at.time() < time(15,0)
    if before_close:
        expected=_previous_trading_day(checked_date,trading_calendar)
        if quote_date>=expected:
            before_open=checked_at.time() < time(9,0)
            return {
                'freshness':'premarket_previous_close' if before_open else 'market_session_previous_close',
                'lag_trading_days':0,
                'label':'昨日收盤' if quote_date==checked_date-timedelta(days=1) else '前一交易日收盤',
                'quote_date':quote_date.isoformat(),
                'checked_at':checked_at.isoformat(),
            }
        latest=expected
    else:
        latest=_latest_trading_day(checked_date,trading_calendar)
        if quote_date>=latest:
            non_trading=not is_session_day
            return {
                'freshness':'current_market_close',
                'lag_trading_days':0,
                'label':'最近收盤' if non_trading else '今日收盤',
                'quote_date':quote_date.isoformat(),
                'checked_at':checked_at.isoformat(),
            }

    d=quote_date+timedelta(days=1); lag=0
    while d<=latest:
        if _is_trading_day(d,trading_calendar):
            lag+=1
        d+=timedelta(days=1)
    return {
        'freshness':'stale',
        'lag_trading_days':lag,
        'label':'昨日收盤' if lag==1 else '較舊收盤',
        'quote_date':quote_date.isoformat(),
        'checked_at':checked_at.isoformat(),
        'warning':'行情資料落後於最近應有的完整交易日',
    }
