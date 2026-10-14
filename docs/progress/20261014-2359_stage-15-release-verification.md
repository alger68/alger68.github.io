# StockMaster V3.1 Stage 15 — Release Verification

## Status
Partial — code/branch verification complete; external Mac / browser / Render validation pending

## Goal
對 V3.1 最新整合樹做完整回歸、啟動 contract、安全與資料邊界驗證，並只在有實證的範圍內宣告結果。

## Completed
- 最終 review 發現並修正 production app 未自動 bootstrap services 的整合缺口。
- 新增 production bootstrap regression；RED 2 failed → GREEN 2 passed。
- 新增 TWSE 官方 `STOCK_DAY` 歷史 Provider；RED 2 failed，第一次 GREEN 嘗試抓到 `range` 參數遮蔽內建函式 bug，定位並修正後通過。
- Dashboard history/news/watchlist/market 從 placeholder 改成實際 API wiring；RED 2 failed → GREEN。
- 公司名稱搜尋從空路由改成 TWSE/TPEx 官方公司目錄；支援 `臺`/`台` 正規化；backend/frontend RED→GREEN。
- stale quote 2026-10-14 checked + 2026-10-13 quote 再驗證為 `stale`, lag 1, `昨日收盤`。
- release README / Mac guide / release checklist 完成。

## Files Changed in Final Fix Pass
- `stock-research-v31/backend/app/bootstrap.py`
- `stock-research-v31/backend/app/providers/history_twse.py`
- `stock-research-v31/backend/app/services/directory.py`
- `stock-research-v31/backend/app/api/stocks.py`
- `stock-research-v31/backend/tests/test_bootstrap.py`
- `stock-research-v31/backend/tests/test_twse_history_provider.py`
- `stock-research-v31/backend/tests/test_directory_search.py`
- `stock-research-v31/frontend/js/api.js`
- `stock-research-v31/frontend/js/dashboard.js`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/tests/integration.test.cjs`
- `stock-research-v31/README.md`
- `stock-research-v31/docs/RELEASE_CHECKLIST.md`

## API / Interface Changes
- Production FastAPI app now calls `configure_app(app)` during import/startup.
- `GET /api/stocks/search?q=` now searches official company directories.
- `GET /api/stocks/{ticker}/history` is wired to official TWSE monthly history for TWSE equities.
- Frontend loads Search / Summary / History / Technicals / Financials / Decision / News / Watchlist / Market API contracts.

## Data Sources
- TWSE OpenAPI company directory `t187ap03_L`.
- TPEx OpenAPI company directory `mopsfin_t187ap03_O`.
- TWSE official `exchangeReport/STOCK_DAY` monthly historical data.
- Existing TWSE/TPEx quote, revenue, valuation and financial sources from prior stages.

## Verification
### Backend final suite
Command:
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=. pytest -q`

Observed result:
`41 passed in 3.04s`

### Frontend final suite
Command:
`node --test tests/*.test.cjs`

Observed result:
`6 passed, 0 failed`

### Syntax / static
- All `frontend/js/*.js` → `node --check` PASS.
- `bash -n install.command` PASS.
- `bash -n StockMaster.command` PASS.
- Responsive static DOM/CSS contract PASS (`@media(max-width:640px)`, `overflow-x:hidden`, required panel IDs).
- Private-key assignment scan PASS; real credentials not found in source tree.

### FastAPI smoke
- `/api/health` exact response verified.
- `/` serves StockMaster V3.1 HTML.
- News / market empty-state routes verified without crash.
- Production app-state bootstrap existence covered by regression test.

### Stale quote regression
Observed:
`{'freshness':'stale','lag_trading_days':1,'label':'昨日收盤','quote_date':'2026-10-13','checked_at':'2026-10-14T17:29:00+08:00',...}`

## Decisions / Rulings
- Headless Chromium visual run was attempted in the container, but the container Chromium process hung on its headless/DBus environment. No claim is made that Safari/mobile visual QA passed. Static responsive contract is green; actual visual QA remains external.
- A real Apple Silicon double-click run cannot be proven from this Linux sandbox. Launcher tests/shell syntax are green, but Mac validation remains external.
- Render config is code-complete only; no external Render service is created automatically during implementation.
- TPEx historical adapter, live public news fetcher, and production market rows provider remain explicitly unavailable rather than replaced with synthetic data.

## Known Issues / External Validation
See `stock-research-v31/docs/RELEASE_CHECKLIST.md`. Required before production merge/deployment:
- user's Apple Silicon install/launch test;
- Safari mobile/desktop visual QA;
- real Taishin/Fugle auth/fetcher test;
- Render service provisioning if online mode is desired;
- production market/news provider binding;
- TPEx historical source if required.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Final implementation head before MARK/docs bookkeeping: `adb04e47318995ba04cab8a82673467af517ab94`

## Next Stage
External validation on the user's Mac, then PR review/merge decision. Do not merge to `main` until the user approves after reviewing these limitations.
