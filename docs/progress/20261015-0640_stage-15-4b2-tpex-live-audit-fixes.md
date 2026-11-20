# StockMaster V3.1 Stage 15.4B2 — TPEx Live Audit Fixes

## Status
Complete in code/tests; re-run on user Mac recommended

## Goal
Use the user's live TPEx audit evidence to fix three runtime issues: premarket freshness misclassification, TPEx historical volume parsing, and misleading overall source-health readiness.

## Completed
- Premarket / market-session freshness now treats the previous completed trading-day close as current context until the close/publication window, rather than stale.
- 2026-10-15 06:26 with 2026-10-14 quote now returns `premarket_previous_close`, lag 0, with no stale warning.
- TPEx `tradingStock` history parser now accepts decorated/variant volume headers and uses the documented second-column volume position as a guarded fallback for recognized list rows.
- TPEx volume in `成交仟股` form is converted to shares by x1000.
- Source Health now remains `partial` while verified production cash-flow is still missing; it no longer reports overall `ready` with `cashflow=missing`.
- Build bumped to `15.4B2`; launcher and frontend build markers updated.

## Evidence from live audit
- User Mac confirmed TPEX identity/search/summary for 6488.
- 1M TPEx OHLC history returned successfully, but all volumes were null.
- 1Y TPEx technical indicators returned successfully.
- TPEx financials/news returned successfully.
- Source Health reported `overall=ready` while cashflow was missing, which was semantically inconsistent.

## Files Changed
- `stock-research-v31/backend/app/services/freshness.py`
- `stock-research-v31/backend/tests/test_freshness.py`
- `stock-research-v31/backend/app/providers/history_tpex.py`
- `stock-research-v31/backend/tests/test_tpex_history_provider.py`
- `stock-research-v31/backend/app/api/status.py`
- `stock-research-v31/backend/tests/test_source_health.py`
- `stock-research-v31/backend/app/config.py`
- `stock-research-v31/backend/tests/test_health.py`
- `stock-research-v31/StockMaster.command`
- `stock-research-v31/Stop_StockMaster.command`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/tests/integration.test.cjs`

## Verification
Fresh local verification after fixes:

- `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=backend pytest -q backend/tests` -> **78 passed**
- `node --test frontend/tests/*.test.cjs` -> **12 passed, 0 failed**
- `node --check frontend/js/*.js` -> PASS
- `bash -n install.command StockMaster.command Diagnose.command Stop_StockMaster.command Check_TPEx.command` -> PASS

## Decisions / Rulings
- Do not classify a previous-day close as stale before the current trading day's close exists.
- Keep stale detection after the close/publication window so a truly old quote still warns.
- Keep cashflow explicitly missing until a verified production cash-flow source is connected; no fabricated FCF.
- Treat TPEx live response shape as authoritative for parser hardening, not only fixture assumptions.

## Known Issues
- Cash-flow / FCF production source is still pending.
- A second Mac `Check_TPEx.command` run is recommended to confirm live TPEx volumes are now populated.
- News source-quality ranking is still a future refinement.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Draft PR: #4
- Build: `15.4B2`

## Next Stage
Run BUILD 15.4B2 on the user's Mac and repeat `Check_TPEx.command`. Confirm 6488 `history` has non-null volume and the 06:xx premarket summary has no stale warning. Then proceed to Stage 15.4C verified cash-flow / FCF source work.
