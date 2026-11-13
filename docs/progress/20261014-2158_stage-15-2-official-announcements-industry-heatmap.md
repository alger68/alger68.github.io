# StockMaster V3.1 Stage 15.2 — Official Announcements + Industry Heatmap

## Status
Complete in code/tests — live user-side network validation still pending

## Goal
修正 Mac 實機驗收中 ⑥ 公司新聞/重大事件長期為空，以及 ⑨ 市場熱力圖缺少產業分類的問題；優先使用主管機關/交易所官方資料，不以不明新聞來源補值。

## Completed
- 接入 TWSE OpenAPI `/opendata/t187ap04_L` 上市公司每日重大訊息。
- 接入 TPEx OpenAPI `/openapi/v1/mopsfin_t187ap04_O` 上櫃公司每日重大訊息。
- 依 exchange+ticker 過濾，只顯示當前公司的官方重大訊息。
- 支援 TWSE 中文欄位與 TPEx 英文 OpenAPI 欄位 aliases。
- 民國日期/時間正規化為 `+08:00` ISO timestamp。
- 重大訊息連結指向 MOPS 公司查詢頁，並用 event key 保持多筆公告不會被 URL dedupe 誤刪。
- `DirectoryService` 現在保留官方 `產業別 / SecuritiesIndustryCode`。
- 新增官方產業代碼名稱表，含半導體、電腦週邊、電子零組件、數位雲端、運動休閒、居家生活等。
- Nova TSE/OTC snapshot 透過 `IndustryEnrichedMarketProvider` 與官方公司目錄交叉比對，熱力圖不再一律落入 `其他`。
- 搜尋結果也同步帶 industry / industry_code，可供後續基本面卡片使用。

## Files Changed
- `stock-research-v31/backend/app/providers/news.py`
- `stock-research-v31/backend/app/services/directory.py`
- `stock-research-v31/backend/app/bootstrap.py`
- `stock-research-v31/backend/tests/test_news.py`
- `stock-research-v31/backend/tests/test_directory_search.py`
- `stock-research-v31/backend/tests/test_bootstrap.py`

## API / Interface Changes
- `GET /api/stocks/{ticker}/news?exchange=TWSE|TPEX` 現在 production 直接查官方每日重大訊息來源。
- `DirectoryService.search()` result 新增 `industry_code`, `industry`。
- `DirectoryService.industry_map()` 新增 exchange+ticker -> official industry mapping。
- `GET /api/market/overview` 的 `sectors` 現在使用官方產業名稱聚合 Nova market snapshot。

## Data Sources
- TWSE OpenAPI: `https://openapi.twse.com.tw/v1/opendata/t187ap04_L`
- TPEx OpenAPI: `https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap04_O`
- TWSE company directory: `https://openapi.twse.com.tw/v1/opendata/t187ap03_L`
- TPEx company directory: `https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O`
- Industry names follow TWSE/TPEx official industry-code definitions.

## Verification
A local package snapshot corresponding to Stage 15.1 was patched with the exact Stage 15.2 branch contents because the execution container cannot resolve `github.com` for a fresh clone.

### Backend
Command:
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=. pytest -q`

Observed result:
`50 passed in 0.40s`

Coverage added:
- TWSE announcement ticker filtering + ROC timestamp normalization.
- TPEx English OpenAPI field aliases.
- source failure -> empty list, no fabricated event.
- TWSE + TPEx official industry mapping.
- Nova market snapshot -> official industry name end-to-end wiring.

### Frontend
Command:
`node --test tests/*.test.cjs`

Observed result:
`9 passed, 0 failed`

### JavaScript syntax
Command:
`node --check frontend/js/*.js` (per file)

Observed result:
PASS

### Environment limitation
Fresh `git clone` remains unavailable in the container because DNS cannot resolve `github.com`; tests were run from the previously produced Stage 15.1 Mac package with the exact changed files patched to the current branch state.

## Decisions / Rulings
- Use exchange official material announcements before adding general-media news.
- Do not scrape MOPS HTML for this stage because official TWSE/TPEx OpenAPI daily announcement datasets are available and structurally safer.
- Market sector classification comes from official company profile data, not guessed from company name or Nova snapshot.
- If announcement OpenAPI is unavailable, return an empty list; do not fabricate headlines.

## Known Issues
- Daily重大訊息 OpenAPI is a daily aggregation source, not second-by-second MOPS realtime disclosure.
- If the current company has no announcement in the daily dataset, the panel legitimately remains empty; historical announcement search is a later enhancement.
- General financial/media news is not yet aggregated; this stage intentionally focuses on official disclosures.
- Live TWSE/TPEx endpoint access from the user's Mac remains to be checked during external validation.

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Draft PR: #4
- Current Stage 15.2 head includes announcement provider, industry enrichment, and regression tests.

## Next Stage
External Mac validation: run 2395 and another stock with a same-day official disclosure; confirm ⑥ shows official重大訊息 and ⑨ shows named industry groups. Then add historical MOPS events / general news only if needed.
