from fastapi import APIRouter, HTTPException, Request
from app.services.technicals import technical_summary

router=APIRouter(prefix='/api')

@router.get('/stocks/{ticker}/history')
def history(ticker: str, request: Request, range: str='1y', exchange: str='TWSE'):
    p=getattr(request.app.state,'history_provider',None)
    if p is None: raise HTTPException(503,'history_provider_unconfigured')
    return {'ticker':ticker,'exchange':exchange,'range':range,'candles':p.history(exchange,ticker,range)}

@router.get('/stocks/{ticker}/technicals')
def technicals(ticker: str, request: Request, range: str='1y', exchange: str='TWSE'):
    p=getattr(request.app.state,'history_provider',None)
    if p is None: raise HTTPException(503,'history_provider_unconfigured')
    candles=p.history(exchange,ticker,range)
    return {'ticker':ticker,'exchange':exchange,'range':range,**technical_summary(candles)}
