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
