# StockMaster V3.1 Stage 03 — TWSE / TPEx Official Providers

## Status
Complete

## Goal
建立 TWSE / TPEx 官方資料 Provider 與統一 HTTP JSON client，並確保不同交易所與不同代號不會交叉取值。

## Completed
- 建立 `JsonHttpClient`，含 timeout、retry、JSON list 驗證。
- 建立 `TwseProvider`：quote / revenue / valuation / financial_summary。
- 建立 `TpexProvider`：quote / revenue / valuation / financial_summary。
- 單元測試全部使用 fixture/fake HTTP，不依賴 live network。

## Files Changed
- `stock-research-v31/backend/app/services/http_client.py`
- `stock-research-v31/backend/app/providers/twse.py`
- `stock-research-v31/backend/app/providers/tpex.py`
- `stock-research-v31/backend/tests/test_twse_provider.py`
- `stock-research-v31/backend/tests/test_tpex_provider.py`

## API / Interface Changes
- `TwseProvider.quote/revenue/valuation/financial_summary`
- `TpexProvider.quote/revenue/valuation/financial_summary`
- `JsonHttpClient.get_json(url)`

## Data Sources
- TWSE `STOCK_DAY_ALL`
- TWSE `t187ap05_L`
- TWSE `BWIBBU_ALL`
- TWSE `t187ap06_L_ci`
- TPEx daily close / revenue / valuation / income OpenAPI endpoints

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_twse_provider.py tests/test_tpex_provider.py -q`
- Result before implementation: `2 failed` because provider modules did not exist.

GREEN + regression:
- Command: `PYTHONPATH=. pytest tests/test_twse_provider.py tests/test_tpex_provider.py tests/test_provider_contract.py tests/test_github_snapshot_provider.py tests/test_health.py -q`
- Result: `7 passed`.

## Decisions / Rulings
- Provider 層只做精確 identity filtering 與來源 metadata；日期/口徑正規化留給 Stage 04 Canonical layer。
- 開發時曾因 `backend/app/services/` 尚未建立而寫檔失敗；根因確認為目錄不存在，建立目錄後相同測試通過，未改變產品介面。

## Known Issues
- TPEx production endpoint schema仍可能因官方欄位名稱調整而改變；Stage 15 需 live smoke verification。
- HTTP client 尚未做 async；Phase 1 先維持簡單同步 contract。

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `1f342202708fd1715d1baac5df552b45019b71ec`

## Next Stage
Stage 04 — Canonical Data + Verification + Freshness。
