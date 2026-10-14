from datetime import date
import httpx


class TpexHistoryProvider:
    URL='https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock'
    def __init__(self,fetch_json=None,today=date.today):
        self.fetch_json=fetch_json or self._fetch
        self.today=today

    def _fetch(self,url,params):
        r=httpx.get(url,params={**params,'response':'json'},headers={'Accept':'application/json','User-Agent':'StockMasterAI/3.1'},timeout=15.0)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def _months_back(d,offset):
        total=d.year*12+(d.month-1)-offset
        return date(total//12,total%12+1,1)

    @staticmethod
    def _iso_roc(value):
        raw=str(value or '').strip().replace('-','/').replace('.','/')
        parts=raw.split('/')
        try:
            if len(parts)>=3:
                y,m,d=[int(x) for x in parts[:3]]
                if y<1911: y+=1911
                return f'{y:04d}-{m:02d}-{d:02d}'
            digits=''.join(ch for ch in raw if ch.isdigit())
            if len(digits)==7:
                return f'{int(digits[:3])+1911:04d}-{digits[3:5]}-{digits[5:7]}'
            if len(digits)==8:
                return f'{digits[:4]}-{digits[4:6]}-{digits[6:8]}'
        except Exception:
            return None
        return None

    @staticmethod
    def _num(value):
        try:return float(str(value).replace(',','').replace('+','').strip())
        except Exception:return None

    @classmethod
    def _list_row(cls,row,fields):
        mapping={str(k).strip():row[i] for i,k in enumerate(fields or []) if i<len(row)}
        def first(*keys):
            for k in keys:
                if mapping.get(k) not in (None,'','--','-'): return mapping[k]
            return None
        day=cls._iso_roc(first('日期','Date'))
        o=cls._num(first('開盤','開盤價','Open'))
        h=cls._num(first('最高','最高價','High'))
        l=cls._num(first('最低','最低價','Low'))
        c=cls._num(first('收盤','收盤價','Close'))
        v=cls._num(first('成交仟股','成交量(仟股)','TradingShares','成交股數'))
        if '成交仟股' in mapping or '成交量(仟股)' in mapping:
            v=None if v is None else v*1000.0
        if not day or None in (o,h,l,c): return None
        return {'date':day,'open':o,'high':h,'low':l,'close':c,'volume':v}

    @classmethod
    def _dict_row(cls,row):
        def first(*keys):
            for k in keys:
                if row.get(k) not in (None,'','--','-'): return row[k]
            return None
        day=cls._iso_roc(first('Date','日期'))
        o=cls._num(first('Open','OpeningPrice','開盤'))
        h=cls._num(first('High','HighestPrice','最高'))
        l=cls._num(first('Low','LowestPrice','最低'))
        c=cls._num(first('Close','ClosingPrice','收盤'))
        v=cls._num(first('TradingShares','TradeVolume','成交股數'))
        if not day or None in (o,h,l,c): return None
        return {'date':day,'open':o,'high':h,'low':l,'close':c,'volume':v}

    def history(self,exchange,ticker,range_name='1y'):
        if str(exchange).upper()!='TPEX': return []
        now=self.today()
        mapping={'1m':1,'3m':3,'6m':6,'1y':12,'3y':36,'5y':60}
        months=(now.month if str(range_name).lower()=='ytd' else mapping.get(str(range_name).lower(),12))
        rows=[]; seen=set()
        for i in range(months):
            month=self._months_back(now,i)
            params={'code':str(ticker),'date':month.strftime('%Y/%m/01')}
            try: payload=self.fetch_json(self.URL,params)
            except Exception: continue
            candidates=[]
            if isinstance(payload,dict):
                if isinstance(payload.get('data'),list):
                    candidates=[('dict',x,None) for x in payload['data'] if isinstance(x,dict)]
                for table in payload.get('tables') or []:
                    fields=table.get('fields') or table.get('columns') or []
                    for x in table.get('data') or []:
                        if isinstance(x,list): candidates.append(('list',x,fields))
                        elif isinstance(x,dict): candidates.append(('dict',x,None))
            for kind,row,fields in candidates:
                item=self._dict_row(row) if kind=='dict' else self._list_row(row,fields)
                if not item or item['date'] in seen: continue
                seen.add(item['date']); rows.append(item)
        rows.sort(key=lambda x:x['date'])
        return rows


class CompositeHistoryProvider:
    def __init__(self,twse,tpex): self.twse=twse; self.tpex=tpex
    def history(self,exchange,ticker,range_name='1y'):
        ex=str(exchange).upper()
        if ex=='TWSE': return self.twse.history(ex,ticker,range_name)
        if ex=='TPEX': return self.tpex.history(ex,ticker,range_name)
        return []
