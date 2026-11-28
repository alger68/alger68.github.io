def test_missing_keys_cleanly_disable_private_provider(monkeypatch):
    monkeypatch.delenv('TAISHIN_API_KEY',raising=False);monkeypatch.delenv('FUGLE_API_KEY',raising=False)
    from app.providers.taishin_fugle import TaishinFugleProvider
    p=TaishinFugleProvider.from_env()
    assert p.enabled is False
    assert p.status()=={'enabled':False,'provider':'taishin_fugle'}


def test_secrets_never_appear_in_status_or_repr(monkeypatch):
    monkeypatch.setenv('TAISHIN_API_KEY','TOPSECRET-TAISHIN')
    monkeypatch.setenv('FUGLE_API_KEY','TOPSECRET-FUGLE')
    from app.providers.taishin_fugle import TaishinFugleProvider
    p=TaishinFugleProvider.from_env(fetcher=lambda **kw:{'price':718})
    text=repr(p)+str(p.status())
    assert 'TOPSECRET' not in text
    assert p.enabled is True


def test_provider_router_prefers_enabled_private_then_falls_back():
    from app.providers.taishin_fugle import ProviderRouter
    class P:
        def __init__(self,enabled,name): self.enabled=enabled; self.name=name
    private=P(True,'private'); official=P(True,'official')
    assert ProviderRouter(private,official).active() is private
    private.enabled=False
    assert ProviderRouter(private,official).active() is official
