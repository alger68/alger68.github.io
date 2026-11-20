#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${PYTHON_BIN:-}" ]; then
  for candidate in python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then PYTHON_BIN="$candidate"; break; fi
  done
fi
[ -n "${PYTHON_BIN:-}" ] || { echo "找不到 Python 3；台新 Nova 建議 Python 3.10–3.12。"; exit 1; }
command -v "$PYTHON_BIN" >/dev/null || { echo "找不到 $PYTHON_BIN"; exit 1; }

if [ ! -d .venv ]; then "$PYTHON_BIN" -m venv .venv; fi
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

# 台新 Nova SDK 不是 PyPI 套件；若使用者已把官方 Apple Silicon wheel 放進 vendor/，自動安裝。
NOVA_WHEEL="$(find vendor . -maxdepth 2 -type f -name 'taishin_sdk*.whl' 2>/dev/null | head -n 1 || true)"
if [ -n "$NOVA_WHEEL" ]; then
  PY_MINOR="$(python -c 'import sys; print(sys.version_info.minor)')"
  PY_MAJOR="$(python -c 'import sys; print(sys.version_info.major)')"
  if [ "$PY_MAJOR" -ne 3 ] || [ "$PY_MINOR" -gt 12 ]; then
    echo "台新 Nova SDK 官方目前支援 Python 3.8–3.12；目前 venv 是 $(python -V 2>&1)。"
    echo "請安裝 Python 3.12 後刪除 .venv，再重新執行 install.command。"
    exit 1
  fi
  echo "安裝台新 Nova SDK：$NOVA_WHEEL"
  python -m pip install "$NOVA_WHEEL"
else
  echo "未找到 taishin_sdk wheel；可先使用 TWSE/TPEx。"
  echo "若要使用台新帳號行情，請把官方 Mac ARM64 wheel 放到 vendor/ 再重新執行本安裝程式。"
fi

if [ ! -f .env ]; then cp .env.example .env; fi
echo "StockMaster AI 安裝完成。"
