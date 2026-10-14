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

@router.get('/watchlist')
def get_watchlist(request:Request): return {'items':repo(request).list()}
@router.post('/watchlist')
def add_watchlist(item:WatchItem,request:Request): return repo(request).add(item.exchange,item.ticker,item.name)
@router.delete('/watchlist/{ticker}')
def delete_watchlist(ticker:str,request:Request,exchange:str='TWSE'):
    return {'items':repo(request).remove(exchange,ticker)}
