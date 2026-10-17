from fastapi import APIRouter, Request
from app.services.news import normalize_news

router=APIRouter(prefix='/api')

@router.get('/stocks/{ticker}/news')
def news(ticker: str, request: Request, exchange: str='TWSE'):
    p=getattr(request.app.state,'news_provider',None)
    rows=p.get(exchange,ticker) if p else []
    return {'ticker':ticker,'exchange':exchange,'items':normalize_news(rows)}
