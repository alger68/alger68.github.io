from datetime import datetime, timezone


def _num(value):
    try:
        return float(str(value).replace(',', '').replace('+','').strip())
    except Exception:
        return None


def _first(row, *keys):
    for key in keys:
        value=row.get(key)
        if value not in (None,'','--','-'):
            return value
    return None


class PublicMarketProvider:
    URLS={
        'TWSE':'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
        'TPEX':'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes',
    }
    def __init__(self,http,now=lambda: datetime.now(timezone.utc)):
        self.http=http; self.now=now; self.checked_at=None; self._errors={}; self._connected=False

    @staticmethod
    def _row(exchange,row):
        ticker=str(_first(row,'Code','SecuritiesCompanyCode','SecuritiesCode','股票代號') or '').strip()
        if not ticker: return None
        name=str(_first(row,'Name','CompanyName','SecuritiesCompanyName','公司簡稱','股票名稱') or '').strip()
        close=_num(_first(row,'ClosingPrice','Close','收盤價','ClosePrice'))
        change=_num(_first(row,'Change','漲跌價差','ChangeAmount'))
        pct=_num(_first(row,'ChangePercent','ChangeRate','漲跌幅','漲跌幅(%)'))
        if pct is None and close is not None and change is not None:
            prev=close-change
            pct=(change/prev*100.0) if prev else 0.0
        if close is None or pct is None: return None
        return {
            'exchange':exchange,'ticker':ticker,'symbol':ticker,'name':name,
            'price':close,'change':change,'change_pct':pct,
            'volume':_num(_first(row,'TradeVolume','TradingShares','成交股數','Volume')),
            'sector':'其他',
        }

    def rows(self):
        out=[]; errors={}
        for exchange,url in self.URLS.items():
            try:
                rows=self.http.get_json(url)
                for row in rows or []:
                    item=self._row(exchange,row)
                    if item: out.append(item)
            except Exception as exc:
                errors[exchange]=exc.__class__.__name__
        self.checked_at=self.now().isoformat(); self._errors=errors; self._connected=bool(out)
        return out

    def status(self):
        return {'enabled':True,'provider':'public_twse_tpex','connected':self._connected,'errors':dict(self._errors)}
