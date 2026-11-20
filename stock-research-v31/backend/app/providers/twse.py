from datetime import datetime, timezone
from app.models.provider import ProviderResult

class TwseProvider:
    URLS = {
        'quote':'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
        'revenue':'https://openapi.twse.com.tw/v1/opendata/t187ap05_L',
        'valuation':'https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL',
        'income':'https://openapi.twse.com.tw/v1/opendata/t187ap06_L_ci',
    }
    def __init__(self, http, now=lambda: datetime.now(timezone.utc)):
        self.http=http; self.now=now
    def _get(self, key, ticker, fields, scope):
        rows=self.http.get_json(self.URLS[key])
        row=next((r for r in rows if any(str(r.get(f,''))==ticker for f in fields)),None)
        return ProviderResult(source_name='TWSE', source_url=self.URLS[key], fetched_at=self.now(), scope_hint=scope, data=row, error=None if row else 'not_found')
    def quote(self,ticker): return self._get('quote',str(ticker),['Code'],'single_day')
    def revenue(self,ticker): return self._get('revenue',str(ticker),['公司代號'],'single_month')
    def valuation(self,ticker): return self._get('valuation',str(ticker),['Code'],'single_day')
    def financial_summary(self,ticker): return self._get('income',str(ticker),['公司代號'],'quarter_unspecified')
