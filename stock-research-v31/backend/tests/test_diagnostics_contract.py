from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DIAG=ROOT/'Diagnose.command'


def test_diagnostics_reports_build_and_key_endpoints_without_secrets():
    text=DIAG.read_text(encoding='utf-8')
    for endpoint in ['/api/health','/api/market/overview','/api/watchlist','/api/stocks/2395/news?exchange=TWSE']:
        assert endpoint in text
    assert 'TAISHIN_PASSWORD' not in text
    assert 'TAISHIN_CERT_PASSWORD' not in text
