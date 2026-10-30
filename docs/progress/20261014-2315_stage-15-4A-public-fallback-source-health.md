# StockMaster V3.1 Stage 15.4A — Public Fallback + Source Health

## Status
Complete in code/tests — user Mac validation pending

## Goal
讓 StockMaster 在完全沒有台新 Nova 的情況下仍具備可用的市場總覽、自選股行情摘要與明確資料來源狀態，不再把 Nova 當成核心功能的單點依賴。

## Completed
- 新增 `PublicMarketProvider`：直接讀 TWSE `STOCK_DAY_ALL` 與 TPEx `tpex_mainboard_daily_close_quotes`。
- 公開市場 Provider 可從 close/change 計算 change_pct，並在單一交易所來源失敗時保留另一來源。
- 新增 `FallbackMarketProvider`：Nova 有資料時優先使用 Nova；Nova 未啟用/登入失敗/回空時，自動切換 TWSE/TPEx 公開市場資料。
- 公開市場資料同樣經過官方公司目錄產業分類 enrichment，因此產業熱力圖不需要 Nova 才能工作。
- 自選股 `GET /api/watchlist` 現在補入公司名稱、最新公開市場價格、漲跌幅、產業別。
- 新增 `GET /api/status/sources`，讓前端顯示公開市場、Nova、重大訊息、財報、cashflow、TWSE/TPEx history 的 ready/optional/degraded/missing 狀態。
- Dashboard 新增真正的「資料來源狀態」面板。
- BUILD ID 更新為 `15.4A`，launcher `/api/health`、前端 badge、cache-busting 版本一致。

## Files Changed
- `stock-research-v31/backend/app/providers/public_market.py`
- `stock-research-v31/backend/app/providers/fallback_market.py`
- `stock-research-v31/backend/app/api/status.py`
- `stock-research-v31/backend/app/api/watchlist.py`
- `stock-research-v31/backend/app/bootstrap.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/app/config.py`
- `stock-research-v31/StockMaster.command`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/js/api.js`
- `stock-research-v31/frontend/js/dashboard.js`
- `stock-research-v31/frontend/css/app.css`
- backend/frontend regression tests

## API / Interface Changes
- `GET /api/market/overview`: no longer depends exclusively on Nova; public TWSE/TPEx rows are fallback.
- `GET /api/watchlist`: enriched rows include `name`, `price`, `change_pct`, `sector`.
- `GET /api/status/sources`: new source-health endpoint.
- `/api/health`: build identity is `15.4A`.

## Data Sources
- TWSE `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`
- TPEx `https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes`
- existing official company directory data for industry enrichment
- Taishin Nova remains optional higher-priority local source when available

## Verification
Local Stage 15.3 package was patched to exact Stage 15.4A code and tested.

### Backend
Command:
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=backend pytest -q backend/tests`

Observed result:
`59 passed`

### Frontend
Command:
`node --test frontend/tests/*.test.cjs`

Observed result:
`11 passed, 0 failed`

### Syntax
- all frontend JS `node --check`: PASS
- `bash -n StockMaster.command`: PASS
- `bash -n install.command`: PASS

### TDD Evidence
Initial tests failed because `public_market`, `fallback_market`, `status` modules did not exist and watchlist returned only stored ticker/name fields. After implementation, focused tests and full suite passed.

## Decisions / Rulings
- Public TWSE/TPEx data is the baseline required service; Nova is an enhancement, not a prerequisite.
- Market overview must not display 0/0/0 solely because Nova is disabled.
- Source-health must explicitly expose still-missing capabilities instead of presenting a visually complete but non-functional dashboard.
- Cash flow/FCF and TPEx history remain visibly `missing` until Stage 15.4B rather than being inferred or fabricated.

## Known Issues
- `PublicMarketProvider` is close/latest-published official market data, not guaranteed intraday real-time.
- Watchlist currently adds price/change/sector but not P/E/Decision per row yet.
- Cash flow/FCF is still missing.
- TPEx historical K-line/technicals is still missing.
- News remains official same-day重大訊息 only; broader recent-news aggregation is Stage 15.4B.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Draft PR: #4
- Build: `15.4A`

## Next Stage
User Mac validation of BUILD 15.4A: verify market overview is populated without Nova, watchlist shows price/name/change/sector, and source-health shows which capabilities are ready or missing. Then proceed to Stage 15.4B: cashflow/FCF, recent news, TPEx history, and richer watchlist decision fields.
