from fastapi import APIRouter, Request

router=APIRouter(prefix='/api')


def _status(request: Request):
    market=getattr(request.app.state,'market_provider',None)
    private=getattr(request.app.state,'private_provider',None)
    market_status=market.status() if market and hasattr(market,'status') else {'connected':False,'provider':'unconfigured'}
    private_status=private.status() if private and hasattr(private,'status') else {'enabled':False,'connected':False,'provider':'taishin_nova'}
    public_ready=bool(market_status.get('connected')) or market_status.get('provider') in {'public_twse_tpex','fallback_market'}
    sources={
      'public_market':{'status':'ready' if public_ready else 'degraded','provider':market_status.get('provider'),'detail':market_status},
      'taishin_nova':{'status':'ready' if private_status.get('connected') else ('optional' if not private_status.get('enabled') else 'degraded'),'detail':private_status},
      'official_announcements':{'status':'ready' if getattr(request.app.state,'news_provider',None) else 'missing'},
      'recent_news':{'status':'ready' if getattr(request.app.state,'news_provider',None) else 'missing','provider':'Google News RSS + official disclosures'},
      'income_statement':{'status':'ready' if getattr(request.app.state,'financial_provider',None) else 'missing'},
      'cashflow':{'status':'missing','note':'FCF parser ready; verified production cash-flow source pending'},
      'history_twse':{'status':'ready' if getattr(request.app.state,'history_provider',None) else 'missing'},
      'history_tpex':{'status':'ready' if getattr(request.app.state,'history_provider',None) else 'missing','provider':'TPEx afterTrading/tradingStock'},
    }
    required=[sources['public_market'],sources['official_announcements'],sources['recent_news'],sources['income_statement'],sources['history_twse'],sources['history_tpex']]
    overall='ready' if all(x['status']=='ready' for x in required) else 'partial'
    return {'overall':overall,'sources':sources}

@router.get('/status/sources')
def source_status(request: Request):
    return _status(request)
