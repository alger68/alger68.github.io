#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

command -v curl >/dev/null || { echo "找不到 curl"; exit 1; }
command -v lsof >/dev/null || { echo "找不到 lsof"; exit 1; }

FOUND=0
for PORT in 8000 8001 8002 8003 8004 8005; do
  BASE_URL="http://127.0.0.1:$PORT"
  HEALTH="$(curl -fsS "$BASE_URL/api/health" 2>/dev/null || true)"
  if [ -z "$HEALTH" ]; then
    continue
  fi
  IS_STOCKMASTER="$(printf '%s' "$HEALTH" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("yes" if d.get("version")=="3.1" else "")' 2>/dev/null || true)"
  [ "$IS_STOCKMASTER" = "yes" ] || continue
  FOUND=1
  BUILD="$(printf '%s' "$HEALTH" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("build","legacy"))' 2>/dev/null || echo legacy)"
  PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$PIDS" ]; then
    echo "停止 StockMaster build=$BUILD port=$PORT pid=$PIDS"
    kill $PIDS 2>/dev/null || true
  fi
done

rm -f .stockmaster.pid .stockmaster.port
if [ "$FOUND" -eq 0 ]; then
  echo "8000–8005 沒有偵測到 StockMaster 服務。"
else
  sleep 0.5
  echo "StockMaster 舊/新本機服務已清理。"
fi

echo "接下來請雙擊 StockMaster.command 啟動 BUILD 15.4A。"
