# 飆股雷達 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 `stock-research` 工作台加入「🚀 飆股雷達」，每天以固定 100 分規則掃描台灣上市／上櫃股票，產生 A/B/C 趨勢候選、Top 10、新 A 級與失效訊號，並可一鍵加入既有研究工作台。

**Architecture:** 延伸既有 GitHub Actions 市場資料流程，將每日官方行情保存成按交易日分片的 rolling history，再由純函式雷達引擎批次計算 `data/radar.json`。前端只讀 `radar.json` 與單一候選所需資料，不在瀏覽器掃全市場；既有研究 gate 與 localStorage 不被雷達分數改寫。

**Tech Stack:** GitHub Pages、Vanilla JavaScript、Node.js 22、`node:test`、GitHub Actions、TWSE/TPEx 官方公開資料。

**Spec:** `docs/superpowers/specs/2026-10-14-bull-radar-design.md`

## Global Constraints

- 第一版採固定權重，不做自訂權重或自訂 swing 參數。
- 只做盤後／批次資料，不做盤中即時掃描與自動下單。
- 技術趨勢是主體；基本面缺資料只能少加分，不能因此直接淘汰。
- A=80–100、B=70–79、C=60–69、<60 不進主要雷達。
- 歷史價格至少覆蓋 300 個交易日；rolling 保存上限固定為 320 個交易日。
- 第一版 swing window 固定 `N=3`；最右側未滿 3 個後續交易日的 swing 不得確認，避免 repaint。
- A⚠ 接近失效固定為 `close <= defenseLow * 1.03` 且尚未跌破 defenseLow。
- 強度 5 分固定使用 20 交易日價格動能：`close / close[-20] - 1 >= 10%`。
- 月營收「趨勢改善／連續成長」第一版固定定義為 `YoY > 0` 且 `YTD YoY > 0`；不額外建立月營收歷史資料庫。
- 雷達不得改寫既有研究卡的 gate、thesis、估值或確認狀態。
- 前端維持無外部 UI 套件、可在手機瀏覽器操作。

## Review Focus

- 歷史行情不足 240 日：不得假裝 240D 新高，仍可依可計算欄位評分，但資料不足項目為 0 分。
- 同一天重跑 workflow：必須覆蓋同日期分片而不是新增重複日期，雷達結果要可重現。
- TWSE 或 TPEx 單一來源失敗：保留已有歷史，不可清空另一市場；`radar.json` 明確帶出 freshness / issues。
- 股票更名、停牌、零成交或缺 OHLC：無效列跳過，不得產生 NaN、Infinity 或錯誤 A 級。
- 前端 `radar.json` 404/格式錯誤：研究工作台仍可正常使用，雷達頁顯示可理解錯誤而非整頁失效。

---

### Task 1: 建立 rolling 每日行情歷史層

**Files:**
- Create: `stock-research/scripts/radar-history.mjs`
- Create: `stock-research/tests/radar-history.test.cjs`
- Modify: `stock-research/scripts/collect-market.mjs`
- Data convention: `stock-research/data/history/YYYY-MM-DD.json`

**Interfaces:**
- Consumes: `market.json` 中 `twsePrice` / `tpexPrice` rows。
- Produces: `normalizeDailyRows(snapshot) -> {date, stocks[]}`、`writeDailyHistory(snapshot, directory, maxDays=320)`；每筆 stock 為 `{exchange,ticker,open,high,low,close,volume}`。

- [ ] **Step 1: Write failing history normalization tests**

測試至少固定：TWSE/TPEX 欄位可正規化；無效 ticker、close<=0、非數值 OHLC 跳過；同一市場同一 ticker 只留一筆；輸出依 `exchange:ticker` 穩定排序。

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test stock-research/tests/radar-history.test.cjs`
Expected: FAIL because `radar-history.mjs` does not exist.

- [ ] **Step 3: Implement `normalizeDailyRows` and `writeDailyHistory`**

`writeDailyHistory` 以來源行情日期作檔名；同日期重跑直接覆蓋；只保留最新 320 個合法 `YYYY-MM-DD.json`，不得刪除其他 `data/` 檔案。

- [ ] **Step 4: Add collector integration**

在 `collect-market.mjs` 完成 `market.json` 與 shards 後呼叫 `writeDailyHistory(out)`；若其中一市場行情來源失敗，當日分片仍可保存另一市場，並在分片 `issues` 記錄缺口。

- [ ] **Step 5: Verify history tests and existing market tests**

Run: `node --test stock-research/tests/radar-history.test.cjs stock-research/tests/market.test.cjs stock-research/tests/split-market.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add stock-research/scripts/radar-history.mjs stock-research/scripts/collect-market.mjs stock-research/tests/radar-history.test.cjs
git commit -m "feat: persist rolling daily market history"
```

### Task 2: 實作純函式飆股雷達引擎

**Files:**
- Create: `stock-research/radar-engine.js`
- Create: `stock-research/tests/radar-engine.test.cjs`

**Interfaces:**
- Consumes: 單股升冪 OHLCV series、最新 revenue `{yoy,ytdYoY}`、前一版 radar stock state。
- Produces: `ma(series,n)`、`rollingHigh(series,n)`、`volumeRatio(series,n)`、`findSwings(series,window=3)`、`analyzeStock(input)`、`grade(score)`、`classifyStatus(analysis)`、`markNewGradeA(current,previous)`。

- [ ] **Step 1: Write failing indicator tests**

固定測試 MA20/MA60、20/60/240 日 high、20 日量比；不足 n 日回傳 `null` 而不是縮短視窗計算。

- [ ] **Step 2: Write failing HH/HL swing tests**

以 `N=3` 固定測試：最近兩個 confirmed swing highs 後者較高 => HH；最近三個 confirmed swing lows 逐步墊高 => HL；最後 3 日內極值不得成為 confirmed swing。

- [ ] **Step 3: Write failing 100-point scoring boundary tests**

固定權重：240D high +20；60D 持續創高 +10；HH +5；3 個 HL +10；MA20>MA60 +10；close>MA20>MA60 +5；breakout volume ratio>=1.5 +10；revenue YoY>20 +10；revenue YoY>0 且 YTD YoY>0 +10；距 60D high<=5% 或最近 3 日 breakout +5；20D momentum>=10% +5。

同時固定 A/B/C 邊界與基本面缺資料只得 0 分、不丟例外。

- [ ] **Step 4: Implement the minimal radar engine**

`analyzeStock` 回傳 `{score,grade,status,ma20,ma60,high20,high60,high240,volumeRatio20,higherHigh,higherLow,defenseLow,momentum20,scoreBreakdown,breakoutDate}`；不得回傳 NaN/Infinity。

- [ ] **Step 5: Write status and invalidation tests**

固定：最近 3 日創 60/240D high 且量比成立 => `breakout`；HH+HL 且 close>=MA20 => `advance`；A 級回檔但 close>defenseLow => `pullback`；close<=defenseLow*1.03 且 >defenseLow => `warning`；close<defenseLow => `invalidated`。

- [ ] **Step 6: Write new-A transition tests**

昨日 B→今日 A => `newGradeA=true`；A→A => false；曾離開 A 後再次 A，以前一版非 A 為準 => true。

- [ ] **Step 7: Run radar engine tests**

Run: `node --test stock-research/tests/radar-engine.test.cjs`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add stock-research/radar-engine.js stock-research/tests/radar-engine.test.cjs
git commit -m "feat: add bull radar scoring engine"
```

### Task 3: 建立全市場批次計算器與 `radar.json`

**Files:**
- Create: `stock-research/scripts/build-radar.mjs`
- Create: `stock-research/tests/build-radar.test.cjs`
- Modify: `stock-research/scripts/collect-market.mjs`
- Generate: `stock-research/data/radar.json`

**Interfaces:**
- Consumes: 最新最多 320 個 `data/history/*.json`、`market.json` 的最新 revenue rows、前一版 `radar.json`。
- Produces: `buildRadar({historyDays,marketSnapshot,previousRadar,generatedAt}) -> RadarPayload`；payload `schemaVersion=1`，含 `summary`、`stocks`、`issues`、`historyDays`、`asOf`。

- [ ] **Step 1: Write failing market aggregation tests**

固定測試按 `exchange:ticker` 聚合升冪 series、跳過缺日期／無效 OHLC、歷史不足不誤判 240D high、TWSE/TPEX 同 ticker 不混合。

- [ ] **Step 2: Write failing ranking and summary tests**

排序固定：`grade(A>B>C)`、score desc、status priority `breakout > advance > pullback > warning`、最後 `exchange:ticker`；`summary` 包含 `gradeA`、`newGradeA`、`new240High`、`invalidated`。

- [ ] **Step 3: Implement `buildRadar` and file writer**

`stocks` 只發布 score>=60 或 status=`invalidated` 的股票；Top 10 在前端從排序後資料取前十，不另外複製一份資料。每筆帶 `name` 時使用 company directory lookup；找不到名稱則顯示 ticker，不猜名稱。

- [ ] **Step 4: Integrate build after daily history write**

`collect-market.mjs` 流程固定：抓來源 → 寫 market → shards → daily history → build radar → 寫 `radar.json`。

- [ ] **Step 5: Verify batch tests**

Run: `node --test stock-research/tests/build-radar.test.cjs stock-research/tests/radar-engine.test.cjs stock-research/tests/radar-history.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add stock-research/scripts/build-radar.mjs stock-research/scripts/collect-market.mjs stock-research/tests/build-radar.test.cjs
git commit -m "feat: build daily whole-market bull radar"
```

### Task 4: 擴充前端 loader，安全讀取雷達資料

**Files:**
- Modify: `stock-research/market-loader.js`
- Modify: `stock-research/tests/market-loader.test.cjs`

**Interfaces:**
- Consumes: `data/radar.json`。
- Produces: `window.MarketLoader.radar(force=false)`，只接受 `schemaVersion===1`、`summary` object、`stocks` array。

- [ ] **Step 1: Write failing radar loader tests**

測試正常 payload、404、JSON 損壞、schema 錯誤、60 秒 cache、force refresh；radar 格式錯誤不可影響 `status()` / `company()`。

- [ ] **Step 2: Implement generic validator support and `radar()`**

保留既有公司 shard 驗證；不要把所有資料都強迫成 `datasets` schema。

- [ ] **Step 3: Run loader regression tests**

Run: `node --test stock-research/tests/market-loader.test.cjs`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add stock-research/market-loader.js stock-research/tests/market-loader.test.cjs
git commit -m "feat: load published bull radar data"
```

### Task 5: 新增「🚀 飆股雷達」頁面與個股展開

**Files:**
- Create: `stock-research/radar.js`
- Modify: `stock-research/index.html`
- Modify: `stock-research/app.js`
- Modify: `stock-research/style.css`
- Create: `stock-research/tests/radar-ui.test.cjs`

**Interfaces:**
- Consumes: `MarketLoader.radar()`、既有 `COMPANY_DIRECTORY`、既有 `makeRecord`/local research flow。
- Produces: `renderRadar(payload,state)`、`renderRadarDetail(stock)`、`radarStatusLabel(status)`；導航 view key 固定 `radar`。

- [ ] **Step 1: Write failing rendering helper tests**

測試狀態文字：`A↑ 剛突破`、`A↗ 主升段`、`A↘ 拉回守穩`、`A⚠ 接近失效`、`❌ 趨勢失效`；score breakdown 必須顯示每項分數與總分；無 defenseLow 顯示 `—`。

- [ ] **Step 2: Add the fourth navigation item and script**

`index.html` 左側新增 `data-view="radar"`；載入順序確保 `radar.js` 在 `app.js` 可使用前完成；page-title 對應「飆股雷達」。

- [ ] **Step 3: Implement radar page state and async loading**

進入 radar view 才呼叫 `MarketLoader.radar()`；載入中、空資料、錯誤各有獨立畫面；Top 10 取排序後第一至第十筆非 invalidated A/B/C 候選。

- [ ] **Step 4: Implement KPI and table**

上方 KPI：A 級候選、今日新增 A、創 240 日新高、趨勢失效。表格欄：排名、股票、分數、趨勢、創高、防守低點、量能、狀態；手機寬度下改為卡片，不要求水平拖曳才能看核心資訊。

- [ ] **Step 5: Implement detail panel visual language**

不用外部 chart library；以輕量 SVG 繪近 60 日 close、MA20、MA60。紅三角只標 breakout，高度固定；紅柱／水平標示 defenseLow。詳細區顯示 20/60/240D high、HH/HL、量比、營收 YoY、分數拆解與資料日期。

- [ ] **Step 6: Implement “加入研究工作台 / 查看完整研究”**

加入時以 `exchange:ticker` 查 company directory 並沿用 `makeRecord`；已存在就只切到該卡，不新增 duplicate；不得把 radar score 寫入 gates。`查看完整研究` 在研究卡不存在時先建立，再切 `workspace` view。

- [ ] **Step 7: Run UI helper and existing regression tests**

Run: `node --test stock-research/tests/radar-ui.test.cjs stock-research/tests/engine.test.cjs stock-research/tests/market-loader.test.cjs`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add stock-research/radar.js stock-research/index.html stock-research/app.js stock-research/style.css stock-research/tests/radar-ui.test.cjs
git commit -m "feat: add bull radar workspace page"
```

### Task 6: Workflow、資料新鮮度與完整回歸驗證

**Files:**
- Modify: `.github/workflows/stock-market-data.yml`
- Modify: `stock-research/update-status.js`
- Modify: `stock-research/tests/update-flow.test.cjs`
- Modify: `stock-research/README.md`

**Interfaces:**
- Consumes: Task 1–5 的測試與資料產生腳本。
- Produces: 可在排程與手動 workflow 中先測試再產生歷史與 radar，並在前端顯示 radar as-of / freshness。

- [ ] **Step 1: Extend workflow regression test**

固定要求 workflow 在 publish 前執行所有 `tests/*.cjs`，`collect-market.mjs` 會產生 history + radar，git add 仍只限制在 `stock-research/data/`；排程維持 07:20 與平日 14:20 台灣時間語意不變。

- [ ] **Step 2: Add radar freshness to status UI without breaking company refresh**

研究資料狀態與雷達資料日期分開顯示；雷達舊資料只能警告，不能覆寫研究卡或阻止工作台使用。

- [ ] **Step 3: Update README boundaries and architecture**

寫明「雷達是趨勢訊號，不是買進建議」、固定評分、資料時點、非盤中、history rolling 320 日、A/B/C 定義與新增檔案責任。

- [ ] **Step 4: Run the full test suite**

Run: `node --test stock-research/tests/*.cjs`
Expected: all PASS, zero skipped failures.

- [ ] **Step 5: Run a local fixture build smoke test**

以測試 fixtures 執行 `build-radar.mjs` 到 temp directory，驗證 JSON 可 parse、沒有 NaN/Infinity、排序穩定、summary 與 stocks 一致。

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/stock-market-data.yml stock-research/update-status.js stock-research/tests/update-flow.test.cjs stock-research/README.md
git commit -m "chore: integrate bull radar into scheduled publishing"
```

### Task 7: 最終整體驗證與部署前檢查

**Files:**
- Verify only; fix only defects discovered by tests/review.

**Interfaces:**
- Consumes: entire `design/bull-radar` branch.
- Produces: 可供 PR / merge 的 verified branch。

- [ ] **Step 1: Run all automated tests from repository root**

Run: `node --test stock-research/tests/*.cjs`
Expected: PASS.

- [ ] **Step 2: Check generated-data footprint and retention**

確認 history 僅保留 320 個交易日、沒有同日期 duplicates；`radar.json` 前端 payload 保持小型，不把 300 日全市場 history 傳給瀏覽器。

- [ ] **Step 3: Manual responsive smoke check**

至少檢查 desktop 與 390px mobile：左側／手機導航可進 radar；KPI、Top 10、detail、加入研究工作台均可操作；radar 載入失敗時研究工作台仍正常。

- [ ] **Step 4: Verify no research-state coupling**

建立 radar 候選→加入研究卡→確認 gates 初始值與原 `makeRecord` 相同；移除或刷新 radar 不改既有 localStorage 研究內容。

- [ ] **Step 5: Whole-branch diff review**

重點檢查：計分常數與 spec 一致、無未說明外部資料源、無盤中／買進推薦措辭、workflow timeout 可承受、GitHub Pages 只發布需要的前端資料。

- [ ] **Step 6: Prepare PR; do not merge until review passes**

PR 說明列出資料架構、評分規則、測試結果、已知限制與 rolling history 首次 bootstrap 狀態。
