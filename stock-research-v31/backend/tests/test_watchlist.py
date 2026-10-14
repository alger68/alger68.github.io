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
