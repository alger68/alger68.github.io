from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .config import settings

app = FastAPI(title='StockMaster AI', version=settings.version)
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
