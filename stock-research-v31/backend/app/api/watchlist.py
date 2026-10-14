from pathlib import Path
from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.services.watchlist import JsonWatchlist

router=APIRouter(prefix='/api')
class WatchItem(BaseModel):
    exchange:str='TWSE'; ticker:str; name:str=''

def repo(request:Request):
    r=getattr(request.app.state,'watchlist_repo',None)
    if r is None:
        r=JsonWatchlist(Path(__file__).resolve().parents[3]/'data'/'watchlist.json')
        request.app.state.watchlist_repo=r
    return r

def _enrich(request, rows):
    market=getattr(request.app.state,'market_provider',None)
    directory=getattr(request.app.state,'directory_service',None)
    market_rows=[]
    try: market_rows=market.rows() if market else []
    except Exception: market_rows=[]
    market_map={(str(x.get('exchange') or '').upper(),str(x.get('ticker') or '')):x for x in market_rows}
    out=[]
    for row in rows:
        ex=str(row.get('exchange') or 'TWSE').upper(); ticker=str(row.get('ticker') or '')
        m=market_map.get((ex,ticker),{})
        name=str(row.get('name') or m.get('name') or '')
        industry=m.get('sector')
        if directory and (not name or not industry or industry=='其他'):
            try:
                hits=directory.search(ticker,1)
                hit=next((x for x in hits if x.get('exchange')==ex and x.get('ticker')==ticker),hits[0] if hits else {})
                name=name or hit.get('name') or ''
                industry=hit.get('industry') or industry
            except Exception: pass
        out.append({**row,'name':name,'price':m.get('price'),'change_pct':m.get('change_pct'),'sector':industry or '其他'})
    return out

@router.get('/watchlist')
def get_watchlist(request:Request): return {'items':_enrich(request,repo(request).list())}
@router.post('/watchlist')
def add_watchlist(item:WatchItem,request:Request): return repo(request).add(item.exchange,item.ticker,item.name)
@router.delete('/watchlist/{ticker}')
def delete_watchlist(ticker:str,request:Request,exchange:str='TWSE'):
    return {'items':_enrich(request,repo(request).remove(exchange,ticker))}
