# StockMaster AI V3.1 — macOS 本機安裝

## 支援環境
- Apple Silicon / Intel Mac
- macOS 具備 `python3`, `curl`, `open`
- 建議 Python 3.11+

## 第一次安裝
1. 下載/複製 `stock-research-v31` 資料夾。
2. Terminal 進入資料夾後先確保腳本可執行：
   ```bash
   chmod +x install.command StockMaster.command
   ```
3. 雙擊 `install.command`，或執行：
   ```bash
   ./install.command
   ```
4. 安裝器會建立 `.venv`、安裝 `backend/requirements.txt`，只有在 `.env` 不存在時才從 `.env.example` 建立，不會覆寫既有私密設定。

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

## 私人 API
在 `.env` 填入需要的本機憑證，例如：
```text
STOCKMASTER_MODE=local
TAISHIN_API_KEY=...
FUGLE_API_KEY=...
```
`.env` 已列入 `.gitignore`，不要提交或分享。

## 問題排查
- `請先雙擊 install.command`：`.venv` 尚未建立。
- `找不到 Python 3`：需先安裝 Python 3.11+。
- FastAPI 啟動失敗：查看 `logs/server.log`。
- 啟動流程/架構資訊：查看 `logs/startup.log`。
- macOS Gatekeeper 阻擋：可在 Finder 右鍵腳本 →「打開」一次，或從 Terminal 執行。
