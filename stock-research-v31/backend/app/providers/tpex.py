from datetime import datetime, timezone
from app.models.provider import ProviderResult

class TpexProvider:
    URLS = {
        'quote':'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes',
        'revenue':'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O',
        'valuation':'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis',
        'income':'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap06_O_ci',
    }
    def __init__(self, http, now=lambda: datetime.now(timezone.utc)):
        self.http=http; self.now=now
    def _get(self,key,ticker,fields,scope):
        rows=self.http.get_json(self.URLS[key])
        row=next((r for r in rows if any(str(r.get(f,''))==ticker for f in fields)),None)
        return ProviderResult(source_name='TPEx', source_url=self.URLS[key], fetched_at=self.now(), scope_hint=scope, data=row, error=None if row else 'not_found')
    def quote(self,ticker): return self._get('quote',str(ticker),['SecuritiesCompanyCode','SecuritiesCode'],'single_day')
    def revenue(self,ticker): return self._get('revenue',str(ticker),['公司代號','SecuritiesCompanyCode'],'single_month')
    def valuation(self,ticker): return self._get('valuation',str(ticker),['SecuritiesCompanyCode','SecuritiesCode'],'single_day')
    def financial_summary(self,ticker): return self._get('income',str(ticker),['SecuritiesCompanyCode','公司代號'],'quarter_unspecified')
