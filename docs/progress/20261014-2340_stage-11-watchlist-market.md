# StockMaster V3.1 Stage 11 — Watchlist + Market Overview

## Status
Complete

## Goal
建立本機自選股持久化與市場總覽資料模型，支援 breadth、漲跌幅排行與產業熱力圖資料。

## Completed
- 建立 JSON watchlist repository。
- exchange+ticker identity 驗證。
- 建立 Watchlist GET/POST/DELETE API。
- 建立 market breadth / top gainers / top losers / sector average。
- 建立 `/api/market/overview`。

## Files Changed
- `stock-research-v31/backend/app/services/watchlist.py`
- `stock-research-v31/backend/app/services/market_overview.py`
- `stock-research-v31/backend/app/api/watchlist.py`
- `stock-research-v31/backend/app/api/market.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/tests/test_watchlist.py`
- `stock-research-v31/backend/tests/test_market_overview.py`

## API / Interface Changes
- `GET/POST /api/watchlist`
- `DELETE /api/watchlist/{ticker}`
- `GET /api/market/overview`

## Data Sources
Market overview consumes a provider rows contract; production snapshot adapter is deferred to deployment integration.

## Verification
RED:
- `pytest tests/test_watchlist.py tests/test_market_overview.py -q` → `2 failed` before implementation.

GREEN + regression:
- Full backend suite through Stage 11 → `28 passed`.

## Decisions / Rulings
- Watchlist uses local JSON behind a repository class; migration to DB later does not change API.
- Market overview silently drops rows without valid numeric change_pct instead of fabricating zero.

## Known Issues
- Public market provider not yet wired into app startup.
- Watchlist enrichment with live score/decision is a later integration step.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `fded84961e032f7d900bbcd3f9dfb73c90fb254e`

## Next Stage
Stage 12 — Private Local Taishin/Fugle Provider.
