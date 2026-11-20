from datetime import date
import httpx

class TwseHistoryProvider:
    URL='https://www.twse.com.tw/exchangeReport/STOCK_DAY'
    def __init__(self,fetch_json=None,today=date.today):
        self.fetch_json=fetch_json or self._fetch
        self.today=today
    def _fetch(self,url,params):
        r=httpx.get(url,params=params,headers={'Accept':'application/json','User-Agent':'StockMasterAI/3.1'},timeout=15.0)
        r.raise_for_status()
        return r.json()
    @staticmethod
    def _months_back(d,offset):
        total=d.year*12+(d.month-1)-offset
        return date(total//12,total%12+1,1)
    @staticmethod
    def _iso_roc(value):
        try:
            y,m,d=[int(x) for x in str(value).split('/')[:3]]
            return f'{y+1911:04d}-{m:02d}-{d:02d}'
        except Exception:
            return None
    @staticmethod
    def _num(value):
        try:return float(str(value).replace(',','').replace('X','').strip())
        except Exception:return None
    def history(self,exchange,ticker,range_name='1y'):
        if str(exchange).upper()!='TWSE': return []
        now=self.today()
        mapping={'1m':1,'3m':3,'6m':6,'1y':12,'3y':36,'5y':60}
        months=(now.month if range_name=='ytd' else mapping.get(str(range_name).lower(),12))
        rows=[]; seen=set()
        for i in range(months):
            month=self._months_back(now,i)
            payload=self.fetch_json(self.URL,{'response':'json','date':month.strftime('%Y%m01'),'stockNo':str(ticker)})
            if not isinstance(payload,dict) or not isinstance(payload.get('data'),list): continue
            for r in payload['data']:
                if not isinstance(r,list) or len(r)<7: continue
                day=self._iso_roc(r[0])
                if not day or day in seen: continue
                o,h,l,c=[self._num(r[j]) for j in (3,4,5,6)]
                if None in (o,h,l,c): continue
                seen.add(day)
                rows.append({'date':day,'open':o,'high':h,'low':l,'close':c,'volume':self._num(r[1])})
        rows.sort(key=lambda x:x['date'])
        return rows
