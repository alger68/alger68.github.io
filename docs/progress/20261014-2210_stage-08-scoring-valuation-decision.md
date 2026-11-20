# StockMaster V3.1 Stage 08 — Scoring + Valuation + Rule-first Decision

## Status
Complete

## Goal
建立固定 100 分權重、透明 Bear/Base/Bull 估值與 rule-first Decision，並讓低信心與 ETF 不會誤進公司買賣判斷。

## Completed
- 固定權重：quality 20 / growth 20 / financial 20 / valuation 20 / momentum 10 / risk 10。
- 建立 `scenario()` / `valuation_range()`。
- 保留 `source_type`，internal sensitivity 不冒充 consensus。
- 建立 `decide()` 與 Decision enum 行為。
- 高分但估值 gate 不過 → WATCH。
- 低 confidence → INSUFFICIENT_DATA。
- ETF → company decision unsupported。
- 建立 valuation / decision API routes。

## Files Changed
- `stock-research-v31/backend/app/services/scoring.py`
- `stock-research-v31/backend/app/services/valuation.py`
- `stock-research-v31/backend/app/services/decision.py`
- `stock-research-v31/backend/app/api/decision.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/tests/test_scoring.py`
- `stock-research-v31/backend/tests/test_valuation.py`
- `stock-research-v31/backend/tests/test_decision.py`

## API / Interface Changes
- `GET /api/stocks/{ticker}/valuation`
- `GET /api/stocks/{ticker}/decision`
- `score_company(asset, metrics)`
- `scenario(eps, pe, label, source_type)`
- `valuation_range(...)`
- `decide(score, valuation, risk, asset)`

## Data Sources
Consumes verified summary / financial / technical data from previous stages.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_scoring.py tests/test_valuation.py tests/test_decision.py -q`
- Result before implementation: `5 failed` because scoring/valuation/decision modules did not exist.

GREEN + regression:
- Full backend regression through Stage 08.
- Result: `24 passed`.

## Decisions / Rulings
- Missing category data lowers confidence instead of being scored as zero-quality fact.
- Decision is deterministic and generated before any future LLM narrative.
- Base valuation in API is unavailable when EPS is not verified.

## Known Issues
- Current decision API only maps a subset of summary fields into category metrics; full category construction will expand as dashboard/data modules mature.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `214c9bb0cb61730ddda061576f5934dff6b9a45d`

## Next Stage
Stage 09 — Full 1–10 Dashboard Frontend.
