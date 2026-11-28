# 認證與授權設計

## 整體流程

1. 前端導向 Identity Provider (IdP) 進行 OAuth2 Authorization Code + PKCE 流程。
2. 使用者授權後，前端以 code + verifier 向後端 `/auth/token` 交換 access token 與 refresh token。
3. 後端建立/更新 `sessions` 紀錄 refresh token、裝置資訊與到期時間。
4. API 請求需攜帶 Bearer access token，後端透過 JWT 驗證簽章與過期時間。
5. 透過角色與權限 (RBAC) 驗證使用者是否可存取特定資源。
6. 若 access token 過期，可使用 refresh token 呼叫 `/auth/refresh` 取得新 token。
7. 使用者登出或刷新異常時，將 `sessions.revoked_at` 設定並使 refresh token 失效。

## Token 結構
- **Access Token**：JWT，15 分鐘有效，payload 包含 `sub`, `email`, `role`, `permissions_hash`, `iat`, `exp`。
- **Refresh Token**：UUID v4，存於資料庫 `sessions.refresh_token`，有效期 30 天。

## RBAC 策略
- `roles` 表存放角色基本資料與 `permissions` JSON：
```json
{
  "market_data:read": true,
  "strategies:create": true,
  "strategies:execute": true,
  "alerts:manage": true,
  "admin:users": false
}
```
- API 層根據權限鍵值判斷，並可快取於 Redis 以減少資料庫查詢。

## 敏感資料保護
- 密碼使用 Argon2id 雜湊，並加上隨機 salt。
- Refresh token 僅存雜湊值於資料庫 (例如 `hash(refresh_token)`)，避免資料庫洩漏直接取得明碼。
- 所有 JWT 簽章使用非對稱金鑰 (RS256)。私鑰存放於安全憑證服務 (如 AWS KMS)，公鑰供 API 節點驗證。
- 重要操作（策略刪除、管理員功能）需以多因子驗證 (TOTP/SMS) 強化安全性。

## 權限範例
| 角色 | 權限 | 說明 |
| --- | --- | --- |
| `admin` | 全部權限，包含 `admin:users`, `admin:settings` | 系統管理者 |
| `analyst` | `market_data:read`, `strategies:create`, `strategies:execute`, `alerts:manage` | 研究員 |
| `viewer` | `market_data:read` | 只讀使用者 |

## WebSocket 安全性
- 連線時需提供有效 access token，伺服器驗證後才建立 session。
- 支援 token refresh：若 access token 將到期，可透過 REST `/auth/refresh` 取得新 token 並在 WebSocket 內傳送 `{"type": "auth.refresh", "token": "..."}` 更新。
- 針對敏感通知（例如策略回測結果），僅推送給擁有該策略之使用者或具備對應權限之角色。

## 稽核與追蹤
- 所有登入、token 交換、敏感操作均寫入 `audit_logs`（未於本階段建立資料表，可於後續擴充）。
- 產生安全告警（連線異常、連續失敗登入）時，觸發 `/alerts` 通知與外部 SIEM 服務整合。
