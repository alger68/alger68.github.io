# StockMaster V3.1 Stage 04 — Canonical Data + Verification + Freshness

## Status
Complete

## Goal
建立 CanonicalDatum、跨來源驗證、舊資料保護與交易日感知的行情 freshness 判斷，正式處理 10/14 檢查但只有 10/13 行情的情境。

## Completed
- 建立 `CanonicalDatum`。
- 建立 `verify_candidates()`。
- 建立 `prefer_current()`，較舊 period 不可覆蓋較新 period。
- 建立 `quote_freshness()`。
- 10/14 + 10/13 quote → `stale`, `lag_trading_days=1`, `昨日收盤`。
- 週末檢查 Friday close 不會被誤標成落後一個交易日。
- `quarter_unspecified` 不允許 verified。

## Files Changed
- `stock-research-v31/backend/app/models/canonical.py`
- `stock-research-v31/backend/app/services/verification.py`
- `stock-research-v31/backend/app/services/freshness.py`
- `stock-research-v31/backend/tests/test_verification.py`
- `stock-research-v31/backend/tests/test_freshness.py`

## API / Interface Changes
- `CanonicalDatum`
- `verify_candidates(candidates)`
- `prefer_current(current, incoming)`
- `quote_freshness(quote_date, checked_at, trading_calendar=None)`

## Data Sources
No new source. This stage validates and classifies provider output from prior stages.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_verification.py tests/test_freshness.py -q`
- Result before implementation: `5 failed` because verification/freshness modules did not exist.

GREEN + regression:
- Command: `PYTHONPATH=. pytest tests/test_verification.py tests/test_freshness.py tests/test_twse_provider.py tests/test_tpex_provider.py tests/test_provider_contract.py tests/test_github_snapshot_provider.py tests/test_health.py -q`
- Result: `12 passed`.

## Decisions / Rulings
- 交易日計算目前內建 weekday 邏輯並接受 holiday set 注入；正式台股休市日 calendar 可在後續 provider/deployment stage 補入，不讓 UI 自己猜。
- 單一 authoritative source 在 scope 明確時可標 verified，confidence 0.75；兩個不同來源同 period/scope/value 相符時 confidence 0.95。
- scope 不明確時即使數值存在仍維持未驗證。

## Known Issues
- 尚未接台灣證交所完整休市日曆；weekend 行為已覆蓋，國定假日資料注入留後續處理。
- `prefer_current` 目前以 ISO-like period 字串順序為前提。

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `17deadc851cebcc68c2974133516e4888c63c1c3`

## Next Stage
Stage 05 — Stock Summary + Refresh Job API.
