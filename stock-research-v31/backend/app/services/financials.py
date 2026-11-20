def _num(v):
    try: return float(str(v).replace(',',''))
    except Exception: return None

def _ratio(a,b):
    if a is None or b in (None,0): return None
    return a/b*100

def _first_num(row,*keys):
    for key in keys:
        if row.get(key) not in (None,'','--','-'):
            return _num(row.get(key))
    return None

def build_financial_summary(income, scope_hint='quarter_unspecified', balance=None, cashflow=None):
    income=income or {}; balance=balance or {}; cashflow=cashflow or {}
    year=income.get('年度') or income.get('Year')
    season=income.get('季別') or income.get('Season')
    period=f'{int(year)+1911}-Q{season}' if year and str(year).isdigit() and season else None
    revenue=_num(income.get('營業收入'))
    gross=_num(income.get('營業毛利（毛損）淨額') or income.get('營業毛利（毛損）'))
    op=_num(income.get('營業利益（損失）'))
    net=_num(income.get('本期淨利（淨損）'))
    eps=_num(income.get('基本每股盈餘（元）'))
    ocf=_first_num(cashflow,'營業活動之淨現金流入（流出）','營業活動之淨現金流量','NetCashFlowsFromUsedInOperatingActivities') if cashflow else None
    capex=_first_num(cashflow,'取得不動產、廠房及設備','取得不動產、廠房及設備之現金流出','AcquisitionOfPropertyPlantAndEquipment') if cashflow else None
    if capex is not None and cashflow.get('取得不動產、廠房及設備之現金流出') not in (None,'','--','-') and capex>0:
        capex=-capex
    fcf=(ocf+capex) if ocf is not None and capex is not None else None
    warnings=[]
    if not cashflow: warnings.append('cash_flow_unavailable')
    if scope_hint in {'quarter_unspecified','unknown',None}: warnings.append('eps_scope_unverified')
    return {
        'period':period,
        'scope':scope_hint,
        'revenue':revenue,
        'gross_margin':_ratio(gross,revenue),
        'operating_margin':_ratio(op,revenue),
        'net_margin':_ratio(net,revenue),
        'eps':{'value':eps,'verified':scope_hint not in {'quarter_unspecified','unknown',None}},
        'balance_sheet':balance or None,
        'ocf':ocf,
        'capex':capex,
        'fcf':fcf,
        'warnings':warnings,
    }
