#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

read -r -p "台新登入身分證字號：" TAISHIN_ID_INPUT
read -r -s -p "台新登入密碼：" TAISHIN_PASSWORD_INPUT; echo
read -r -p "台新 .pfx 憑證完整路徑：" TAISHIN_CERT_PATH_INPUT
read -r -s -p "憑證密碼：" TAISHIN_CERT_PASSWORD_INPUT; echo

if [ ! -f "$TAISHIN_CERT_PATH_INPUT" ]; then
  echo "找不到憑證：$TAISHIN_CERT_PATH_INPUT"
  exit 1
fi

TAISHIN_ID_INPUT="$TAISHIN_ID_INPUT" \
TAISHIN_PASSWORD_INPUT="$TAISHIN_PASSWORD_INPUT" \
TAISHIN_CERT_PATH_INPUT="$TAISHIN_CERT_PATH_INPUT" \
TAISHIN_CERT_PASSWORD_INPUT="$TAISHIN_CERT_PASSWORD_INPUT" \
python3 - <<'PY'
import os
from pathlib import Path

def quote(value: str) -> str:
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'

path = Path('.env')
existing = path.read_text(encoding='utf-8').splitlines() if path.exists() else ['STOCKMASTER_MODE=local']
keys = {'TAISHIN_ID','TAISHIN_PASSWORD','TAISHIN_CERT_PATH','TAISHIN_CERT_PASSWORD'}
kept = [line for line in existing if line.split('=',1)[0].strip() not in keys]
values = {
    'TAISHIN_ID': os.environ['TAISHIN_ID_INPUT'],
    'TAISHIN_PASSWORD': os.environ['TAISHIN_PASSWORD_INPUT'],
    'TAISHIN_CERT_PATH': os.environ['TAISHIN_CERT_PATH_INPUT'],
    'TAISHIN_CERT_PASSWORD': os.environ['TAISHIN_CERT_PASSWORD_INPUT'],
}
kept += [f'{k}={quote(v)}' for k,v in values.items()]
path.write_text('\n'.join(kept).rstrip()+'\n', encoding='utf-8')
PY

chmod 600 .env
echo "台新 Nova 本機設定已寫入 .env（權限 600）。"
echo "接著執行 StockMaster.command；帳號/密碼/憑證密碼不會寫入 Git。"
