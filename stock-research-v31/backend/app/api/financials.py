from fastapi import APIRouter, HTTPException, Request
from app.services.financials import build_financial_summary

router=APIRouter(prefix='/api')

@router.get('/stocks/{ticker}/financials')
def financials(ticker: str, request: Request, exchange: str='TWSE'):
    p=getattr(request.app.state,'financial_provider',None)
    if p is None: raise HTTPException(503,'financial_provider_unconfigured')
    raw=p.financials(exchange,ticker)
    inc=raw.get('income'); bal=raw.get('balance'); cf=raw.get('cashflow')
    if not inc or not inc.data: raise HTTPException(404,'financials_not_found')
    return build_financial_summary(inc.data,scope_hint=inc.scope_hint or 'quarter_unspecified',balance=bal.data if bal else None,cashflow=cf.data if cf else None)
