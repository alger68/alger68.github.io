# 核心資料庫實體關聯圖 (ERD)

本文件描述量化交易平台的核心資料庫實體關係。各資料表之間的主要關聯如下圖所示：

```text
+----------------+       +-------------------+       +------------------+
|    users       |1     *|    strategies     |1     *|  daily_prices    |
|----------------|-------|-------------------|-------|------------------|
| id PK          |       | id PK             |       | id PK            |
| email          |       | user_id FK        |       | security_id FK   |
| role_id FK     |       | security_id FK    |       | trade_date       |
| status         |       | name              |       | open_price       |
+----------------+       | parameters        |       | close_price      |
        |                +-------------------+       | ...              |
        |1                                           +------------------+
        |                                           /
        |                                          /
        |                                         /
        |                                        /
        v                                       v
+----------------+       +-------------------+       +---------------------+
|    roles       |1     *| financial_reports |       | institutional_trades|
|----------------|-------|-------------------|       |---------------------|
| id PK          |       | id PK             |       | id PK              |
| name           |       | security_id FK    |       | security_id FK     |
| description    |       | report_date       |       | trade_date         |
+----------------+       | ...               |       | ...                |
                         +-------------------+       +---------------------+

+----------------+       +-------------------+       +------------------+
|   securities   |1     *|   alerts          |       |    sessions       |
|----------------|-------|-------------------|       |------------------|
| id PK          |       | id PK             |       | id PK            |
| symbol         |       | user_id FK        |       | user_id FK       |
| exchange       |       | security_id FK    |       | refresh_token    |
| ...            |       | strategy_id FK    |       | expires_at       |
+----------------+       | channel           |       +------------------+
                         | condition_json    |
                         | status            |
                         +-------------------+
```

> 註：`sessions` 為使用者登入狀態紀錄表，用於強化安全性與 token 管理，屬於認證授權流程的一部分。

## 關聯說明

- `users` 與 `roles` 為多對一關係，以角色決定使用者的權限組合。
- `users` 與 `strategies`、`alerts` 皆為一對多關係；策略與警示設定均由特定使用者建立。
- `securities` 與 `daily_prices`、`financial_reports`、`institutional_trades`、`strategies`、`alerts` 皆為一對多關係。
- `strategies` 與 `alerts` 關聯，因警示可綁定策略的回測結果或績效指標。
- `users` 與 `sessions` 為一對多，用於紀錄 OAuth2 refresh token 與 WebSocket session。

## ERD 工具建議

未來可使用 dbdiagram.io、Draw.io 或 Mermaid 在文件中生成更正式的 ERD 圖示；目前以文字方式快速表達實體與關係。
