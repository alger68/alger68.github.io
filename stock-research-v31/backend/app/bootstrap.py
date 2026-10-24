from datetime import datetime, timezone
from app.models.provider import ProviderResult
from app.providers.news import PublicNewsProvider
from app.providers.news_recent import RecentNewsProvider, CompositeNewsProvider
from app.providers.history_twse import TwseHistoryProvider
from app.providers.history_tpex import TpexHistoryProvider, CompositeHistoryProvider
from app.providers.taishin_fugle import TaishinFugleProvider
from app.providers.taishin_nova import TaishinNovaProvider
from app.providers.public_market import PublicMarketProvider
from app.providers.fallback_market import FallbackMarketProvider
from app.providers.tpex import TpexProvider
from app.providers.twse import TwseProvider
from app.services.http_client import JsonHttpClient
from app.services.directory import DirectoryService
from app.services.stock_service import StockService

class CompositeCompanyProvider:
    def __init__(self, official, private=None, history=None, exchange=None):
        self.official = official
        self.private = private
        self.history = history
        self.exchange = str(exchange or '').upper()
    @staticmethod
    def _usable_quote(result):
        if not result or not getattr(result, 'data', None): return False
        d=result.data or {}
        value=d.get('ClosingPrice') or d.get('Close') or d.get('ClosePrice') or d.get('LastPrice')
        try: float(str(value).replace(',',''))
        except Exception: return False
        return True
    @staticmethod
    def _roc_date(iso_date):
        try:
            y,m,d=[int(x) for x in str(iso_date).split('-')[:3]]
            return f'{y-1911:03d}{m:02d}{d:02d}'
        except Exception: return None
    def quote(self, ticker):
        if self.private and getattr(self.private, 'enabled', False):
            private_result = self.private.quote(ticker)
            if self._usable_quote(private_result) and not private_result.error:
                return private_result
        official_result=self.official.quote(ticker)
        if self._usable_quote(official_result):
            return official_result
        if self.history and self.exchange:
            try:
                rows=self.history.history(self.exchange,str(ticker),'1m') or []
                last=rows[-1] if rows else None
                if last and last.get('close') is not None:
                    data={
                        'Date':self._roc_date(last.get('date')),
                        'Close':last.get('close'),'Open':last.get('open'),'High':last.get('high'),'Low':last.get('low'),
                        'TradingShares':last.get('volume'),'SecuritiesCompanyCode':str(ticker),
                    }
                    return ProviderResult(source_name='TPEx History Fallback' if self.exchange=='TPEX' else 'History Fallback', fetched_at=datetime.now(timezone.utc), scope_hint='single_day', data=data)
            except Exception:
                pass
        return official_result
    def revenue(self, ticker): return self.official.revenue(ticker)
    def valuation(self, ticker): return self.official.valuation(ticker)
    def financial_summary(self, ticker): return self.official.financial_summary(ticker)

class SummaryFinancialProvider:
    def __init__(self, provider_for_exchange): self.provider_for_exchange = provider_for_exchange
    def financials(self, exchange, ticker):
        income = self.provider_for_exchange(exchange).financial_summary(ticker)
        empty = lambda label: ProviderResult(source_name=label, fetched_at=datetime.now(timezone.utc), data=None, error='not_available')
        return {'income': income, 'balance': empty(income.source_name), 'cashflow': empty(income.source_name)}

class EmptyMarketProvider:
    checked_at = None
    def rows(self): return []
    def status(self): return {'enabled': False, 'provider': 'public_empty', 'connected': False}

class IndustryEnrichedMarketProvider:
    def __init__(self, provider, directory):
        self.provider = provider
        self.directory = directory
    @property
    def checked_at(self): return getattr(self.provider, 'checked_at', None)
    def status(self):
        return self.provider.status() if hasattr(self.provider, 'status') else {'enabled': True, 'provider': 'market', 'connected': True}
    def rows(self):
        lookup = self.directory.industry_map()
        out = []
        for row in self.provider.rows() or []:
            key = (str(row.get('exchange') or '').upper(), str(row.get('ticker') or ''))
            meta = lookup.get(key) or {}
            out.append({**row, 'industry_code': meta.get('industry_code'), 'sector': meta.get('industry') or row.get('sector') or '其他'})
        return out

def configure_app(app, http=None, nova_provider=None):
    client = http or JsonHttpClient()
    twse_history=TwseHistoryProvider()
    tpex_history=TpexHistoryProvider()
    official = {'TWSE': TwseProvider(client), 'TPEX': TpexProvider(client)}
    nova = nova_provider or TaishinNovaProvider.from_env()
    legacy_private = TaishinFugleProvider.from_env()
    private = nova if nova.enabled else legacy_private
    directory = DirectoryService(client)
    def provider_for_exchange(exchange):
        ex = str(exchange).upper()
        if ex not in official: raise ValueError('invalid_exchange')
        return CompositeCompanyProvider(official[ex], private, history=tpex_history if ex=='TPEX' else None, exchange=ex)
    app.state.stock_service = StockService(provider_for_exchange)
    app.state.directory_service = directory
    app.state.history_provider = CompositeHistoryProvider(twse_history, tpex_history)
    app.state.history_tpex_provider = tpex_history
    app.state.financial_provider = SummaryFinancialProvider(provider_for_exchange)
    app.state.news_provider = CompositeNewsProvider(PublicNewsProvider(client), RecentNewsProvider(), directory)
    public_market = IndustryEnrichedMarketProvider(PublicMarketProvider(client), directory)
    app.state.market_provider = FallbackMarketProvider(IndustryEnrichedMarketProvider(nova, directory), public_market)
    app.state.private_provider = nova
    return app
