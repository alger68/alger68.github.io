INDUSTRY_NAMES={
 '01':'水泥工業','02':'食品工業','03':'塑膠工業','04':'紡織纖維','05':'電機機械','06':'電器電纜','08':'玻璃陶瓷','09':'造紙工業','10':'鋼鐵工業','11':'橡膠工業','12':'汽車工業','14':'建材營造','15':'航運業','16':'觀光餐旅','17':'金融保險','18':'貿易百貨','19':'綜合','20':'其他','21':'化學工業','22':'生技醫療','23':'油電燃氣業','24':'半導體業','25':'電腦及週邊設備業','26':'光電業','27':'通信網路業','28':'電子零組件業','29':'電子通路業','30':'資訊服務業','31':'其他電子業','32':'文化創意業','33':'農業科技','35':'綠能環保','36':'數位雲端','37':'運動休閒','38':'居家生活','80':'管理股票'
}

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
                name=str(r.get('公司簡稱') or r.get('公司名稱') or r.get('CompanyAbbreviation') or r.get('CompanyName') or '').strip()
                full=str(r.get('公司名稱') or r.get('CompanyName') or name).strip()
                industry_code=str(r.get('產業別') or r.get('SecuritiesIndustryCode') or '').strip().zfill(2) if (r.get('產業別') or r.get('SecuritiesIndustryCode')) not in (None,'') else ''
                industry=INDUSTRY_NAMES.get(industry_code, f'產業 {industry_code}' if industry_code else '其他')
                if ticker and name: out.append({'exchange':ex,'ticker':ticker,'name':name,'full_name':full,'industry_code':industry_code,'industry':industry})
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
    def industry_map(self):
        return {(x['exchange'],x['ticker']):{'industry_code':x['industry_code'],'industry':x['industry']} for x in self._load()}
