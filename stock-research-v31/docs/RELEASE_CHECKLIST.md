# StockMaster AI V3.1 Release Checklist

## Automated / sandbox verified
- [x] Backend full suite: 41 passed
- [x] Frontend Node tests: 6 passed
- [x] All frontend JS passes `node --check`
- [x] `install.command` passes `bash -n`
- [x] `StockMaster.command` passes `bash -n`
- [x] 2026-10-14 checked + 2026-10-13 quote returns stale / lag 1 / `昨日收盤`
- [x] Quarter-unspecified EPS stays unverified
- [x] ETF cannot enter company Decision
- [x] Older canonical period cannot replace newer period
- [x] Provider failure contracts retain explicit warning/error state
- [x] Direct Uvicorn app is bootstrapped with runtime services
- [x] Company name search resolves official TWSE/TPEx directory fixtures
- [x] TWSE official monthly history parser covered by recorded fixture
- [x] Mobile CSS contract includes <=640px layout and `overflow-x:hidden`
- [x] `.env` is gitignored and no real private key assignment found in source scan
- [x] Stage 01–14 MARK files exist

## External validation required before production merge/deployment
- [ ] Run `install.command` on the user's Apple Silicon Mac from a fresh folder
- [ ] Double-click `StockMaster.command`; verify browser opens only after `/api/health`
- [ ] Verify 2395 live Summary against current TWSE response
- [ ] Verify 2395 1Y history chart against TWSE `STOCK_DAY`
- [ ] Verify TPEx stock summary; TPEx historical chart is currently intentionally unavailable
- [ ] Configure actual Taishin/Fugle credentials locally and validate SDK/auth fetcher
- [ ] Safari mobile visual QA around 390px
- [ ] Desktop Safari/Chrome visual QA >=1440px
- [ ] Bind a production market-overview rows provider
- [ ] Bind a production public news/重大訊息 provider
- [ ] Create Render service from `render.yaml`, set production API URL, verify CORS
- [ ] Only then merge/deploy to `main`

## Release policy
Do not call V3.1 production-complete until the external validation items required for the chosen deployment mode are checked. Public fallback remains read-only and lower-confidence by design.
