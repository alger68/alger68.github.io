# StockMaster AI V3.1

FastAPI + HTML/CSS/JavaScript 的台股研究工作台。V3.1 以 Mac 本機完整版為主，公開模式可搭配 Render Free FastAPI，並在後端失效時使用既有 GitHub Pages company snapshot 做唯讀摘要 fallback。

## 本機啟動

第一次：
```bash
chmod +x install.command StockMaster.command
./install.command
```

日常：
```bash
./StockMaster.command
```

瀏覽器開啟 `http://127.0.0.1:8000/`。

## 已實作

- FastAPI health/config、stock summary、price、refresh job API
- TWSE / TPEx 官方 quote、月營收、估值與一般業損益表 provider
- TWSE 官方 `STOCK_DAY` 月歷史行情與 1M/3M/6M/YTD/1Y/3Y/5Y 聚合
- SMA5/20/60/120/240、RSI14、MACD、KD、Bollinger
- Canonical verification、舊資料保護、行情 freshness
- 10/14 checked + 10/13 quote → `stale / 昨日收盤`
- 公司目錄搜尋：代號、公司名、臺/台正規化
- 財報 margin / OCF / FCF contract；scope 不明 EPS 不進 verified valuation
- 100 分 Score、Bear/Base/Bull、rule-first Decision
- Dashboard：搜尋、Quick Cards、行情、基本面、技術、新聞區、財報、自選股、市場總覽、Decision
- JSON Watchlist
- Public snapshot fallback
- Taishin/Fugle local-only credential contract
- 每 Stage Markdown MARK + `docs/progress/INDEX.md`

## 資料完整性規則

- 缺資料保持 null / `—`，不補 0。
- 較舊 period 不覆蓋較新 period。
- 未確認 single-quarter/YTD 的 EPS 不進 verified valuation。
- 私人 API key 只存在 `.env`；`.env` 已 gitignore。
- Public snapshot fallback 為唯讀且降低 confidence，不冒充即時資料。

## 尚待外部驗收 / 後續來源

- Taishin/Fugle 真實 SDK/auth fetcher 需用使用者帳戶在 Mac 本機驗證。
- TPEx 歷史 K 線目前沒有 production historical adapter；TWSE 已接官方 history。
- News service 已有安全 normalization/API，但 production public news fetcher 尚未指定；TWSE OpenAPI 可再接上市公司每日重大訊息 `t187ap04_L`。
- Market overview engine/API 已完成，但 production market rows provider 尚未綁定，因此未接資料時會顯示空市場摘要。
- Render config 已提交，但未建立外部 Render service，也尚未設定正式 `STOCKMASTER_RENDER_API`。
- 真正 Apple Silicon 雙擊、Gatekeeper、Safari 390px/桌機視覺需在使用者 Mac 驗收。

詳見 `docs/MAC_INSTALL.md`、`docs/RELEASE_CHECKLIST.md` 與 repository `docs/progress/`。
