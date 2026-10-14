#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs
exec > >(tee -a logs/startup.log) 2>&1

EXPECTED_BUILD="15.4B"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] StockMaster AI build=$EXPECTED_BUILD · arch=$(uname -m)"
command -v curl >/dev/null || { echo "找不到 curl，無法執行健康檢查。"; exit 1; }
command -v open >/dev/null || { echo "找不到 macOS open 指令。"; exit 1; }
command -v lsof >/dev/null || { echo "找不到 lsof，無法檢查連接埠。"; exit 1; }
if [ ! -x .venv/bin/python ]; then echo "請先雙擊 install.command"; exit 1; fi

health_build() {
  curl -fsS "$1/api/health" 2>/dev/null | .venv/bin/python -c 'import json,sys; print(json.load(sys.stdin).get("build", ""))' 2>/dev/null || true
}

if [ -f .stockmaster.pid ]; then
  OLD_PID="$(cat .stockmaster.pid)"
  OLD_PORT="$(cat .stockmaster.port 2>/dev/null || echo 8000)"
  if kill -0 "$OLD_PID" 2>/dev/null; then
    BASE_URL="http://127.0.0.1:$OLD_PORT"
    if [ "$(health_build "$BASE_URL")" = "$EXPECTED_BUILD" ]; then
      echo "StockMaster build $EXPECTED_BUILD 已在執行：$BASE_URL"
      open "$BASE_URL/"
      exit 0
    fi
    echo "偵測到同資料夾的舊 StockMaster 程序，重新啟動新版。"
    kill "$OLD_PID" 2>/dev/null || true
    sleep 0.5
  fi
  rm -f .stockmaster.pid .stockmaster.port
fi

PORT=""
for candidate in 8000 8001 8002 8003 8004 8005; do
  if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT="$candidate"
    break
  fi
  EXISTING="http://127.0.0.1:$candidate"
  EXISTING_BUILD="$(health_build "$EXISTING")"
  echo "Port $candidate 已被使用${EXISTING_BUILD:+（StockMaster build $EXISTING_BUILD）}，改試下一個 port。"
done
[ -n "$PORT" ] || { echo "8000–8005 都被占用，請先關閉舊服務。"; exit 1; }
BASE_URL="http://127.0.0.1:$PORT"

set -a
[ -f .env ] && . ./.env
set +a
. .venv/bin/activate
nohup python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port "$PORT" > logs/server.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > .stockmaster.pid
echo "$PORT" > .stockmaster.port

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then kill "$SERVER_PID" 2>/dev/null || true; fi
  rm -f .stockmaster.pid .stockmaster.port
}
trap cleanup INT TERM

for i in {1..60}; do
  BUILD="$(health_build "$BASE_URL")"
  if [ "$BUILD" = "$EXPECTED_BUILD" ]; then
    trap - INT TERM
    echo "FastAPI build $BUILD 已就緒，開啟 $BASE_URL/"
    open "$BASE_URL/"
    exit 0
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "新 FastAPI 程序已退出，請查看 logs/server.log"
    cleanup
    exit 1
  fi
  sleep 0.25
done

echo "啟動逾時或 build 驗證失敗，請查看 logs/server.log"
cleanup
exit 1
