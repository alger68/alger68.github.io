from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
CHECK=(ROOT/'Check_TPEx.command')


def test_tpex_check_script_exists_and_probes_full_otc_chain():
    assert CHECK.exists()
    text=CHECK.read_text(encoding='utf-8')
    for endpoint in [
        '/api/stocks/search?q=6488',
        '/api/stocks/6488/summary?exchange=TPEX',
        '/api/stocks/6488/history?exchange=TPEX&range=1m',
        '/api/stocks/6488/technicals?exchange=TPEX',
        '/api/stocks/6488/financials?exchange=TPEX',
        '/api/stocks/6488/news?exchange=TPEX',
    ]:
        assert endpoint in text
