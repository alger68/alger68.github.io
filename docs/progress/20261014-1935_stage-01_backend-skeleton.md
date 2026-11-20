# StockMaster V3.1 Stage 01 — FastAPI Skeleton + Local Launcher

## Status
Complete

## Goal
建立可在 Mac 本機啟動的 FastAPI 最小骨架、健康檢查 API、前端入口、安裝/啟動腳本，以及後續每階段必須寫入的 MARK 紀錄機制。

## Completed
- 建立 FastAPI app 與 `/api/health`。
- 建立 `/api/config/mode`。
- 建立本機前端入口 `/`。
- 建立 `install.command` 與 `StockMaster.command`。
- `.env` 僅由 `.env.example` 初始化且不覆寫既有 `.env`。
- 啟動器加入重複程序檢查、health polling 與啟動失敗 log 指引。
- 建立 Stage MARK/INDEX 工作流。

## Files Changed
- `stock-research-v31/backend/app/__init__.py`
- `stock-research-v31/backend/app/config.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/requirements.txt`
- `stock-research-v31/backend/tests/test_health.py`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/.env.example`
- `stock-research-v31/.gitignore`
- `stock-research-v31/install.command`
- `stock-research-v31/StockMaster.command`

## API / Interface Changes
- `GET /api/health` → `{status, mode, version}`
- `GET /api/config/mode` → `{mode}`
- `GET /` → local frontend

## Data Sources
None in Stage 01.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_health.py -q`
- Result before implementation: `2 failed` with `ModuleNotFoundError: No module named 'app'`.

GREEN:
- Command: `PYTHONPATH=. pytest tests/test_health.py -q`
- Result: `2 passed`.

Launcher checks:
- `bash -n install.command`
- `bash -n StockMaster.command`
- Contract assertions for `.env` preservation, PID duplicate guard, and `/api/health` polling.
- Result: PASS.

## Decisions / Rulings
- Stage 01 uses a minimal HTML shell only; the full 1–10 dashboard is deferred to Stage 09 so backend contracts can stabilize first.
- Runtime PID file `.stockmaster.pid` is gitignored.

## Known Issues
- macOS executable bit cannot be represented/verified through the GitHub contents API alone; downloaded package may require a packaging step that preserves executable permissions. Stage 14 will harden this.
- Full clean-machine install has not yet been executed on the user's Mac.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `56bd4eda7f1d3e6098cf61c64c98b2bbcbd72290`
- MARK/INDEX bookkeeping is committed after this code head.

## Next Stage
Stage 02 — Provider Contract + GitHub Snapshot Adapter.
