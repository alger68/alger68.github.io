# Stock Research Dashboard V3.0

GitHub Pages 官方資料接入版。V3 Phase 1 把原研究工作台改成 decision-first 首頁：先看資料可信度、股價／營收／估值、五門檻與 Decision，再展開原本的七法、筆記與證據工作區。

## V3 Phase 1

本階段已加入：

- `canonical.js`：統一財務資料欄位、period / scope / source / fetchedAt / verified。
- `refresh.js`：逐步顯示股價、營收、財報、驗證、分析與估值狀態；未接入來源明確標示 `skipped` 或 warning。
- `scoring.js`：100 分制的透明評分核心；缺資料不補分，另外顯示 confidence。
- `valuation.js`：Bear / Base / Bull P/E × EPS 情境與相對現價差距；使用者輸入固定標示 `internal_sensitivity`，不冒充市場財測。
- `decision.js`：五門檻 + rule-first Decision；資料信心不足時回傳 `INSUFFICIENT_DATA`。
- `dashboard.js` / `v3-dashboard.js` / `v3.css`：V3 首頁 presentation model 與響應式版面。
- collector metadata：資料集新增 `sourceName`、`scopeHint`、`fetchedAt` 等驗證資訊。

### V3 核心原則

1. 官方來源優先。
2. 財務數字必須保留期別與口徑；Q2 單季和 H1 累計不能混用。
3. 未核對 EPS 不進入 verified valuation。
4. API 或資料來源失敗時保留舊資料並顯示 warning，不假裝更新成功。
5. AI／文字說明不得創造 EPS、營收或目標價。
6. Decision 先由規則產生，文字只能解釋，不能改變狀態與數字。
7. Notion 仍維持人工確認，Phase 1 不自動寫入。

## 開啟

部署路徑：`https://alger68.github.io/stock-research/`。亦可下載此資料夾，以瀏覽器開啟 `index.html`，不依賴外部字型或前端套件。

## 使用

1. 在 V3 首頁輸入公司名稱或代號，如研華、2395、0050。
2. 點選結果，沿用既有「我的研究」卡片與官方資料更新流程。
3. 首頁會顯示 Quick Cards、資料更新 pipeline、Rule Score、五門檻、財務摘要與估值情境。
4. 原「研究筆記、七法與原工作台」收在下方可展開區域，既有 localStorage 資料相容。
5. 按「更新全部資料」讀取網站目前最新成功抓取的官方快照；不是盤中強制刷新。
6. 在原工作台的「估值試算」輸入 Bear / Base / Bull EPS 與 P/E 後，V3 會顯示三情境合理價。
7. 使用「匯出我的研究」下載 JSON 備份；Notion 尚未自動寫入。

## 資料與保存

- 名稱目錄沿用 2026-10-05 公開資料快照，共 1,988 筆（上市 1,095、上櫃 892、ETF 0050 一筆）；不是全部 ETF 目錄，也不是即時交易狀態。
- 目錄來源：TWSE OpenAPI `t187ap03_L`、TPEx `mopsfin_t187ap03_O`、TWSE 0050 ETF 商品頁；完整來源列在 `directory.js`。
- 個人研究用 localStorage 保存；瀏覽器清除資料、換裝置或私密視窗可能造成資料不可用，請匯出備份。
- 使用者輸入不寫回 GitHub。瀏覽器本機保存不是加密保管庫。
- 假設案例全部虛構，只供看版型及驗算，不是市場建議。

## 功能邊界

已接入：官方盤後價格、月營收、歷史 PE／PB、一般業財報摘要、V3 驗證層、部分規則評分、內部估值 sensitivity、資料更新狀態。

尚未接入：盤中即時行情、完整 FCF 歷史、完整 RSI/MACD/KD/K 線序列、公告／新聞事件流、KOL 原文抓取、完整 SEPA／VCP、私人資料跨裝置同步、Notion 自動寫入。未接入的資料在 V3 直接顯示缺口，不生成假資料。

## 結構與驗證

主要檔案：

- `index.html`：V3 首頁骨架。
- `style.css`：原工作台版面。
- `v3.css`：V3 響應式 Dashboard。
- `directory.js`：公開公司身分資料。
- `engine.js`：原研究門檻、選法、搜尋與相容函式。
- `market.js`：官方資料解析與舊資料保護。
- `canonical.js`：canonical data / verification。
- `refresh.js`：更新 pipeline 狀態機。
- `scoring.js`：100 分制評分核心。
- `valuation.js`：透明估值情境。
- `decision.js`：五門檻與 rule-first Decision。
- `dashboard.js`：無 DOM 的 presentation model。
- `v3-dashboard.js`：V3 browser rendering / 舊流程整合。
- `app.js`：既有互動、本機紀錄與研究頁面。
- `scripts/collect-market.mjs`：官方市場資料收集。
- `scripts/market-meta.mjs`：collector source / scope metadata。

測試：

```bash
node --test stock-research/tests/*.test.cjs
```

## 官方資料更新方式

公開資料收集工作流程在台灣時間每日 07:20、平日 14:20 執行，另可在 GitHub Actions 手動啟動；排程可能排隊，以資料來源擷取時間為準。工作流程自動從 TWSE／TPEx 官方公開 API 取得市場資料並發布快照。

前端更新使用 no-store 請求讀取網站目前最新成功快照，不是即時強制交易所或 GitHub 工作流程重新抓取。行情日期、營收月份、財報期別和擷取時間分開顯示；過期或失敗不改成今日數字。

財報摘要保留來源季別；單季／累計口徑尚未核定前不年化 EPS、不拿來產生 verified 前瞻估值。歷史 PE 是來源當日歷史本益比。

來源某個模組失敗時保留該模組前版；較舊資料不覆蓋較新期別。市場身分以交易所及代號一起匹配；ETF 不混入公司財報與公司 Decision。
