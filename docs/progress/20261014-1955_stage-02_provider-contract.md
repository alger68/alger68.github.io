# StockMaster V3.1 Stage 02 — Provider Contract + GitHub Snapshot Adapter

## Status
Complete

## Goal
建立統一 ProviderResult 資料契約與可讀取既有公司快照的 GitHub Snapshot Adapter，並確保交易所/代號身分隔離。

## Completed
- 建立 `ProviderResult[T]`。
- 建立 provider identity guard。
- 建立 `GitHubSnapshotProvider.get_company(exchange, ticker)`。
- 處理不存在快照、損壞 JSON、公司身分不一致。
- 保留來源名稱、URL、fetched time、period/scope hint 等欄位。

## Files Changed
- `stock-research-v31/backend/app/models/provider.py`
- `stock-research-v31/backend/app/providers/base.py`
- `stock-research-v31/backend/app/providers/github_snapshot.py`
- `stock-research-v31/backend/tests/test_provider_contract.py`
- `stock-research-v31/backend/tests/test_github_snapshot_provider.py`

## API / Interface Changes
- `ProviderResult[T]`
- `normalize_identity(exchange, ticker)`
- `GitHubSnapshotProvider.get_company(exchange, ticker)`

## Data Sources
- Existing published company snapshot files under TWSE/TPEX company shard layout.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_provider_contract.py tests/test_github_snapshot_provider.py -q`
- Result before implementation: `3 failed` because provider modules did not exist.

GREEN + regression:
- Command: `PYTHONPATH=. pytest tests/test_provider_contract.py tests/test_github_snapshot_provider.py tests/test_health.py -q`
- Result: `5 passed`.

## Decisions / Rulings
- Snapshot adapter validates both exchange and ticker from payload `subject`; filename alone is not trusted.
- Invalid or malformed snapshot returns structured provider error instead of raising into the API layer.

## Known Issues
- Snapshot adapter currently targets local filesystem shards; remote HTTP snapshot fetch is deferred to the service/deployment stages.
- Dataset-specific normalization remains Stage 03/04 work.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `94945a7be51477e552b4a6c1339756f3bfc088d3`

## Next Stage
Stage 03 — TWSE / TPEx Official Providers.
