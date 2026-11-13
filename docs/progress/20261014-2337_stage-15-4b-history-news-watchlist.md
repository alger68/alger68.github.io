# StockMaster V3.1 Stage 15.4B — TPEx History + Recent News + Watchlist Decision

## Status
Complete in code/tests — external live-network validation on the user's Mac remains pending

## Goal
補齊 Stage 15.4A 後仍明顯不足的功能：TPEx 歷史 K 線/技術指標、近 30 日公司新聞、自選股 P/E / Decision，以及 FCF 解析器對常見現金流欄位與 CapEx 正負號的處理。

## Completed
- 新增 `TpexHistoryProvider`，使用 TPEx `afterTrading/tradingStock` 月資料，支援 1M / 3M / 6M / YTD / 1Y / 3Y / 5Y 聚合。
- 新增 `CompositeHistoryProvider`，TWSE 走既有 TWSE provider、TPEx 走新 TPEx provider。
- TPEx 歷史資料支援 `tables + fields + data` 與 dict row 兩種 JSON 形態；民國日期轉 ISO，成交仟股轉成股數。
- 新增 `RecentNewsProvider`，透過 Google News RSS 查詢股票代號 + 公司名稱的近 30 日公開新聞。
- 新增 `CompositeNewsProvider`：官方 TWSE/TPEx 每日重大訊息 + 近 30 日一般新聞合併後再交由既有 normalize/dedup 流程處理。
- 自選股 API 現在補 P/E、Decision state、quote date、price source；前端一列顯示代號、名稱、產業、價格、漲跌%、P/E、Decision。
- FCF parser 擴充 OCF / CapEx 常見中英文 aliases，並將明確標示為「現金流出」的正數 CapEx 正規化為負值後計算 FCF。
- Source Health 現在標示 `recent_news` 與 `history_tpex` ready。
- Build 升級為 `15.4B`；Mac launcher、frontend cache-busting、UI badge 全部一致。

## Files Changed
- `stock-research-v31/backend/app/providers/history_tpex.py`
- `stock-research-v31/backend/app/providers/news_recent.py`
- `stock-research-v31/backend/app/bootstrap.py`
- `stock-research-v31/backend/app/api/status.py`
- `stock-research-v31/backend/app/api/watchlist.py`
- `stock-research-v31/backend/app/services/financials.py`
- `stock-research-v31/backend/app/config.py`
- `stock-research-v31/StockMaster.command`
- `stock-research-v31/Stop_StockMaster.command`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/js/dashboard.js`
- `stock-research-v31/backend/tests/test_tpex_history_provider.py`
- `stock-research-v31/backend/tests/test_news.py`
- `stock-research-v31/backend/tests/test_watchlist.py`
- `stock-research-v31/backend/tests/test_financials.py`
- `stock-research-v31/backend/tests/test_source_health.py`
- `stock-research-v31/backend/tests/test_bootstrap.py`
- `stock-research-v31/backend/tests/test_health.py`
- `stock-research-v31/backend/tests/test_launcher_contract.py`
- `stock-research-v31/frontend/tests/integration.test.cjs`

## API / Interface Changes
- Existing `GET /api/stocks/{ticker}/history` can now return TPEx history through the composite provider.
- Existing `GET /api/stocks/{ticker}/technicals` can therefore calculate indicators for TPEx when sufficient history exists.
- Existing `GET /api/stocks/{ticker}/news` now combines official disclosures with recent 30-day RSS news.
- `GET /api/watchlist` adds `pe`, `decision`, `quote_date`, `price_source` per item where data is available.
- `GET /api/status/sources` adds/updates `recent_news` and `history_tpex` readiness.
- `/api/health` build is `15.4B`.

## Data Sources
- TPEx historical price: `https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock`
- TWSE history: existing TWSE `STOCK_DAY` provider.
- Official material announcements: TWSE/TPEx OpenAPI daily material announcements.
- Recent general news: Google News RSS search, query limited to public ticker/company-name terms; no private account data is sent.
- Financial income data remains TWSE/TPEx official source.

## Verification
Fresh verification run on 2026-10-14 23:37 +08:00 from the Stage 15.4B local working tree.

### Backend
Command:
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=backend pytest -q backend/tests`

Observed result:
`68 passed in 0.45s`

Note: the execution environment printed an unrelated spreadsheet-runtime warmup warning to stderr, but pytest exited `0` and reported 68 passed.

### Frontend
Command:
`node --test frontend/tests/*.test.cjs`

Observed result:
`12 passed, 0 failed`

### JavaScript syntax
Command:
`for f in frontend/js/*.js; do node --check "$f" || exit 1; done`

Observed result:
PASS / exit 0

### Shell syntax
Command:
`bash -n install.command && bash -n StockMaster.command && bash -n Diagnose.command && bash -n Stop_StockMaster.command`

Observed result:
PASS / exit 0

## Decisions / Rulings
- General news is additive; official material announcements remain the higher-confidence corporate-event source.
- Google News RSS is queried only from the FastAPI backend and receives only public ticker/name search terms.
- TPEx technical indicators must be derived only from real historical rows; insufficient rows remain unavailable rather than fabricated.
- Watchlist Decision remains deterministic/rule-first and can legitimately stay `INSUFFICIENT_DATA` when coverage is low.
- **FCF production source is NOT declared ready in this stage.** Only parsing/normalization logic is improved. Until a verified production cash-flow endpoint/dataset is wired, `cashflow` remains `missing` in Source Health and FCF may remain `—`.
- Do not invent a MOPS/OpenAPI cash-flow endpoint that has not been verified.

## Known Issues
- Live TPEx endpoint response shape still requires external Mac validation against the current public endpoint.
- Google News RSS availability/rate behavior is external and should fail closed to an empty list when unavailable.
- Balance sheet and verified production cash-flow source remain future work; FCF can only populate when a trusted cash-flow row is actually supplied.
- Taishin Nova remains optional; Stage 15.4B public features do not depend on Nova.
- Draft PR #4 remains unmerged.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Implementation/test head before this MARK: `fa315788c12a7a5b5ffdb6eb143adc8f77e23392`
- Draft PR: #4

## Next Stage
External Mac validation of BUILD 15.4B: confirm `/api/health` reports build `15.4B`, test a TPEx stock history/technicals, verify 2395 recent-news list and watchlist P/E/Decision. Then proceed to Stage 15.4C for verified balance-sheet/cash-flow integration only after the official source contract is confirmed.
