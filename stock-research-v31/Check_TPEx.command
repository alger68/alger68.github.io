#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="$(cat .stockmaster.port 2>/dev/null || echo 8000)"
BASE_URL="http://127.0.0.1:$PORT"
OUT="logs/tpex-check-$(date '+%Y%m%d-%H%M%S').txt"
mkdir -p logs

{
  echo "StockMaster TPEx Audit"
  echo "time=$(date '+%Y-%m-%d %H:%M:%S')"
  echo "arch=$(uname -m)"
  echo "base_url=$BASE_URL"
  echo "probe_ticker=6488"
  echo
  for endpoint in \
    '/api/health' \
    '/api/stocks/search?q=6488' \
    '/api/stocks/6488/summary?exchange=TPEX' \
    '/api/stocks/6488/history?exchange=TPEX&range=1m' \
    '/api/stocks/6488/technicals?exchange=TPEX' \
    '/api/stocks/6488/financials?exchange=TPEX' \
    '/api/stocks/6488/news?exchange=TPEX' \
    '/api/status/sources'; do
    echo "===== $endpoint ====="
    curl -fsS "$BASE_URL$endpoint" 2>&1 || echo "REQUEST_FAILED"
    echo; echo
  done
  echo "===== server.log tail ====="
  tail -n 80 logs/server.log 2>/dev/null || echo "server.log not found"
} | tee "$OUT"

echo
echo "TPEx 檢查完成：$OUT"
echo "不會主動輸出 .env、台新帳號、密碼或憑證密碼。"
open -R "$OUT" 2>/dev/null || true
