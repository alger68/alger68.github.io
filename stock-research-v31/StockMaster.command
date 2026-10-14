#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs
if [ ! -x .venv/bin/python ]; then echo "請先雙擊 install.command"; exit 1; fi
if [ -f .stockmaster.pid ] && kill -0 "$(cat .stockmaster.pid)" 2>/dev/null; then
  open "http://127.0.0.1:8000/"
  exit 0
fi
set -a
[ -f .env ] && . ./.env
set +a
. .venv/bin/activate
nohup python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 > logs/server.log 2>&1 &
echo $! > .stockmaster.pid
for i in {1..40}; do
  if curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1; then open "http://127.0.0.1:8000/"; exit 0; fi
  sleep 0.25
done
echo "啟動失敗，請查看 logs/server.log"
exit 1
