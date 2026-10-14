from fastapi import APIRouter, Request, HTTPException
from app.services.scoring import score_company
from app.services.valuation import scenario, valuation_range
from app.services.decision import decide

router=APIRouter(prefix='/api')

@router.get('/stocks/{ticker}/valuation')
def valuation(ticker: str, request: Request, exchange: str='TWSE'):
    svc=getattr(request.app.state,'stock_service',None)
    if svc is None: raise HTTPException(503,'stock_service_unconfigured')
    s=svc.summary(exchange,ticker)
    price=(s.get('price') or {}).get('price')
    eps=(s.get('eps') or {}).get('value')
    if not (s.get('eps') or {}).get('verified') or eps is None:
        return {'available':False,'reason':'verified_eps_unavailable'}
    base_pe=((s.get('valuation') or {}).get('pe')) or 18
    base=scenario(eps,base_pe,'Base','verified_actual')
    bear=scenario(eps,base_pe*0.8,'Bear','internal_sensitivity')
    bull=scenario(eps,base_pe*1.2,'Bull','internal_sensitivity')
    return {'available':True,**valuation_range(bear,base,bull,price)}

@router.get('/stocks/{ticker}/decision')
def decision(ticker: str, request: Request, exchange: str='TWSE', asset: str='個股'):
    svc=getattr(request.app.state,'stock_service',None)
    if svc is None: raise HTTPException(503,'stock_service_unconfigured')
    s=svc.summary(exchange,ticker)
    metrics={}
    if s.get('revenue') and s['revenue'].get('yoy') is not None: metrics['growth']=max(0,min(1,(s['revenue']['yoy']+20)/80))
    if s.get('valuation') and s['valuation'].get('pe'): metrics['valuation']=max(0,min(1,(50-s['valuation']['pe'])/40))
    score=score_company(asset,metrics)
    return {'score':score,'decision':decide(score,None,False,asset)}
