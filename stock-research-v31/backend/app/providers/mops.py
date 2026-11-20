from datetime import datetime, timezone
from app.models.provider import ProviderResult

class MopsProvider:
    def __init__(self,http,urls=None,now=lambda: datetime.now(timezone.utc)):
        self.http=http; self.urls=urls or {}; self.now=now
    def _one(self,key,ticker,fields=('公司代號','SecuritiesCompanyCode')):
        url=self.urls.get(key)
        if not url:
            return ProviderResult(source_name='MOPS',fetched_at=self.now(),data=None,error='source_unconfigured')
        rows=self.http.get_json(url)
        row=next((r for r in rows if any(str(r.get(f,''))==str(ticker) for f in fields)),None)
        return ProviderResult(source_name='MOPS',source_url=url,fetched_at=self.now(),data=row,error=None if row else 'not_found')
    def financials(self,exchange,ticker):
        return {'income':self._one('income',ticker),'balance':self._one('balance',ticker),'cashflow':self._one('cashflow',ticker)}
