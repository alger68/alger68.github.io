# StockMaster V3.1 Stage 07 — Financial Statements

## Status
Complete

## Goal
建立財報摘要服務與 MOPS provider contract，保留 EPS 口徑驗證邊界並明確處理缺少現金流資料的情況。

## Completed
- 建立 `build_financial_summary()`。
- 建立收入、毛利率、營益率、淨利率計算。
- 建立 EPS verified gate。
- 建立 OCF / FCF 計算。
- 建立 MOPS provider contract。
- 建立 `/api/stocks/{ticker}/financials`。

## Files Changed
- `stock-research-v31/backend/app/services/financials.py`
- `stock-research-v31/backend/app/providers/mops.py`
- `stock-research-v31/backend/app/api/financials.py`
- `stock-research-v31/backend/app/main.py`
- `stock-research-v31/backend/tests/test_financials.py`

## API / Interface Changes
- `build_financial_summary(income, scope_hint, balance=None, cashflow=None)`
- `GET /api/stocks/{ticker}/financials`

## Data Sources
- MOPS / official financial-statement adapter contract.

## Verification
RED:
- Command: `PYTHONPATH=. pytest tests/test_financials.py -q`
- Result before implementation: `2 failed` because financial service did not exist.

GREEN + regression:
- Command included all prior backend tests.
- Result: `19 passed`.

## Decisions / Rulings
- `quarter_unspecified` 永遠不自動轉成 single-quarter EPS。
- FCF 只有 OCF 與 CAPEX 同時存在時才計算；否則保持 null。

## Known Issues
- MOPS balance/cashflow URL 尚未在 provider config 中寫死，後續 deployment/source integration 再設定。
- 金融業等特殊產業財報格式需要後續獨立 adapter。

## Git
- Branch: `feat/stockmaster-v31-fastapi-local`
- Stage code head before MARK: `f641befb05bc413e6c0e1b9866d4fcebf50cfd3c`

## Next Stage
Stage 08 — Scoring + Valuation + Rule-first Decision.
