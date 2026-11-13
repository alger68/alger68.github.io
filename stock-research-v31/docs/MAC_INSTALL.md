# StockMaster AI V3.1 — macOS 本機安裝

## 支援環境
- Apple Silicon / Intel Mac
- macOS 具備 `python3`, `curl`, `open`
- 一般 FastAPI 模式可用 Python 3.11+
- **台新 Nova SDK 官方目前支援 Python 3.8–3.12；Apple Silicon 建議 Python 3.12 + Mac ARM64 wheel**

## 第一次安裝
1. 下載/複製 `stock-research-v31` 資料夾。
2. 若要使用台新 Nova，把台新官網下載的 Mac ARM64 `taishin_sdk*.whl` 放到 `vendor/`。
3. Terminal 進入資料夾後先確保腳本可執行：
   ```bash
   chmod +x install.command StockMaster.command Configure_Taishin.command
   ```
4. 雙擊 `install.command`，或執行：
   ```bash
   ./install.command
   ```
5. 安裝器會建立 `.venv`、安裝 FastAPI dependencies；若 `vendor/` 有台新 wheel，會一併安裝。只有 `.env` 不存在時才從 `.env.example` 建立，不會覆寫既有私密設定。

## 設定台新 Nova
不要把帳號、密碼或憑證內容貼到聊天、GitHub 或前端 JavaScript。

最簡單方式：雙擊 `Configure_Taishin.command`，依序在本機輸入：
- 台新登入身分證字號
- 台新登入密碼
- `.pfx` 憑證完整路徑
- 憑證密碼

設定程式只會寫入本機 `.env`，並把檔案權限設為 `600`。

等價 `.env` 格式：
```text
STOCKMASTER_MODE=local
TAISHIN_ID="..."
TAISHIN_PASSWORD="..."
TAISHIN_CERT_PATH="/Users/you/.../certificate.pfx"
TAISHIN_CERT_PASSWORD="..."
```

## 每日啟動
雙擊 `StockMaster.command`，或：
```bash
./StockMaster.command
```

啟動器會：
- 記錄 CPU architecture 到 `logs/startup.log`
- 防止重複啟動同一個 FastAPI 程序
- 清除 stale PID
- 啟動 `127.0.0.1:8000`
- 輪詢 `/api/health`
- 健康後才開啟瀏覽器
- 啟動失敗時清理背景程序/PID，並提示查看 `logs/server.log`

## 台新資料優先順序
本機 `.env` 的 Nova 資料完整且 SDK 能登入時：
1. 個股最新行情：台新 Nova intraday quote
2. 市場總覽：台新 Nova TSE/OTC snapshot
3. 月營收 / P/E / 財報：TWSE / TPEx / MOPS 官方來源
4. 台新 Nova 不可用時，個股行情自動回退官方資料

自選股仍保存在本機 `data/watchlist.json`，現在可以直接在 Dashboard 「加入 / 點選 / 移除」。

## 問題排查
- `請先雙擊 install.command`：`.venv` 尚未建立。
- 找不到台新 SDK：確認 Mac ARM64 wheel 已放在 `vendor/`，再跑一次 `install.command`。
- Python 3.13：台新 Nova wheel 可能無法安裝；建議使用 Python 3.12。
- 台新登入失敗：先確認 Nova API 風險預告書/程式交易權限、登入密碼、`.pfx` 路徑與憑證密碼。
- FastAPI 啟動失敗：查看 `logs/server.log`。
- 啟動流程/架構資訊：查看 `logs/startup.log`。
- macOS Gatekeeper 阻擋：可在 Finder 右鍵腳本 →「打開」一次，或從 Terminal 執行。
