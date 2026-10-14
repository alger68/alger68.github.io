from fastapi import APIRouter, Request
from app.services.market_overview import build_market_overview
router=APIRouter(prefix='/api')
@router.get('/market/overview')
def market_overview(request:Request):
    p=getattr(request.app.state,'market_provider',None)
    rows=p.rows() if p else []
    checked=getattr(p,'checked_at',None) if p else None
    return build_market_overview(rows,checked)
