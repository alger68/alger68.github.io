# StockMaster V3.1 Stage 10 — News / Events Aggregation

## Status
Complete

## Goal
建立可安全顯示公司新聞/事件的正規化層，處理 URL 驗證、去重、排序與空資料狀態。

## Completed
- 建立 `normalize_news()`。
- 僅接受 http/https 且無帳密的 URL。
- canonical URL 去重。
- 依 published_at 由新到舊排序。
- optional deterministic sentiment tag。
- 建立 `PublicNewsProvider` contract。
- 建立 `/api/stocks/{ticker}/news`。

## Files Changed
- `stock-research-v31/backend/app/services/news.py`
- `stock-research-v31/backend/app/providers/news.py`
- `stock-research-v31/backend/app/api/news.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/tests/test_news.py`

## API / Interface Changes
- `GET /api/stocks/{ticker}/news`
- `normalize_news(rows)`

## Data Sources
No specific external publisher hard-coded in Stage 10; provider is public-source contract only.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_news.py -q`
- Result before implementation: `2 failed` because news service did not exist.

GREEN + regression:
- Full backend regression through Stage 10.
- Result: `26 passed`.

## Decisions / Rulings
- News sentiment is deliberately small deterministic keyword tagging; no generative sentiment inference in this stage.
- Malformed and javascript URLs are discarded before reaching the frontend.

## Known Issues
- Real public news/feed adapters are not yet configured.
- Cross-publisher semantic duplicate detection is not implemented; exact canonical URL dedupe only.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `d34d7142fa6b1142e25b8cb4cc8847f8ba40caad`

## Next Stage
Stage 11 — Watchlist + Market Overview.
