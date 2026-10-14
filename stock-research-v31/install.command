#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
PYTHON_BIN="${PYTHON_BIN:-python3}"
command -v "$PYTHON_BIN" >/dev/null || { echo "找不到 Python 3"; exit 1; }
if [ ! -d .venv ]; then "$PYTHON_BIN" -m venv .venv; fi
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

# 台新 Nova SDK 不是 PyPI 套件；若使用者已把官方 Apple Silicon wheel 放進 vendor/，自動安裝。
NOVA_WHEEL="$(find vendor . -maxdepth 2 -type f -name 'taishin_sdk*.whl' 2>/dev/null | head -n 1 || true)"
if [ -n "$NOVA_WHEEL" ]; then
  echo "安裝台新 Nova SDK：$NOVA_WHEEL"
  python -m pip install "$NOVA_WHEEL"
else
  echo "未找到 taishin_sdk wheel；可先使用 TWSE/TPEx，之後把官方 Mac ARM64 wheel 放到 vendor/ 再執行本安裝程式。"
fi

if [ ! -f .env ]; then cp .env.example .env; fi
echo "StockMaster AI 安裝完成。"
