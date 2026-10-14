#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs
exec > >(tee -a logs/startup.log) 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] StockMaster AI startup · arch=$(uname -m)"
command -v curl >/dev/null || { echo "找不到 curl，無法執行健康檢查。"; exit 1; }
command -v open >/dev/null || { echo "找不到 macOS open 指令。"; exit 1; }
if [ ! -x .venv/bin/python ]; then echo "請先雙擊 install.command"; exit 1; fi

if [ -f .stockmaster.pid ]; then
  if kill -0 "$(cat .stockmaster.pid)" 2>/dev/null; then
    echo "StockMaster 已在執行，直接開啟瀏覽器。"
    open "http://127.0.0.1:8000/"
    exit 0
  fi
  rm -f .stockmaster.pid
fi

set -a
[ -f .env ] && . ./.env
set +a
. .venv/bin/activate
nohup python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 > logs/server.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > .stockmaster.pid

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then kill "$SERVER_PID" 2>/dev/null || true; fi
  rm -f .stockmaster.pid
}
trap cleanup INT TERM

for i in {1..40}; do
  if curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    trap - INT TERM
    echo "FastAPI 已就緒，開啟 http://127.0.0.1:8000/"
    open "http://127.0.0.1:8000/"
    exit 0
  fi
  sleep 0.25
done

echo "啟動失敗，請查看 logs/server.log"
cleanup
exit 1
