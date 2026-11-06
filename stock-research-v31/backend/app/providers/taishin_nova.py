import os
from datetime import datetime, timezone
from app.models.provider import ProviderResult


def _roc_date(iso_date):
    try:
        y, m, d = map(int, str(iso_date).split('-'))
        return f'{y - 1911:03d}{m:02d}{d:02d}'
    except Exception:
        return None


class TaishinNovaProvider:
    name = 'taishin_nova'

    def __init__(self, user_id=None, password=None, cert_path=None, cert_password=None, sdk_factory=None):
        self._user_id = user_id or ''
        self._password = password or ''
        self._cert_path = cert_path or ''
        self._cert_password = cert_password or ''
        self._sdk_factory = sdk_factory
        self._sdk = None
        self._stock = None
        self.enabled = all([self._user_id, self._password, self._cert_path, self._cert_password])
        self.checked_at = None
        self.last_error = None

    @classmethod
    def from_env(cls, sdk_factory=None):
        return cls(
            os.getenv('TAISHIN_ID'),
            os.getenv('TAISHIN_PASSWORD'),
            os.getenv('TAISHIN_CERT_PATH'),
            os.getenv('TAISHIN_CERT_PASSWORD'),
            sdk_factory=sdk_factory,
        )

    def __repr__(self):
        return f'<TaishinNovaProvider enabled={self.enabled} connected={self._stock is not None}>'

    def status(self):
        return {
            'enabled': self.enabled,
            'provider': 'taishin_nova',
            'connected': self._stock is not None,
            'error': self.last_error,
        }

    def _connect(self):
        if self._stock is not None:
            return self._stock
        if not self.enabled:
            raise RuntimeError('private_provider_disabled')
        if self._sdk_factory:
            factory = self._sdk_factory
        else:
            from taishin_sdk import TaishinSDK
            factory = TaishinSDK
        sdk = factory()
        accounts = sdk.login(self._user_id, self._password, self._cert_path, self._cert_password)
        if not accounts:
            raise RuntimeError('no_account')
        sdk.init_realtime(accounts[0])
        self._sdk = sdk
        self._stock = sdk.marketdata.rest_client.stock
        self.last_error = None
        return self._stock

    def _safe_error(self, exc):
        self.last_error = f'{exc.__class__.__name__}'
        return f'taishin_nova_error:{self.last_error}'

    def quote(self, ticker):
        now = datetime.now(timezone.utc)
        if not self.enabled:
            self.last_error = 'private_provider_disabled'
            return ProviderResult(source_name='Taishin Nova', fetched_at=now, data=None, error='private_provider_disabled')
        try:
            raw = self._connect().intraday.quote(symbol=str(ticker))
            data = {
                'Date': _roc_date(raw.get('date')),
                'Code': str(raw.get('symbol') or ticker),
                'Name': raw.get('name'),
                'OpeningPrice': raw.get('openPrice'),
                'HighestPrice': raw.get('highPrice'),
                'LowestPrice': raw.get('lowPrice'),
                'ClosingPrice': raw.get('closePrice') if raw.get('closePrice') is not None else raw.get('lastPrice'),
                'PreviousClose': raw.get('previousClose'),
                'Exchange': raw.get('exchange'),
                'Market': raw.get('market'),
            }
            self.last_error = None
            return ProviderResult(source_name='Taishin Nova', fetched_at=now, scope_hint='single_day', data=data)
        except Exception as exc:
            return ProviderResult(
                source_name='Taishin Nova',
                fetched_at=now,
                data=None,
                error=self._safe_error(exc),
            )

    def rows(self):
        if not self.enabled:
            self.last_error = 'private_provider_disabled'
            return []
        try:
            stock = self._connect()
            rows = []
            for market in ('TSE', 'OTC'):
                payload = stock.snapshot.quotes(market=market) or {}
                for item in payload.get('data') or []:
                    if item.get('type') != 'EQUITY':
                        continue
                    rows.append({
                        'exchange': 'TWSE' if market == 'TSE' else 'TPEX',
                        'market': market,
                        'ticker': str(item.get('symbol') or ''),
                        'symbol': str(item.get('symbol') or ''),
                        'name': item.get('name') or '',
                        'price': item.get('lastPrice') if item.get('lastPrice') is not None else item.get('closePrice'),
                        'change': item.get('change'),
                        'change_pct': item.get('changePercent'),
                        'volume': item.get('tradeVolume'),
                        'sector': item.get('industry') or '其他',
                    })
            self.checked_at = datetime.now(timezone.utc).isoformat()
            self.last_error = None
            return rows
        except Exception as exc:
            self.checked_at = datetime.now(timezone.utc).isoformat()
            self._safe_error(exc)
            return []
