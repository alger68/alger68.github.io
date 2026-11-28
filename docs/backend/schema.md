# 核心資料表 Schema 定義

以下以 PostgreSQL/TimescaleDB 為目標資料庫，採用 snake_case 欄位命名慣例。Timestamp 欄位統一為 `timestamptz`。

## `securities`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK | 證券內部識別碼 |
| symbol | varchar(32) | UNIQUE NOT NULL | 證券代碼 |
| exchange | varchar(16) | NOT NULL | 交易所代號 |
| type | varchar(16) | NOT NULL | 證券類型（stock, etf, futures...）|
| currency | varchar(8) | NOT NULL | 交易幣別 |
| lot_size | integer | NOT NULL DEFAULT 1 | 單位股數 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 建立時間 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新時間 |

## `daily_prices`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| security_id | bigint | FK → securities.id NOT NULL |
| trade_date | date | NOT NULL |
| open_price | numeric(18,6) | NOT NULL |
| high_price | numeric(18,6) | NOT NULL |
| low_price | numeric(18,6) | NOT NULL |
| close_price | numeric(18,6) | NOT NULL |
| volume | numeric(20,0) | NOT NULL |
| turnover | numeric(20,2) | | 成交值 |
| created_at | timestamptz | NOT NULL DEFAULT now() |

> 建議針對 `(security_id, trade_date)` 建立 UNIQUE constraint 與 Timescale hypertable 分區。

## `financial_reports`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| security_id | bigint | FK → securities.id NOT NULL |
| report_type | varchar(16) | NOT NULL | (quarterly, yearly, monthly) |
| period_start | date | NOT NULL |
| period_end | date | NOT NULL |
| revenue | numeric(20,2) | |
| net_income | numeric(20,2) | |
| eps | numeric(12,4) | |
| created_at | timestamptz | NOT NULL DEFAULT now() |

## `institutional_trades`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| security_id | bigint | FK → securities.id NOT NULL |
| trade_date | date | NOT NULL |
| investor_type | varchar(16) | NOT NULL | (foreign, dealer, investment_trust...) |
| buy_volume | numeric(20,0) | NOT NULL |
| sell_volume | numeric(20,0) | NOT NULL |
| net_volume | numeric(20,0) | GENERATED ALWAYS AS (buy_volume - sell_volume) STORED |
| created_at | timestamptz | NOT NULL DEFAULT now() |

## `users`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| email | citext | UNIQUE NOT NULL |
| hashed_password | text | NOT NULL |
| full_name | varchar(128) | |
| status | varchar(16) | NOT NULL DEFAULT 'active' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

## `roles`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | smallserial | PK |
| name | varchar(32) | UNIQUE NOT NULL |
| description | text | |
| permissions | jsonb | NOT NULL | 儲存細部權限矩陣 |

## `strategies`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| user_id | bigint | FK → users.id NOT NULL |
| security_id | bigint | FK → securities.id |
| name | varchar(64) | NOT NULL |
| parameters | jsonb | NOT NULL | 策略參數設定 |
| version | integer | NOT NULL DEFAULT 1 |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

## `backtests`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| strategy_id | bigint | FK → strategies.id NOT NULL |
| run_at | timestamptz | NOT NULL |
| parameters | jsonb | NOT NULL |
| performance_metrics | jsonb | NOT NULL |
| result_blob | bytea | | 儲存回測結果壓縮檔 |

## `alerts`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| user_id | bigint | FK → users.id NOT NULL |
| security_id | bigint | FK → securities.id |
| strategy_id | bigint | FK → strategies.id |
| channel | varchar(16) | NOT NULL | (email, sms, webhook, websocket) |
| condition_json | jsonb | NOT NULL |
| status | varchar(16) | NOT NULL DEFAULT 'active' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

## `sessions`
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK |
| user_id | bigint | FK → users.id NOT NULL |
| refresh_token | uuid | UNIQUE NOT NULL |
| user_agent | text | |
| ip_address | inet | |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| expires_at | timestamptz | NOT NULL |
| revoked_at | timestamptz | |

## 資料表索引與最佳化建議
- `daily_prices`：建立 `(security_id, trade_date DESC)` 索引，並使用 TimescaleDB hypertable 以 `trade_date` 分區。
- `financial_reports`：依 `security_id` 與 `period_end` 建立複合索引。
- `institutional_trades`：依 `security_id` 與 `trade_date` 建立索引，利於淨買賣查詢。
- `strategies`：針對 `(user_id, name, version)` 建立 UNIQUE 以避免同名版本衝突。
- 所有含 `jsonb` 欄位之表，可視需求建立 GIN 索引。

## TimescaleDB 特殊設定
- 啟用 compression policy 針對歷史 `daily_prices`、`institutional_trades` 資料進行壓縮。
- 使用 continuous aggregates 產生常用技術指標（如 MA、RSI）以減少查詢成本。
