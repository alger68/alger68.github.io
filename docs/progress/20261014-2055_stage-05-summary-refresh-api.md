# StockMaster V3.1 Stage 05 — Stock Summary + Refresh Job API

## Status
Complete

## Goal
建立個股 Summary / Price / Refresh Job API，將 Provider 資料轉為前端可直接使用的 JSON，並在 API 層保留 freshness、verification 與 warning。

## Completed
- 建立 `StockService.summary()` / `refresh()`。
- 建立 ROC 日期/月轉換。
- 建立 `/api/stocks/{ticker}/summary`。
- 建立 `/api/stocks/{ticker}/price`。
- 建立 `/api/stocks/{ticker}/refresh`。
- 建立 `/api/jobs/{job_id}`。
- 10/14 checked + 10/13 quote 在 API response 中保持 stale / 昨日收盤。
- `quarter_unspecified` EPS 於 summary 中保持 `verified=false`。

## Files Changed
- `stock-research-v31/backend/app/services/jobs.py`
- `stock-research-v31/backend/app/services/stock_service.py`
- `stock-research-v31/backend/app/api/__init__.py`
- `stock-research-v31/backend/app/api/stocks.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/tests/test_stock_summary_api.py`
- `stock-research-v31/backend/tests/test_refresh_jobs.py`

## API / Interface Changes
- `GET /api/stocks/search?q=`
- `GET /api/stocks/{ticker}/summary?exchange=TWSE`
- `GET /api/stocks/{ticker}/price?exchange=TWSE`
- `POST /api/stocks/{ticker}/refresh?exchange=TWSE`
- `GET /api/jobs/{job_id}`

## Data Sources
Consumes the official Provider interfaces from Stage 03 and Canonical/Freshness rules from Stage 04.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_stock_summary_api.py tests/test_refresh_jobs.py -q`
- Result before implementation: `2 failed` because `stock_service` did not exist.

GREEN + regression:
- Command: `PYTHONPATH=. pytest tests/test_stock_summary_api.py tests/test_refresh_jobs.py tests/test_verification.py tests/test_freshness.py tests/test_twse_provider.py tests/test_tpex_provider.py tests/test_provider_contract.py tests/test_github_snapshot_provider.py tests/test_health.py -q`
- Result: `14 passed`.

## Decisions / Rulings
- Refresh job store is in-memory for this stage; persistence is deferred because public/local refresh jobs are short-lived workflow state, not research history.
- `search` route exists as contract but currently returns an empty result set until the directory/search integration stage.
- Summary confidence at this stage is coverage-based; full scoring confidence is Stage 08.

## Known Issues
- StockService currently expects provider field names matching official TWSE/TPEx fixtures; additional aliases will be expanded as more provider fixtures are integrated.
- Search results are not yet connected to the existing directory.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `bdf7d78253a8cd2296f52984e3dbee1130267915`

## Next Stage
Stage 06 — Historical Prices + Technical Indicators.
