# REST / WebSocket API 規格書

## 版本資訊
- **Base URL**: `https://api.example.com/v1`
- **認證方式**: OAuth2 Authorization Code with PKCE，取得 Bearer Token 後以 `Authorization: Bearer <token>` 使用。
- **WebSocket Endpoint**: `wss://api.example.com/ws`

---

## REST API

### 1. 行情查詢

#### GET `/securities`
- 說明：取得可交易標的清單。
- Query 參數：
  - `exchange` (optional)
  - `type` (optional)
- 回應：`200 OK`
```json
{
  "items": [
    {"id": 1, "symbol": "2330", "exchange": "TWSE", "type": "stock", "currency": "TWD"}
  ],
  "total": 1
}
```

#### GET `/securities/{security_id}/daily-prices`
- 說明：查詢特定標的日線行情。
- Query：`start_date`, `end_date`, `limit`, `page`。
- 回應 `200 OK`：時間序列資料列表。

#### GET `/securities/{security_id}/institutional-trades`
- 說明：查詢特定標的三大法人交易資料。
- Query：`start_date`, `end_date`。

#### GET `/securities/{security_id}/financial-reports`
- 說明：取得財報摘要。
- Query：`report_type`, `year`, `quarter`。

### 2. 策略管理與回測

#### POST `/strategies`
- 說明：建立策略。
- Body：
```json
{
  "name": "mean_reversion",
  "security_id": 1,
  "parameters": {"lookback": 20, "entry_z": -2, "exit_z": 0}
}
```
- 回應：`201 Created`，包含策略基本資訊。

#### GET `/strategies`
- 說明：取得登入使用者策略列表，支援 `name`、`security_id` 查詢。

#### GET `/strategies/{strategy_id}`
- 說明：取得策略詳細資訊與最近回測結果摘要。

#### POST `/strategies/{strategy_id}/backtests`
- 說明：執行策略回測。
- Body：`{"start_date": "2022-01-01", "end_date": "2022-12-31", "initial_capital": 1000000}`
- 回應：`202 Accepted`，並回傳回測任務 ID。

#### GET `/backtests/{backtest_id}`
- 說明：查詢回測狀態與績效。
- 回應：若完成，回傳 `performance_metrics` 與結果檔案下載連結。

### 3. 通知設定

#### POST `/alerts`
- 說明：建立提醒。
- Body：
```json
{
  "security_id": 1,
  "strategy_id": 3,
  "channel": "webhook",
  "condition": {"type": "price_cross", "threshold": 500}
}
```

#### GET `/alerts`
- 說明：取得使用者提醒列表，支援狀態與標的過濾。

#### PATCH `/alerts/{alert_id}`
- 說明：更新提醒條件或狀態。

#### DELETE `/alerts/{alert_id}`
- 說明：停用或刪除提醒。

### 4. 使用者與權限

#### POST `/auth/token`
- 說明：OAuth2 Token 交換端點（public client PKCE）。

#### POST `/auth/refresh`
- 說明：以 refresh token 換取新 access token。

#### GET `/users/me`
- 說明：取得登入者資訊與角色權限。

#### GET `/admin/users`
- 說明：需 `admin` 角色。列出所有使用者與角色。

---

## WebSocket API

### 1. 實時行情頻道
- 路徑：`wss://api.example.com/ws/market`
- 認證：連線時於 query string 加入 `access_token` 或於 HTTP header 使用 Bearer。
- 訂閱訊息：
```json
{"action": "subscribe", "channels": [{"type": "ticker", "symbol": "2330"}]}
```
- 系統回應心跳：`{"type": "heartbeat", "ts": "2023-08-12T02:30:00Z"}` 每 15 秒。

### 2. 回測狀態通知
- 路徑：`wss://api.example.com/ws/backtests`
- 用於推送回測進度與結果。訊息格式：
```json
{
  "type": "backtest.update",
  "backtest_id": 123,
  "status": "completed",
  "performance": {"sharpe": 1.25, "max_drawdown": -0.12}
}
```

### 3. 警示通知頻道
- 路徑：`wss://api.example.com/ws/alerts`
- 當條件觸發時推送：
```json
{
  "type": "alert.triggered",
  "alert_id": 12,
  "symbol": "2330",
  "triggered_at": "2023-08-12T03:00:00Z",
  "message": "Price crossed 500"
}
```

---

## 錯誤格式
所有 REST API 之錯誤回應統一為：
```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Resource not found"
  }
}
```

## 分頁與排序
- 預設 page size 50，最大 200。
- 透過 `page` 與 `page_size` 控制。
- 排序使用 `sort`、`order` 參數，例如 `?sort=trade_date&order=desc`。

## 範例流程
1. 使用者透過 OAuth2 PKCE 登入並取得 access token。
2. 呼叫 `/securities/{id}/daily-prices` 取得日線資料。
3. 提交策略回測 `/strategies/{id}/backtests`。
4. 透過 WebSocket `/ws/backtests` 接收回測完成通知。
5. 設定警示 `/alerts` 並於 `/ws/alerts` 接收觸發訊息。
