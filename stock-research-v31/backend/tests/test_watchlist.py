import pytest


def test_watchlist_persists_and_rejects_invalid_identity(tmp_path):
    from app.services.watchlist import JsonWatchlist
    repo=JsonWatchlist(tmp_path/'watchlist.json')
    repo.add('TWSE','2395','研華')
    repo2=JsonWatchlist(tmp_path/'watchlist.json')
    assert repo2.list()[0]['ticker']=='2395'
    repo2.remove('TWSE','2395')
    assert repo2.list()==[]
    with pytest.raises(ValueError): repo.add('TWSE','../x','bad')


def test_watchlist_api_can_return_enriched_public_market_data(tmp_path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.api.watchlist import router
    from app.services.watchlist import JsonWatchlist
    app=FastAPI(); app.include_router(router)
    repo=JsonWatchlist(tmp_path/'watch.json'); repo.add('TWSE','2395','')
    app.state.watchlist_repo=repo
    class Dir:
        def search(self,q,limit=12): return [{'exchange':'TWSE','ticker':'2395','name':'研華','industry':'電腦及週邊設備業'}]
    class Market:
        def rows(self): return [{'exchange':'TWSE','ticker':'2395','name':'研華','price':718,'change_pct':-0.42,'sector':'電腦及週邊設備業'}]
    app.state.directory_service=Dir(); app.state.market_provider=Market()
    data=TestClient(app).get('/api/watchlist').json()['items'][0]
    assert data['name']=='研華'
    assert data['price']==718
    assert data['change_pct']==-0.42
    assert data['sector']=='電腦及週邊設備業'
