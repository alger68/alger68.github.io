# Quant Platform Backend Skeleton

本專案以 **FastAPI + PostgreSQL/TimescaleDB** 為核心技術棧，搭配 SQLAlchemy/AsyncPG 進行非同步資料存取。專案使用 Poetry 管理相依套件，預設支援 Docker 化部署。

## 專案結構
```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   ├── models/
│   │   └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   └── main.py
├── pyproject.toml
└── README.md
```

## 快速啟動
1. 安裝 Poetry。
2. 執行 `poetry install` 安裝依賴。
3. 建立 `.env` 檔案（參考 `app/core/config.py`）。
4. 啟動開發伺服器：`poetry run uvicorn app.main:app --reload`。

## 技術選型摘要
- **FastAPI**：提供高效能 async API server。
- **PostgreSQL + TimescaleDB**：處理時序與關聯資料。
- **SQLAlchemy 2.0 + AsyncPG**：非同步 ORM / Query builder。
- **Redis**：Session、權限快取與即時訊息中介。
- **Poetry**：統一管理依賴與虛擬環境。

後續可整合 Alembic 建置 migration、Celery 進行背景任務、以及 Grafana/Prometheus 監控。
