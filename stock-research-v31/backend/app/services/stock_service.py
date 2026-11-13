from datetime import date, datetime
from app.models.canonical import CanonicalDatum
from app.services.freshness import quote_freshness
from app.services.verification import verify_candidates


def roc_date(value: str | None):
    s=str(value or '').strip()
    if len(s)!=7 or not s.isdigit(): return None
    y=int(s[:3])+1911; m=int(s[3:5]); d=int(s[5:7])
    try: return date(y,m,d)
    except ValueError: return None

def roc_month(value: str | None):
    s=str(value or '').strip()
    if len(s)!=5 or not s.isdigit(): return None
    return f'{int(s[:3])+1911:04d}-{s[3:5]}'

def num(value):
    try:
        x=float(str(value).replace(',',''))
        return x
    except Exception: return None

class StockService:
    def __init__(self, provider_for_exchange, now=datetime.now):
        self.provider_for_exchange=provider_for_exchange; self.now=now
    def summary(self,exchange,ticker):
        p=self.provider_for_exchange(exchange)
        q=p.quote(ticker); rev=p.revenue(ticker); val=p.valuation(ticker); inc=p.financial_summary(ticker)
        checked=self.now(); warnings=[]
        price=None
        if q.data:
            qd=roc_date(q.data.get('Date'))
            if qd:
                fresh=quote_freshness(qd,checked)
                price={**fresh,'price':num(q.data.get('ClosingPrice') or q.data.get('Close') or q.data.get('ClosePrice') or q.data.get('LastPrice')),'open':num(q.data.get('OpeningPrice') or q.data.get('Open') or q.data.get('OpenPrice')),'high':num(q.data.get('HighestPrice') or q.data.get('High') or q.data.get('HighPrice')),'low':num(q.data.get('LowestPrice') or q.data.get('Low') or q.data.get('LowPrice')),'source':q.source_name}
                if fresh['freshness']=='stale': warnings.append(fresh.get('warning'))
        revenue=None
        if rev.data:
            revenue={'period':roc_month(rev.data.get('資料年月')),'amount_thousand':num(rev.data.get('營業收入-當月營收')),'yoy':num(rev.data.get('營業收入-去年同月增減(%)')),'source':rev.source_name}
        valuation=None
        if val.data:
            valuation={'pe':num(val.data.get('PEratio') or val.data.get('PriceEarningRatio')),'yield':num(val.data.get('DividendYield') or val.data.get('YieldRatio')),'source':val.source_name}
        eps={'value':None,'period':None,'verified':False,'confidence':0.0}
        if inc.data:
            year=inc.data.get('年度') or inc.data.get('Year'); season=inc.data.get('季別') or inc.data.get('Season')
            period=f'{int(year)+1911}-Q{season}' if year and str(year).isdigit() and season else None
            d=CanonicalDatum(metric='eps',value=num(inc.data.get('基本每股盈餘（元）')),unit='TWD',period=period,scope=inc.scope_hint or 'unknown',source_name=inc.source_name,source_url=inc.source_url,fetched_at=inc.fetched_at)
            v=verify_candidates([d]); eps={'value':v.value,'period':v.period,'verified':v.verified,'confidence':v.confidence,'verification_note':v.verification_note}
            if not v.verified: warnings.append('EPS 口徑尚未驗證，不進入 verified valuation')
        confidence=round(sum([0.25 if price else 0,0.25 if revenue else 0,0.25 if valuation else 0,0.25 if eps['value'] is not None else 0]),2)
        return {'identity':{'exchange':exchange.upper(),'ticker':str(ticker)},'price':price,'revenue':revenue,'valuation':valuation,'eps':eps,'source_confidence':confidence,'warnings':[x for x in warnings if x],'checked_at':checked.isoformat()}
    def refresh(self,exchange,ticker):
        return self.summary(exchange,ticker)
