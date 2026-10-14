# StockMaster V3.1 Stage 15 — Release Verification

## Status
Partial — code/branch verification complete; external Mac / browser / Render validation pending

## Goal
對 V3.1 最新整合樹做完整回歸、啟動 contract、安全與資料邊界驗證，並只在有實證的範圍內宣告結果。

## Completed
- 修正 production app 未自動 bootstrap services 的整合缺口；RED 2 failed → GREEN 2 passed。
- 新增 TWSE 官方 `STOCK_DAY` 歷史 Provider；修正 `range` 參數遮蔽內建函式 bug 後通過。
- Dashboard history/news/watchlist/market 從 placeholder 改成實際 API wiring。
- 公司名稱搜尋接上 TWSE/TPEx 官方公司目錄，支援 `臺`/`台` 正規化。
- stale quote 2026-10-14 checked + 2026-10-13 quote → `stale`, lag 1, `昨日收盤`。
- 公開 snapshot fallback 固定顯示 warning，不冒充即時資料。
- release README / Mac guide / release checklist 完成。

## Verification
### Backend final suite
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=. pytest -q`

Observed: **41 passed in 4.30s**

### Frontend final suite
`node --test tests/*.test.cjs`

Observed: **7 passed, 0 failed**

### Syntax / static
- `frontend/js/*.js` → `node --check` PASS
- `bash -n install.command` PASS
- `bash -n StockMaster.command` PASS
- Responsive static DOM/CSS contract PASS
- private-key assignment scan PASS

### Freshness contracts
- 2026-10-14 checked + 2026-10-13 quote → `stale`, `lag_trading_days=1`, `昨日收盤`
- public snapshot fallback → warning tone + explicit snapshot message

## Data Sources
- TWSE company directory `t187ap03_L`
- TPEx company directory `mopsfin_t187ap03_O`
- TWSE `exchangeReport/STOCK_DAY` historical data
- existing TWSE/TPEx quote, revenue, valuation and financial sources from prior stages

## Decisions / Rulings
- Headless Chromium visual run was attempted, but the container Chromium process hung in its headless/DBus environment. Safari/mobile visual QA is **not claimed**; it remains external.
- Apple Silicon double-click behavior cannot be proven from this Linux sandbox. Launcher contract/shell syntax are green; real Mac validation remains external.
- Render config is committed only; no Render service has been created or deployed.
- TPEx historical adapter, production public news fetcher, and production market rows provider remain unavailable rather than replaced with synthetic data.

## Known Issues / External Validation
See `stock-research-v31/docs/RELEASE_CHECKLIST.md`:
- user Apple Silicon install/launch
- Safari 390px and desktop visual QA
- real Taishin/Fugle auth/fetcher
- Render provisioning if online mode is desired
- production news/market provider binding
- TPEx historical source if required

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Final implementation head before final MARK update: `e9b0f28a058e20b08da10db1ccac171b112261f9`

## Next Stage
External validation on the user's Mac, then PR review/merge decision. Do not merge to `main` until the user approves after reviewing these limitations.
