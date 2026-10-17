# StockMaster V3.1 Stage 14 — Mac Installer / Launcher Hardening

## Status
Complete

## Goal
強化 macOS 本機啟動流程，避免重複程序、stale PID 與失敗後殘留背景服務，並留下可診斷的啟動紀錄。

## Completed
- `install.command` 保留既有 `.env` 並重用 `.venv`。
- `StockMaster.command` 檢查 `curl` / macOS `open`。
- 偵測已存在且仍存活的 PID，直接開瀏覽器，不重複啟動 FastAPI。
- stale PID 會在新啟動前清除。
- 記錄 `uname -m` 與啟動時間到 `logs/startup.log`。
- FastAPI health check 成功後才開瀏覽器。
- health timeout 時終止剛啟動的 server 並刪除 PID。
- 新增 Mac 安裝/排錯文件。

## Files Changed
- `stock-research-v31/StockMaster.command`
- `stock-research-v31/backend/tests/test_launcher_contract.py`
- `stock-research-v31/docs/MAC_INSTALL.md`

## API / Interface Changes
No REST API changes. Local launcher contract is hardened around `http://127.0.0.1:8000/api/health`.

## Data Sources
None.

## Verification
RED:
- `PYTHONPATH=. pytest tests/test_launcher_contract.py -q`
- Result before hardening: `4 failed, 1 passed`.
- Failures pinned missing dependency guards, stale PID removal, failed-server cleanup, and architecture/startup logging.

GREEN:
- `bash -n install.command` → PASS.
- `bash -n StockMaster.command` → PASS.
- `PYTHONPATH=. pytest tests/test_launcher_contract.py -q` → `5 passed`.
- Full backend suite: `PYTHONPATH=. pytest -q` → `36 passed`.

## Decisions / Rulings
- Port stays pinned to `8000` because the approved spec and local frontend contract use `127.0.0.1:8000`.
- Launcher uses PID guard + health probe instead of port-only detection so it will not treat an unrelated process on port 8000 as StockMaster.
- GitHub Contents API does not reliably preserve executable mode, so installation documentation includes `chmod +x install.command StockMaster.command` as a recovery step.

## Known Issues
- A true fresh-machine double-click test on the user's Apple Silicon Mac still requires Stage 15/user-machine validation.
- Gatekeeper behavior varies by download provenance; the guide documents Finder right-click → Open / Terminal fallback.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code/documentation head before MARK: `b0ae95542d832980bf9ff79800f2c3d3ade52bb2`

## Next Stage
Stage 15 — Release Verification + Final MARK.
