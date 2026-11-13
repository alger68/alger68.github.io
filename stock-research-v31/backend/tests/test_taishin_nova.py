from app.providers.taishin_nova import TaishinNovaProvider


class Namespace:
    pass


class FakeSDK:
    def __init__(self):
        self.login_args = None
        self.realtime_account = None
        stock = Namespace()
        intraday = Namespace()
        intraday.quote = lambda **kwargs: {
            'date': '2026-10-14', 'exchange': 'TWSE', 'market': 'TSE',
            'symbol': '2395', 'name': '研華', 'openPrice': 708,
            'highPrice': 730, 'lowPrice': 702, 'closePrice': 721,
            'previousClose': 718,
        }
        snapshot = Namespace()
        snapshot.quotes = lambda market: {
            'date': '2026-10-14', 'time': '134500', 'market': market,
            'data': [
                {'type': 'EQUITY', 'symbol': '2395' if market == 'TSE' else '6488',
                 'name': '研華' if market == 'TSE' else '環球晶',
                 'lastPrice': 721 if market == 'TSE' else 500,
                 'changePercent': 1.2 if market == 'TSE' else -0.8,
                 'change': 8.5 if market == 'TSE' else -4, 'tradeVolume': 1000},
                {'type': 'INDEX', 'symbol': 'IX0001', 'name': '指數', 'changePercent': 0.5},
            ],
        }
        stock.intraday = intraday
        stock.snapshot = snapshot
        rest = Namespace(); rest.stock = stock
        marketdata = Namespace(); marketdata.rest_client = rest
        self.marketdata = marketdata

    def login(self, *args):
        self.login_args = args
        return ['ACC1']

    def init_realtime(self, account):
        self.realtime_account = account


def test_disabled_without_all_credentials():
    p = TaishinNovaProvider()
    assert p.enabled is False
    assert p.rows() == []
    assert p.quote('2395').error == 'private_provider_disabled'


def test_login_and_quote_normalizes_for_stock_service():
    fake = FakeSDK()
    p = TaishinNovaProvider('ID', 'PW', '/tmp/cert.pfx', 'CPW', sdk_factory=lambda: fake)
    r = p.quote('2395')
    assert fake.login_args == ('ID', 'PW', '/tmp/cert.pfx', 'CPW')
    assert fake.realtime_account == 'ACC1'
    assert r.data['Date'] == '1151014'
    assert r.data['ClosingPrice'] == 721
    assert r.data['OpeningPrice'] == 708
    assert r.source_name == 'Taishin Nova'


def test_market_rows_use_tse_and_otc_equities_only():
    fake = FakeSDK()
    p = TaishinNovaProvider('ID', 'PW', '/tmp/cert.pfx', 'CPW', sdk_factory=lambda: fake)
    rows = p.rows()
    assert [r['ticker'] for r in rows] == ['2395', '6488']
    assert rows[0]['change_pct'] == 1.2
    assert rows[1]['change_pct'] == -0.8
    assert p.checked_at is not None


def test_sdk_failure_returns_safe_error_without_secret_values():
    def boom():
        raise RuntimeError('login failed')
    p = TaishinNovaProvider('SECRETID', 'SECRETPW', '/tmp/cert.pfx', 'CERTSECRET', sdk_factory=boom)
    r = p.quote('2395')
    assert r.data is None
    assert r.error.startswith('taishin_nova_error:')
    assert 'SECRET' not in r.error
