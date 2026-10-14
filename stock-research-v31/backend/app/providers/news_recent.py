from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus
import xml.etree.ElementTree as ET
import httpx

TRUSTED_SOURCES=('經濟日報','工商時報','鉅亨','TechNews','科技新報','自由時報','自由財經','ETtoday','Yahoo股市','Yahoo新聞','MoneyDJ','中央社','TVBS')
RESEARCH_SOURCES=('永豐金證券','優分析','UAnalyze','口袋證券','TradingView')
COMMUNITY_SOURCES=('CMoney','股市爆料','LINE TODAY')

def _quality(source,title):
    text=f'{source} {title}'
    if any(k in text for k in COMMUNITY_SOURCES): return 'community'
    if any(k in text for k in TRUSTED_SOURCES): return 'trusted'
    if any(k in text for k in RESEARCH_SOURCES): return 'research'
    return 'other'

def _relevance(title,ticker,name):
    t=str(title or '')
    ticker=str(ticker or '').strip(); name=str(name or '').strip()
    if ticker and ticker in t: return 3
    if name and (t.startswith(name) or f'{name}(' in t or f'{name}：' in t or f'{name}:' in t): return 3
    if name and name in t: return 2
    return 0

class RecentNewsProvider:
    BASE='https://news.google.com/rss/search'
    def __init__(self,fetch_text=None,now=lambda:datetime.now(timezone.utc)):
        self.fetch_text=fetch_text or self._fetch
        self.now=now

    def _fetch(self,url):
        r=httpx.get(url,headers={'Accept':'application/rss+xml, application/xml;q=0.9','User-Agent':'StockMasterAI/3.1'},timeout=15.0,follow_redirects=True)
        r.raise_for_status()
        return r.text

    def get(self,ticker,name,days=30):
        query=f'{str(ticker).strip()} {str(name).strip()} when:{int(days)}d'.strip()
        url=f'{self.BASE}?q={quote_plus(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
        try: root=ET.fromstring(self.fetch_text(url))
        except Exception: return []
        cutoff=self.now()-timedelta(days=int(days))
        out=[]
        for item in root.findall('.//item'):
            title=(item.findtext('title') or '').strip()
            link=(item.findtext('link') or '').strip()
            pub=(item.findtext('pubDate') or '').strip()
            source_node=item.find('source')
            source=(source_node.text or '').strip() if source_node is not None and source_node.text else 'Google News'
            if not title or not link: continue
            try:
                dt=parsedate_to_datetime(pub)
                if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
                dt=dt.astimezone(timezone.utc)
            except Exception:
                continue
            if dt<cutoff: continue
            relevance=_relevance(title,ticker,name)
            if relevance<=0: continue
            out.append({'source':source,'title':title,'published_at':dt.isoformat(),'category':'近期新聞','url':link,'quality':_quality(source,title),'relevance':relevance})
        return out


class CompositeNewsProvider:
    def __init__(self,official,recent,directory):
        self.official=official; self.recent=recent; self.directory=directory
    def get(self,exchange,ticker):
        out=[]
        try: out.extend(self.official.get(exchange,ticker) or [])
        except Exception: pass
        name=''
        try:
            hits=self.directory.search(ticker,12) if self.directory else []
            hit=next((x for x in hits if str(x.get('exchange')).upper()==str(exchange).upper() and str(x.get('ticker'))==str(ticker)),hits[0] if hits else None)
            name=(hit or {}).get('name') or ''
        except Exception: pass
        try: out.extend(self.recent.get(ticker,name,days=30) or [])
        except Exception: pass
        return out
