# StockMaster V3.1 Stage 13 — Free Online Mode + Snapshot Fallback

## Status
Complete

## Goal
讓同一套前端在 Mac 本機使用 same-origin FastAPI，在 GitHub Pages 使用可設定的 Render API，且後端不可用時至少能以既有公開 company snapshot 顯示唯讀摘要。

## Completed
- 建立 Runtime mode selector。
- localhost / 127.0.0.1 固定使用 same-origin FastAPI。
- 公開網站可使用 `STOCKMASTER_RENDER_API`。
- Summary API 失敗時 fallback 到既有 `/stock-research/data/companies/{exchange}/{ticker}.json`。
- Snapshot fallback 明確標示 read-only、低信心與 EPS scope 未驗證。
- FastAPI 加入 GitHub Pages CORS allowlist。
- 建立 Render Free `render.yaml`。
- 公開 fallback 僅用於 Summary；分析類 API 不以假資料替代。

## Files Changed
- `stock-research-v31/frontend/js/runtime.js`
- `stock-research-v31/frontend/js/api.js`
- `stock-research-v31/frontend/index.html`
- `stock-research-v31/frontend/tests/runtime.test.cjs`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/render.yaml`

## API / Interface Changes
- `StockRuntime.resolveApiBase(location, configured)`
- `StockRuntime.withFallback(primary, fallback)`
- Frontend Summary fallback contract.
- CORS allows `https://alger68.github.io` and local FastAPI origins.

## Data Sources
- Primary: FastAPI backend.
- Public fallback: existing GitHub Pages company snapshot shards under `stock-research/data/companies/`.

## Verification
RED:
- `node --test tests/runtime.test.cjs` failed before `runtime.js` existed.

GREEN:
- `node --test tests/runtime.test.cjs tests/dashboard.test.cjs` → `4 passed`.
- `node --check js/runtime.js` → PASS.
- `node --check js/api.js` → PASS.
- Backend full suite: `PYTHONPATH=. pytest -q` → `31 passed`.

## Decisions / Rulings
- Snapshot fallback is deliberately read-only and lower-confidence. It does not pretend to provide live refresh, technicals, financial verification, valuation, or Decision.
- Render configuration is committed but no external Render service is created/deployed in this stage; deployment is a publish-side effect and remains separate from branch implementation.
- The public API URL remains configurable rather than hard-coded until a real Render service URL exists.

## Known Issues
- Render service has not yet been created, so `STOCKMASTER_RENDER_API` has no production URL.
- Snapshot fallback uses legacy V3 shard field names and therefore provides only the subset that can be safely normalized.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `7661acd98a5c9be07c6af731dd5d4b7ef40c6e11`

## Next Stage
Stage 14 — Mac Installer / Launcher Hardening.
