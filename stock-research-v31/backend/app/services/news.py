from urllib.parse import urlparse

POSITIVE=('成長','上修','創高','獲利','訂單增加')
NEGATIVE=('下修','衰退','虧損','裁員','延後')

def _sentiment(title):
    t=str(title or '')
    if any(k in t for k in POSITIVE): return 'positive'
    if any(k in t for k in NEGATIVE): return 'negative'
    return None

def _valid_url(url):
    try:
        u=urlparse(str(url))
        return u.scheme in {'http','https'} and bool(u.netloc) and not u.username and not u.password
    except Exception:
        return False

def normalize_news(rows):
    seen=set(); out=[]
    for r in rows or []:
        url=str(r.get('url') or '').strip()
        if not _valid_url(url) or url in seen: continue
        seen.add(url)
        title=str(r.get('title') or '').strip()
        if not title: continue
        item={'source':str(r.get('source') or ''),'title':title,'published_at':r.get('published_at'),'category':str(r.get('category') or 'news'),'canonical_url':url,'sentiment':_sentiment(title)}
        out.append(item)
    out.sort(key=lambda x:str(x.get('published_at') or ''),reverse=True)
    return out
