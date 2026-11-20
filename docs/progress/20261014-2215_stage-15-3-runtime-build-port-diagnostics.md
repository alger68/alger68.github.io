# StockMaster V3.1 Stage 15.3 — Runtime Build / Port Collision / Diagnostics

## Status
Complete in code/tests — requires user Mac confirmation

## Goal
修正使用者實機回報「Nova、自選、重大訊息、市場總覽都沒有」的共同根因：新版 ZIP 仍可能開到舊的 FastAPI 程序或舊快取前端。

## Root Cause
舊版 `StockMaster.command` 固定使用 `127.0.0.1:8000`。如果前一個 ZIP 的 StockMaster 還在背景執行，新 ZIP 的 Uvicorn 會因 port 8000 被占用而退出，但 launcher 的 `/api/health` 檢查可能命中舊程序並誤判為新版成功啟動，最後瀏覽器仍顯示舊功能。固定資產 URL 也可能讓瀏覽器沿用舊 JS/CSS cache。

## Completed
- `/api/health` 新增 `build: 15.3`。
- Launcher 改為核對 exact build ID，不再只看 HTTP 200。
- Launcher 會掃描 8000–8005，遇到舊服務占用就自動改用下一個空 port。
- PID 之外新增 `.stockmaster.port`，可正確重新開啟目前版本。
- 同資料夾舊程序 build 不符時會停止並重啟。
- Frontend CSS/JS 全部加 `?v=15.3` cache busting。
- Dashboard 右上角直接顯示 `BUILD 15.3`，讓使用者肉眼確認不是舊版。
- 新增 `Diagnose.command`，只輸出非敏感資訊：health、market overview、watchlist、2395 官方重大訊息、2395 summary、server.log tail。
- Diagnose 不讀出 `.env`，也不輸出台新密碼/憑證密碼。

## Files Changed
- `stock-research-v31/backend/app/config.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/StockMaster.command`
- `stock-research-v31/Diagnose.command`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/backend/tests/test_health.py`
- `stock-research-v31/backend/tests/test_launcher_contract.py`
- `stock-research-v31/backend/tests/test_diagnostics_contract.py`
- `stock-research-v31/frontend/tests/integration.test.cjs`

## Verification
Using the Stage 15.2 Mac package patched to the exact Stage 15.3 code:

- Launcher RED before fix: 3 failed / 4 passed (no dynamic port, no build verification).
- Backend final: `53 passed`.
- Frontend final: `10 passed, 0 failed`.
- JS syntax: PASS.
- `bash -n StockMaster.command`: PASS.
- `bash -n Diagnose.command`: PASS.

## Decisions / Rulings
- Do not kill arbitrary process on port 8000. Safer behavior is to select an unused port from 8000–8005.
- Build ID verification is mandatory before opening browser.
- Keep visible build marker in UI until external validation is complete.
- Diagnostics must never dump `.env` or secrets.

## Known Issues
- If all 8000–8005 ports are occupied, launcher stops and asks user to close an old service.
- Taishin Nova still requires user's official Mac ARM64 SDK wheel and local credentials/certificate.
- External Mac validation remains required to prove real Nova login and network access.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Draft PR: #4

## Next Stage
User should launch the Stage 15.3 package and confirm the top-right badge reads `BUILD 15.3`. If data is still missing, double-click `Diagnose.command` and provide the generated non-secret diagnostics text/file so the exact failing boundary can be identified.
