from fastapi import APIRouter, Request
from app.services.market_overview import build_market_overview

router = APIRouter(prefix='/api')


@router.get('/market/overview')
def market_overview(request: Request):
    provider = getattr(request.app.state, 'market_provider', None)
    rows = provider.rows() if provider else []
    checked = getattr(provider, 'checked_at', None) if provider else None
    result = build_market_overview(rows, checked)
    status = provider.status() if provider and hasattr(provider, 'status') else {
        'enabled': False, 'provider': 'unconfigured', 'connected': False
    }
    result['provider_status'] = status
    result['source'] = status.get('provider')
    if not rows:
        result['warning'] = (
            '台新 Nova 尚未啟用或尚未成功登入，市場總覽暫無即時快照。'
            if status.get('provider') in ('taishin_nova', 'public_empty')
            else '市場資料來源目前無資料。'
        )
    return result
