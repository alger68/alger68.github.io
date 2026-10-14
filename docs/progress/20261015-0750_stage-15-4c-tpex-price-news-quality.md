# Stage 15.4C — TPEx price fallback + news quality

## Status
Complete in code/tests — live 3332 TPEx fallback validation pending.

## Goal
Fix the live-reported case where some TPEX stocks load successfully but the dashboard has no price, and reduce low-quality/noisy recent-news results.

## Completed
- Added TPEx quote fallback: use official daily close first; if the quote row is missing a usable close (`--`, blank, unsupported field), fall back to the latest TPEx historical candle.
- Fallback quote is explicitly labeled `TPEx History Fallback`; it is not presented as Nova or current intraday data.
- Added TPEx quote aliases: `ClosePrice` / `LastPrice`, `OpenPrice`, `HighPrice`, `LowPrice`.
- Extended `Check_TPEx.command` to probe `3332` in addition to `6488`.
- Recent news now requires ticker/company-name relevance.
- News sources are ranked: official MOPS > trusted financial media > research/broker sources > other > community.
- Community sources such as CMoney / 股市爆料 / LINE TODAY are demoted and capped to at most two items when higher-quality results are available.
- Build bumped to `15.4C` across backend health, launcher, frontend cache busting, and tests.

## Files Changed
- `stock-research-v31/backend/app/bootstrap.py`
- `stock-research-v31/backend/app/services/stock_service.py`
- `stock-research-v31/backend/app/providers/news_recent.py`
- `stock-research-v31/backend/app/services/news.py`
- `stock-research-v31/backend/app/config.py`
- `stock-research-v31/backend/tests/test_tpex_provider.py`
- `stock-research-v31/backend/tests/test_news.py`
- `stock-research-v31/backend/tests/test_health.py`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/tests/integration.test.cjs`
- `stock-research-v31/StockMaster.command`
- `stock-research-v31/Stop_StockMaster.command`
- `stock-research-v31/Check_TPEx.command`

## API / Interface Changes
No route changes.

Behavior change for `GET /api/stocks/{ticker}/summary?exchange=TPEX`:
- usable official daily close -> unchanged, source `TPEx`;
- no usable official close but historical close exists -> price populated from latest historical candle, source `TPEx History Fallback`.

`GET /api/stocks/{ticker}/news` now returns quality-ranked/relevance-filtered results and includes `quality` / `relevance` metadata in normalized items.

## Data Sources
- TPEx mainboard daily close quotes remain the primary TPEX quote source.
- TPEx `afterTrading/tradingStock` is the explicit fallback for the latest available close when the daily quote lacks a usable price.
- Official TWSE/TPEx MOPS disclosures remain highest-priority news.
- Google News RSS remains a discovery source for recent media, with local relevance and quality filtering.

## Verification
Fresh local verification after implementation:
- Backend: `81 passed`
- Frontend: `12 passed, 0 failed`
- `node --check frontend/js/*.js`: PASS
- `bash -n install.command StockMaster.command Diagnose.command Stop_StockMaster.command Check_TPEx.command`: PASS

TDD evidence:
- TPEx missing-close fallback test was RED before implementation, then GREEN.
- News quality ordering/relevance tests were RED before implementation, then GREEN.

## Decisions / Rulings
- Never fabricate a price. A fallback price must come from a real TPEx historical candle and disclose its fallback source.
- Do not treat community posts as equal to official disclosures or trusted financial media.
- Cash Flow / OCF / CapEx / FCF remains explicitly unavailable until a verified production source is integrated.

## Known Issues
- Live Mac validation is still required for the exact user-reported TPEX no-price case (notably 3332 from the prior server log).
- Balance sheet and cash-flow production providers remain incomplete.
- News ranking is heuristic; quality tiers may need additional source tuning from real usage.
- Taishin Nova remains optional and not live-validated with the user's credentials.

## Git
Branch: `feat/stockmaster-v31-fastapi-local`
Implementation head before this MARK: `cc419d56a9a5e9dd0d4923c3f21e8eb949418aae`
PR #4 remains Draft and unmerged.

## Next Stage
Run BUILD 15.4C on the user's Apple Silicon Mac and run `Check_TPEx.command`. Confirm `/api/stocks/3332/summary?exchange=TPEX` has a non-null price and source is either `TPEx` or `TPEx History Fallback`. Then proceed to Stage 15.4D: verified MOPS/XBRL cash-flow + balance-sheet integration for OCF / CapEx / FCF, preserving scope verification and no-fabrication rules.
