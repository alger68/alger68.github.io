# StockMaster V3.1 Stage 12 — Private Local Taishin/Fugle Provider

## Status
Complete

## Goal
建立只在本機有完整 API key 時啟用的 Taishin/Fugle 私人行情來源，並保證金鑰不進入 API response、status 或 repr。

## Completed
- 建立 `TaishinFugleProvider.from_env()`。
- 缺任一 key 時 provider 自動 disabled。
- `status()` 只回 enabled/provider，不回 secrets。
- `repr()` 不含 secrets。
- 建立 `ProviderRouter`：private enabled 時優先，否則 official fallback。

## Files Changed
- `stock-research-v31/backend/app/providers/taishin_fugle.py`
- `stock-research-v31/backend/tests/test_private_provider.py`

## API / Interface Changes
- `TaishinFugleProvider.from_env(fetcher=None)`
- `TaishinFugleProvider.status()`
- `ProviderRouter.active()`

## Data Sources
- Taishin / Fugle private local integration contract; actual credentials remain `.env` only.

## Verification
RED:
- `pytest tests/test_private_provider.py -q` → `3 failed` before implementation.

GREEN:
- Private-provider tests → `3 passed`.
- Full backend suite → `31 passed`.

## Decisions / Rulings
- Private provider selection is composition-based via `ProviderRouter`; StockService remains provider-agnostic instead of embedding credential-specific logic.
- Provider can be enabled only if both configured keys exist; missing configuration is a normal fallback state, not an application error.

## Known Issues
- Real Taishin/Fugle network fetcher is not committed because SDK/auth details and live credentials must remain local and be validated against the user's actual account.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `77b3e5092a493af66b84aee88471ee5ed845e69c`

## Next Stage
Stage 13 — Free Online Mode + Snapshot Fallback.
