# StockMaster V3.1 Stage 15.1 — Taishin Nova + Watchlist Fix

## Status
Partial — code verified; live user credential / certificate validation pending

## Goal
修正 Mac 實機驗收發現的三個缺口：市場總覽 production provider 為空、自選股只有顯示沒有互動、台新帳號行情尚未真正接入；在不暴露私密憑證的前提下，讓本機 FastAPI 優先使用台新 Nova 行情。

## Completed
- 根因確認：`bootstrap.py` 原本以 `EmptyMarketProvider()` 綁定 production market，因此市場總覽永遠是 0/0/0。
- 新增 `TaishinNovaProvider`，使用官方 `taishin_sdk` 登入、`init_realtime()`、intraday quote 與 TSE/OTC snapshot。
- 個股最新行情改成：台新 Nova 成功時優先；Nova 關閉/失敗時自動回退 TWSE/TPEx 官方行情。
- 市場總覽改成：Nova 啟用時讀 TSE + OTC EQUITY snapshot，計算 breadth/top movers；無資料時顯示 provider 狀態與原因，不再把 0/0 當正常市場資料。
- 新增 Nova status：enabled / connected / sanitized error；錯誤只保留 exception class，不含帳號、密碼、憑證密碼。
- 自選股前端新增：加入自選、點擊切換股票、移除自選；沿用本機 `data/watchlist.json`。
- 新增 `Configure_Taishin.command`，所有帳密/憑證路徑在 Mac 本機輸入，寫入 `.env` 並 chmod 600。
- `install.command` 會優先選 Python 3.12/3.11/3.10；偵測 `vendor/taishin_sdk*.whl` 並自動安裝。
- `.env.example`、`vendor/README.md`、Mac 安裝文件已更新。
- Dashboard 顯示 `台新 Nova：已連線` 或等待登入/行情連線，不再無聲顯示 0/0。

## Files Changed
- `stock-research-v31/backend/app/providers/taishin_nova.py`
- `stock-research-v31/backend/app/bootstrap.py`
- `stock-research-v31/backend/app/api/market.py`
- `stock-research-v31/backend/tests/test_taishin_nova.py`
- `stock-research-v31/.env.example`
- `stock-research-v31/install.command`
- `stock-research-v31/Configure_Taishin.command`
- `stock-research-v31/vendor/README.md`
- `stock-research-v31/docs/MAC_INSTALL.md`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/js/api.js`
- `stock-research-v31/frontend/js/dashboard.js`
- `stock-research-v31/frontend/css/app.css`
- `stock-research-v31/frontend/tests/integration.test.cjs`

## API / Interface Changes
- `GET /api/stocks/{ticker}/summary`: local mode may now return price source `Taishin Nova`; official provider remains fallback.
- `GET /api/market/overview`: adds `provider_status`, `source`, optional `warning`.
- Frontend API adds `addWatchlist(item)` and `deleteWatchlist(ticker, exchange)`.
- Local environment variables:
  - `TAISHIN_ID`
  - `TAISHIN_PASSWORD`
  - `TAISHIN_CERT_PATH`
  - `TAISHIN_CERT_PASSWORD`

## Data Sources
- 台新證券 Nova Python SDK (`taishin_sdk`)
- Nova intraday quote for individual stock price
- Nova snapshot quotes for `TSE` and `OTC` market breadth
- TWSE / TPEx official data remains source for monthly revenue, valuation and financial statement data and quote fallback

## Verification
### Backend
Command:
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=. pytest -q`

Observed result:
`45 passed`

### Frontend
Command:
`node --test tests/*.test.cjs`

Observed result:
`9 passed, 0 failed`

### Syntax / Shell
- all current frontend JS: `node --check` PASS
- `bash -n install.command` PASS
- `bash -n Configure_Taishin.command` PASS

### TDD evidence
- Nova provider initial RED: module missing / import failure.
- Nova provider unit GREEN: quote/date normalization, login/realtime initialization, TSE/OTC rows and secret-safe failure covered.
- Watchlist integration tests expanded to pin add/remove/click-to-load UI and Nova market source status.

## Decisions / Rulings
- Ruling: do not store Nova credentials in frontend or Git. All secrets live only in local `.env`, because browser/static deployment must never receive trading credentials.
- Ruling: keep financial data on TWSE/TPEx/MOPS rather than force Nova to become the only source; Nova is used primarily for fresher local market data.
- Ruling: if Nova fails, quote falls back to official data; market overview shows an explicit unavailable warning instead of inventing market values.
- Ruling: watchlist remains a local StockMaster watchlist for now; do not claim it is synced with a broker-side watchlist unless the Nova SDK exposes and verifies such an endpoint.

## Known Issues
- User's real Taishin account/login/.pfx has not been tested in this environment; live connection is still external validation.
- Official Taishin Nova Mac ARM64 wheel must be downloaded by the user and placed in `vendor/`; the wheel itself must not be redistributed by this project.
- Nova snapshot data does not provide a verified industry classification in the current adapter, so sector heatmap can fall into `其他`; real market breadth is available, but sector enrichment remains future work.
- Production news /重大訊息 provider remains separate and is not provided by this Nova market-data fix.
- Account positions/orders/trading are intentionally not implemented in this stage; this stage is read/query focused.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Draft PR: #4

## Next Stage
Run live validation on the user's Apple Silicon Mac using the official Nova Mac ARM64 wheel and local `Configure_Taishin.command`. Verify 2395 source shows `Taishin Nova`, market breadth is non-empty, and watchlist add/remove reacts. Keep PR Draft until this succeeds.
