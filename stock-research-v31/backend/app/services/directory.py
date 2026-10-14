class DirectoryService:
    URLS={
      'TWSE':'https://openapi.twse.com.tw/v1/opendata/t187ap03_L',
      'TPEX':'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O',
    }
    def __init__(self,http): self.http=http; self._cache=None
    @staticmethod
    def _norm(v): return str(v or '').strip().lower().replace('臺','台').replace(' ','')
    def _load(self):
        if self._cache is not None:return self._cache
        out=[]
        for ex,url in self.URLS.items():
            try: rows=self.http.get_json(url)
            except Exception: rows=[]
            for r in rows:
                ticker=str(r.get('公司代號') or r.get('SecuritiesCompanyCode') or '').strip()
                name=str(r.get('公司簡稱') or r.get('公司名稱') or r.get('CompanyName') or '').strip()
                full=str(r.get('公司名稱') or name).strip()
                if ticker and name: out.append({'exchange':ex,'ticker':ticker,'name':name,'full_name':full})
        self._cache=out
        return out
    def search(self,q,limit=12):
        needle=self._norm(q)
        if not needle:return []
        scored=[]
        for x in self._load():
            ticker=self._norm(x['ticker']); name=self._norm(x['name']); full=self._norm(x['full_name'])
            if needle==ticker: score=0
            elif needle==name or needle==full: score=1
            elif ticker.startswith(needle): score=2
            elif needle in name or needle in full: score=3
            else: continue
            scored.append((score,x['ticker'],x))
        scored.sort(key=lambda z:(z[0],z[1]))
        return [x for _,_,x in scored[:limit]]
