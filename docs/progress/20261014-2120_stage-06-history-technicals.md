# StockMaster V3.1 Stage 06 — Historical Prices + Technical Indicators

## Status
Complete

## Goal
建立歷史 K 線正規化、常用技術指標與 `/history`、`/technicals` API，且歷史資料不足時明確回傳 unavailable/null，不補假資料。

## Completed
- 建立 candle normalization。
- 建立 SMA5/20/60/120/240。
- 建立 RSI14。
- 建立 MACD(12,26,9)。
- 建立 KD(9,3,3)。
- 建立 Bollinger(20,2)。
- 建立 history / technicals API routes。
- 對 insufficient history 回傳 warning 與 null indicator。

## Files Changed
- `stock-research-v31/backend/app/providers/history.py`
- `stock-research-v31/backend/app/services/technicals.py`
- `stock-research-v31/backend/app/api/technicals.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/tests/test_history.py`
- `stock-research-v31/backend/tests/test_technicals.py`

## API / Interface Changes
- `GET /api/stocks/{ticker}/history?range=1y`
- `GET /api/stocks/{ticker}/technicals`
- `technical_summary(candles)`

## Data Sources
Historical provider contract only in this stage; live historical source adapter remains to be connected later.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_history.py tests/test_technicals.py -q`
- Result before implementation: `3 failed` because history/technicals modules did not exist.

GREEN + regression:
- Command: `PYTHONPATH=. pytest tests/test_history.py tests/test_technicals.py tests/test_stock_summary_api.py tests/test_refresh_jobs.py tests/test_verification.py tests/test_freshness.py tests/test_twse_provider.py tests/test_tpex_provider.py tests/test_provider_contract.py tests/test_github_snapshot_provider.py tests/test_health.py -q`
- Result: `17 passed`.

## Decisions / Rulings
- 技術指標先用純 Python 實作，降低本機安裝相依；若後續效能不足再考慮 pandas/numpy 優化。
- MACD/KD/Bollinger history 不足時回傳 null 結構，而不是任意估值。

## Known Issues
- 目前 `history_provider` 是 API contract，尚未綁定正式歷史行情來源。
- 指標公式為標準實作，仍需 Stage 15 以市場資料做 smoke comparison。

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `66ae6c7e119ee33b02b58a6a593db2c05e8c79a3`

## Next Stage
Stage 07 — Financial Statements.
