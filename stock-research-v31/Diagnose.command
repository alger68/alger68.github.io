#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="$(cat .stockmaster.port 2>/dev/null || echo 8000)"
BASE_URL="http://127.0.0.1:$PORT"
OUT="logs/diagnose-$(date '+%Y%m%d-%H%M%S').txt"
mkdir -p logs

{
  echo "StockMaster Diagnose"
  echo "time=$(date '+%Y-%m-%d %H:%M:%S')"
  echo "arch=$(uname -m)"
  echo "base_url=$BASE_URL"
  echo
  for endpoint in \
    /api/health \
    /api/market/overview \
    /api/watchlist \
    '/api/stocks/2395/news?exchange=TWSE' \
    '/api/stocks/2395/summary?exchange=TWSE'; do
    echo "===== $endpoint ====="
    curl -fsS "$BASE_URL$endpoint" 2>&1 || echo "REQUEST_FAILED"
    echo; echo
  done
  echo "===== server.log tail ====="
  tail -n 60 logs/server.log 2>/dev/null || echo "server.log not found"
} | tee "$OUT"

echo
echo "診斷完成：$OUT"
echo "這份檔案不會主動列出 .env、帳號、密碼或憑證密碼。"
open -R "$OUT" 2>/dev/null || true
