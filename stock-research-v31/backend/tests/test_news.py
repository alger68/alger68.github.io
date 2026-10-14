def test_news_deduplicates_and_rejects_bad_urls():
    from app.services.news import normalize_news
    rows=[
      {'title':'研華 9 月營收成長','url':'https://example.com/a','published_at':'2026-10-14T08:00:00+08:00','source':'Example','category':'revenue'},
      {'title':'duplicate','url':'https://example.com/a','published_at':'2026-10-14T07:00:00+08:00','source':'Example','category':'news'},
      {'title':'bad','url':'javascript:alert(1)','published_at':'2026-10-14T09:00:00+08:00','source':'Bad','category':'news'},
    ]
    out=normalize_news(rows)
    assert len(out)==1
    assert out[0]['canonical_url']=='https://example.com/a'
    assert out[0]['category']=='revenue'

def test_no_news_is_empty_list_not_error():
    from app.services.news import normalize_news
    assert normalize_news([])==[]

class FakeHttp:
    def __init__(self, rows): self.rows=rows; self.calls=[]
    def get_json(self, url): self.calls.append(url); return self.rows

def test_official_twse_announcements_filter_ticker_and_normalize_roc_timestamp():
    from app.providers.news import PublicNewsProvider
    http=FakeHttp([
      {'發言日期':'115/10/14','發言時間':'13:45:20','公司代號':'2395','公司名稱':'研華','主旨':'公告本公司董事會決議','符合條款':'第12款','事實發生日':'115/10/14','說明':'測試'},
      {'發言日期':'115/10/14','發言時間':'13:40:00','公司代號':'2330','公司名稱':'台積電','主旨':'其他公司公告'},
    ])
    rows=PublicNewsProvider(http).get('TWSE','2395')
    assert len(rows)==1
    assert rows[0]['source']=='TWSE MOPS'
    assert rows[0]['published_at']=='2026-10-14T13:45:20+08:00'
    assert rows[0]['title']=='公告本公司董事會決議'
    assert 'co_id=2395' in rows[0]['url']

def test_official_tpex_announcements_support_english_openapi_fields():
    from app.providers.news import PublicNewsProvider
    http=FakeHttp([
      {'Date':'1151014','Time':'091500','SecuritiesCompanyCode':'6488','CompanyName':'GlobalWafers','Subject':'公告重大訊息','Clause':'12','DateOfOccurrence':'1151014','Description':'detail'},
    ])
    rows=PublicNewsProvider(http).get('TPEX','6488')
    assert len(rows)==1
    assert rows[0]['source']=='TPEx MOPS'
    assert rows[0]['published_at']=='2026-10-14T09:15:00+08:00'

def test_official_announcement_provider_fails_closed_when_source_unavailable():
    from app.providers.news import PublicNewsProvider
    class Broken:
        def get_json(self,url): raise RuntimeError('offline')
    assert PublicNewsProvider(Broken()).get('TWSE','2395')==[]

RSS='''<?xml version="1.0" encoding="UTF-8"?>
<rss><channel>
<item><title>研華 AI 邊緣運算新品發表 - 經濟日報</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Tue, 13 Oct 2026 08:00:00 GMT</pubDate><source url="https://money.udn.com">經濟日報</source></item>
<item><title>太舊新聞</title><link>https://news.google.com/rss/articles/old</link><pubDate>Mon, 01 Sep 2026 08:00:00 GMT</pubDate><source>舊來源</source></item>
</channel></rss>'''

def test_recent_news_provider_parses_rss_and_filters_30_days():
    from datetime import datetime, timezone
    from app.providers.news_recent import RecentNewsProvider
    seen=[]
    def fetch(url): seen.append(url); return RSS
    p=RecentNewsProvider(fetch_text=fetch, now=lambda:datetime(2026,10,14,0,0,tzinfo=timezone.utc))
    rows=p.get('2395','研華',days=30)
    assert len(rows)==1
    assert rows[0]['source']=='經濟日報'
    assert rows[0]['category']=='近期新聞'
    assert rows[0]['published_at'].startswith('2026-10-13T08:00:00')
    assert '2395' in seen[0] and '%E7%A0%94%E8%8F%AF' in seen[0]


def test_composite_news_combines_official_and_recent_without_failure():
    from app.providers.news_recent import CompositeNewsProvider
    class Official:
        def get(self,e,t): return [{'title':'重大訊息','url':'https://mops.twse.com.tw/x','source':'TWSE MOPS'}]
    class Recent:
        def get(self,t,name,days=30): return [{'title':'近期新聞','url':'https://news.example/x','source':'媒體'}]
    class Directory:
        def search(self,q,limit=12): return [{'ticker':'2395','exchange':'TWSE','name':'研華'}]
    rows=CompositeNewsProvider(Official(),Recent(),Directory()).get('TWSE','2395')
    assert [r['title'] for r in rows]==['重大訊息','近期新聞']
