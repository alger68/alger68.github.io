# 飆股雷達歷史資料 Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在飆股雷達首次上線前，以官方日期型盤後資料補齊至少 300 個交易日的全市場 OHLCV，使 240D 新高、MA60、HH/HL 與量比第一天就可運作，而不是等待 240 個交易日累積。

**Architecture:** 新增一次性／可重入 backfill script，逐交易日讀取 TWSE `MI_INDEX` 與 TPEx `dailyQuotes` 官方日期查詢，正規化成與每日 collector 完全相同的 `data/history/YYYY-MM-DD.json`。Backfill 與日常更新共用 normalization；已有日期直接跳過或以 `--force` 覆蓋，完成後由既有 `build-radar.mjs` 產生第一份完整 `radar.json`。

**Tech Stack:** Node.js 22、官方 TWSE/TPEx HTTPS JSON、`node:test`、GitHub Actions manual workflow。

**Spec:** `docs/superpowers/specs/2026-10-14-bull-radar-design.md`

## Global Constraints

- 僅使用官方 TWSE / TPEx 日期型盤後查詢做 bootstrap；不引入 Yahoo、FinMind 或付費資料源。
- 目標至少 300 個有效交易日，下載上限 320 日。
- 每次 HTTP request timeout 25 秒；同市場最大併發 3，避免對官方站點造成過量請求。
- HTTP 429/5xx 以 1s、2s、4s 指數退避最多重試 3 次；仍失敗時記錄日期與市場，不偽造資料。
- 只將兩市場皆已嘗試完成的日期寫入 history；若單一市場失敗，分片保留另一市場並寫 `issues`，後續可重跑補齊。
- Bootstrap 不在每次排程自動執行，只由 `workflow_dispatch` 明確啟動；日常排程只追加最新一天。

## Review Focus

- 休市日：回應無有效股票列時視為 non-trading day，不產生空 history 分片。
- 民國年／西元日期與千分位：正規化後必須是 ISO date 與 finite numbers。
- 來源 schema 改版：找不到預期欄位時該市場日期失敗，不把錯欄位寫成 0。
- 中途失敗再執行：已有成功分片必須可跳過，避免重新抓全部日期。
- Repo 體積：完成後只保留最近 320 個有效交易日，舊分片必須 prune。

---

### Task 0.1: 官方日期型資料 adapter

**Files:**
- Create: `stock-research/scripts/history-source.mjs`
- Create: `stock-research/tests/history-source.test.cjs`

**Interfaces:**
- Produces: `fetchTwseDay(date, fetcher)`、`fetchTpexDay(date, fetcher)`、`normalizeTwseHistorical(date,payload)`、`normalizeTpexHistorical(date,payload)`。
- TWSE endpoint template: `https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&date=YYYYMMDD&type=ALLBUT0999`。
- TPEx endpoint template: `https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes?date=YYYY/MM/DD&id=&response=json`。
- Normalized row contract: `{exchange,ticker,open,high,low,close,volume}`。

- [ ] **Step 1: Write fixture-based failing adapter tests**

使用小型 committed fixtures 模擬兩站 JSON；assert ticker、OHLC、volume、日期與無效列處理，不在 test hit live network。

- [ ] **Step 2: Run and verify failure**

Run: `node --test stock-research/tests/history-source.test.cjs`
Expected: FAIL because adapter does not exist.

- [ ] **Step 3: Implement endpoint builders, schema detection and normalization**

來源欄位缺失時 throw descriptive error；禁止以 0 代替缺 open/high/low/close。

- [ ] **Step 4: Add retry wrapper**

僅對 429/5xx/timeout 重試；4xx schema/query error 直接失敗。

- [ ] **Step 5: Run tests**

Run: `node --test stock-research/tests/history-source.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add stock-research/scripts/history-source.mjs stock-research/tests/history-source.test.cjs stock-research/tests/fixtures/
git commit -m "feat: add official historical market adapters"
```

### Task 0.2: 可重入 320 日 backfill runner

**Files:**
- Create: `stock-research/scripts/backfill-history.mjs`
- Create: `stock-research/tests/backfill-history.test.cjs`
- Reuse: `stock-research/scripts/radar-history.mjs`

**Interfaces:**
- Produces: `backfill({endDate,targetTradingDays=320,force=false,directory,fetcher}) -> {written,skipped,failed,oldest,newest}`。

- [ ] **Step 1: Write failing orchestration tests**

固定測試：週末/休市不計交易日；已有完整分片 skip；`force=true` 可覆蓋；單市場失敗帶 issues；達 320 個有效日期即停止；prune 後不超過 320 檔。

- [ ] **Step 2: Implement backwards calendar walk**

從 `endDate` 往前走，直到取得 320 個有效交易日；每市場最大併發 3，但日期寫檔必須按 ISO 日期 deterministic。

- [ ] **Step 3: Implement checkpoint/restart behavior**

每成功完成一天立即寫分片，不使用一個巨大暫存檔；中斷後重跑能從既有分片繼續。

- [ ] **Step 4: Run focused tests**

Run: `node --test stock-research/tests/backfill-history.test.cjs stock-research/tests/radar-history.test.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add stock-research/scripts/backfill-history.mjs stock-research/tests/backfill-history.test.cjs
git commit -m "feat: backfill radar history from official sources"
```

### Task 0.3: 手動 bootstrap workflow 與完整性門檻

**Files:**
- Modify: `.github/workflows/stock-market-data.yml`
- Modify: `stock-research/tests/update-flow.test.cjs`
- Modify: `stock-research/README.md`

**Interfaces:**
- Adds `workflow_dispatch` input `bootstrap_history` boolean, default false。
- When true: tests → backfill 320 valid days → build radar → save `data/history/` + `data/radar.json` → publish。

- [ ] **Step 1: Write workflow structure test**

Assert scheduled runs do not invoke backfill; manual `bootstrap_history=true` does; normal collector still runs on schedule.

- [ ] **Step 2: Add completeness gate before claiming full radar**

`radar.json` 加 `historyDays`；`historyDays < 240` 時前端顯示「歷史資料建置中」，240D 分數為 0 且不得標示完整 240D 掃描已就緒。

- [ ] **Step 3: Add manual workflow branch**

Bootstrap 完成後執行完整 tests 與 radar build；失敗不得發布假裝完整的結果。

- [ ] **Step 4: Run full test suite**

Run: `node --test stock-research/tests/*.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/stock-market-data.yml stock-research/tests/update-flow.test.cjs stock-research/README.md
git commit -m "chore: add one-time radar history bootstrap"
```

### Task 0.4: Bootstrap verification

**Files:** Verify only.

- [ ] **Step 1: Run manual bootstrap on feature branch or disposable test destination**

Expected: >=300 and <=320 valid trading-day files, both markets represented on normal trading days.

- [ ] **Step 2: Sample-check 5 dates against official pages**

Compare one TWSE and one TPEx stock per sampled date for close/high/low/volume.

- [ ] **Step 3: Build radar and inspect readiness**

Expected: `historyDays>=300`, 240D fields become calculable where stocks have sufficient trading history, no NaN/Infinity.

- [ ] **Step 4: Do not merge until repository-size and workflow-duration checks pass**

Record history directory size and bootstrap duration in PR notes; daily scheduled run must remain comfortably inside the workflow timeout.
