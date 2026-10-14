def test_ambiguous_quarter_eps_is_unverified_and_cashflow_missing_is_explicit():
    from app.services.financials import build_financial_summary
    income={'年度':'115','季別':'2','營業收入':'46511554','營業毛利（毛損）淨額':'17825064','營業利益（損失）':'8855775','本期淨利（淨損）':'7821490','基本每股盈餘（元）':'9.05'}
    r=build_financial_summary(income, scope_hint='quarter_unspecified', balance=None, cashflow=None)
    assert r['period']=='2026-Q2'
    assert r['eps']['value']==9.05
    assert r['eps']['verified'] is False
    assert r['gross_margin'] is not None
    assert r['operating_margin'] is not None
    assert r['ocf'] is None
    assert r['fcf'] is None
    assert 'cash_flow_unavailable' in r['warnings']


def test_verified_single_quarter_scope_allows_eps_verification():
    from app.services.financials import build_financial_summary
    income={'年度':'115','季別':'2','營業收入':'1000','營業毛利（毛損）淨額':'400','營業利益（損失）':'200','本期淨利（淨損）':'150','基本每股盈餘（元）':'2.5'}
    cash={'營業活動之淨現金流入（流出）':'300','取得不動產、廠房及設備':'-100'}
    r=build_financial_summary(income,scope_hint='single_quarter',cashflow=cash)
    assert r['eps']['verified'] is True
    assert r['ocf']==300.0
    assert r['fcf']==200.0
