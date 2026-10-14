from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .config import settings
from .api.stocks import router as stocks_router
from .api.technicals import router as technicals_router
from .api.financials import router as financials_router
from .api.decision import router as decision_router
from .api.news import router as news_router
from .api.watchlist import router as watchlist_router
from .api.market import router as market_router
from .bootstrap import configure_app

app = FastAPI(title='StockMaster AI', version=settings.version)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://alger68.github.io','http://127.0.0.1:8000','http://localhost:8000'],
    allow_credentials=False,
    allow_methods=['GET','POST','DELETE'],
    allow_headers=['*'],
)
app.include_router(stocks_router)
app.include_router(technicals_router)
app.include_router(financials_router)
app.include_router(decision_router)
app.include_router(news_router)
app.include_router(watchlist_router)
app.include_router(market_router)
configure_app(app)
FRONTEND = Path(__file__).resolve().parents[2] / 'frontend'

@app.get('/api/health')
def health():
    return {'status': 'ok', 'mode': settings.mode, 'version': settings.version}

@app.get('/api/config/mode')
def config_mode():
    return {'mode': settings.mode}

if FRONTEND.exists():
    app.mount('/assets', StaticFiles(directory=FRONTEND), name='frontend-assets')

@app.get('/')
def index():
    return FileResponse(FRONTEND / 'index.html')
