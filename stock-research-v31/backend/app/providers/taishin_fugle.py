import os
from datetime import datetime, timezone
from app.models.provider import ProviderResult

class TaishinFugleProvider:
    name='taishin_fugle'
    def __init__(self,taishin_key=None,fugle_key=None,fetcher=None):
        self._taishin_key=taishin_key or ''
        self._fugle_key=fugle_key or ''
        self.fetcher=fetcher
        self.enabled=bool(self._taishin_key and self._fugle_key)
    @classmethod
    def from_env(cls,fetcher=None):
        return cls(os.getenv('TAISHIN_API_KEY'),os.getenv('FUGLE_API_KEY'),fetcher)
    def __repr__(self):
        return f'<TaishinFugleProvider enabled={self.enabled}>'
    def status(self):
        return {'enabled':self.enabled,'provider':'taishin_fugle'}
    def quote(self,ticker):
        now=datetime.now(timezone.utc)
        if not self.enabled:
            return ProviderResult(source_name='Taishin/Fugle',fetched_at=now,data=None,error='private_provider_disabled')
        if self.fetcher is None:
            return ProviderResult(source_name='Taishin/Fugle',fetched_at=now,data=None,error='private_fetcher_unconfigured')
        data=self.fetcher(ticker=ticker,taishin_key=self._taishin_key,fugle_key=self._fugle_key)
        return ProviderResult(source_name='Taishin/Fugle',fetched_at=now,scope_hint='single_day',data=data)

class ProviderRouter:
    def __init__(self,private,official): self.private=private; self.official=official
    def active(self):
        return self.private if getattr(self.private,'enabled',False) else self.official
