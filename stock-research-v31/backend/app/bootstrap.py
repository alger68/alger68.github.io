from datetime import datetime, timezone
from app.models.provider import ProviderResult
from app.providers.news import PublicNewsProvider
from app.providers.history_twse import TwseHistoryProvider
from app.providers.taishin_fugle import TaishinFugleProvider
from app.providers.taishin_nova import TaishinNovaProvider
from app.providers.tpex import TpexProvider
from app.providers.twse import TwseProvider
from app.services.http_client import JsonHttpClient
from app.services.directory import DirectoryService
from app.services.stock_service import StockService


class CompositeCompanyProvider:
    def __init__(self, official, private=None):
        self.official = official
        self.private = private

    def quote(self, ticker):
        if self.private and getattr(self.private, 'enabled', False):
            private_result = self.private.quote(ticker)
            if private_result.data is not None and not private_result.error:
                return private_result
        return self.official.quote(ticker)

    def revenue(self, ticker):
        return self.official.revenue(ticker)

    def valuation(self, ticker):
        return self.official.valuation(ticker)

    def financial_summary(self, ticker):
        return self.official.financial_summary(ticker)


class SummaryFinancialProvider:
    def __init__(self, provider_for_exchange):
        self.provider_for_exchange = provider_for_exchange

    def financials(self, exchange, ticker):
        income = self.provider_for_exchange(exchange).financial_summary(ticker)
        empty = lambda label: ProviderResult(source_name=label, fetched_at=datetime.now(timezone.utc), data=None, error='not_available')
        return {'income': income, 'balance': empty(income.source_name), 'cashflow': empty(income.source_name)}


class EmptyMarketProvider:
    checked_at = None

    def rows(self):
        return []

    def status(self):
        return {'enabled': False, 'provider': 'public_empty', 'connected': False}


class IndustryEnrichedMarketProvider:
    def __init__(self, provider, directory):
        self.provider = provider
        self.directory = directory

    @property
    def checked_at(self):
        return getattr(self.provider, 'checked_at', None)

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
    official = {'TWSE': TwseProvider(client), 'TPEX': TpexProvider(client)}
    nova = nova_provider or TaishinNovaProvider.from_env()
    legacy_private = TaishinFugleProvider.from_env()
    private = nova if nova.enabled else legacy_private
    directory = DirectoryService(client)

    def provider_for_exchange(exchange):
        ex = str(exchange).upper()
        if ex not in official:
            raise ValueError('invalid_exchange')
        return CompositeCompanyProvider(official[ex], private)

    app.state.stock_service = StockService(provider_for_exchange)
    app.state.directory_service = directory
    app.state.history_provider = TwseHistoryProvider()
    app.state.financial_provider = SummaryFinancialProvider(provider_for_exchange)
    app.state.news_provider = PublicNewsProvider(client)
    app.state.market_provider = IndustryEnrichedMarketProvider(nova, directory) if nova.enabled else EmptyMarketProvider()
    app.state.private_provider = nova
    return app
