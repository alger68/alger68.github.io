from datetime import datetime, timezone
from app.models.provider import ProviderResult
from app.providers.news import PublicNewsProvider
from app.providers.history_twse import TwseHistoryProvider
from app.providers.taishin_fugle import TaishinFugleProvider
from app.providers.tpex import TpexProvider
from app.providers.twse import TwseProvider
from app.services.http_client import JsonHttpClient
from app.services.stock_service import StockService

class CompositeCompanyProvider:
    def __init__(self, official, private=None):
        self.official=official
        self.private=private
    def quote(self,ticker):
        if self.private and getattr(self.private,'enabled',False):
            private_result=self.private.quote(ticker)
            if private_result.data is not None and not private_result.error:
                return private_result
        return self.official.quote(ticker)
    def revenue(self,ticker): return self.official.revenue(ticker)
    def valuation(self,ticker): return self.official.valuation(ticker)
    def financial_summary(self,ticker): return self.official.financial_summary(ticker)

class SummaryFinancialProvider:
    def __init__(self, provider_for_exchange): self.provider_for_exchange=provider_for_exchange
    def financials(self,exchange,ticker):
        income=self.provider_for_exchange(exchange).financial_summary(ticker)
        empty=lambda label: ProviderResult(source_name=label,fetched_at=datetime.now(timezone.utc),data=None,error='not_available')
        return {'income':income,'balance':empty(income.source_name),'cashflow':empty(income.source_name)}

class EmptyMarketProvider:
    checked_at=None
    def rows(self): return []

def configure_app(app,http=None):
    client=http or JsonHttpClient()
    official={'TWSE':TwseProvider(client),'TPEX':TpexProvider(client)}
    private=TaishinFugleProvider.from_env()
    def provider_for_exchange(exchange):
        ex=str(exchange).upper()
        if ex not in official: raise ValueError('invalid_exchange')
        return CompositeCompanyProvider(official[ex],private)
    app.state.stock_service=StockService(provider_for_exchange)
    app.state.history_provider=TwseHistoryProvider()
    app.state.financial_provider=SummaryFinancialProvider(provider_for_exchange)
    app.state.news_provider=PublicNewsProvider()
    app.state.market_provider=EmptyMarketProvider()
    return app
