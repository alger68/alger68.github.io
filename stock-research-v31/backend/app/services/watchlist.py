import json
from pathlib import Path
from app.providers.base import normalize_identity

class JsonWatchlist:
    def __init__(self,path):
        self.path=Path(path)
    def _read(self):
        try:
            data=json.loads(self.path.read_text(encoding='utf-8'))
            return data if isinstance(data,list) else []
        except Exception:
            return []
    def _write(self,rows):
        self.path.parent.mkdir(parents=True,exist_ok=True)
        self.path.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
    def list(self): return self._read()
    def add(self,exchange,ticker,name=''):
        ex,tk=normalize_identity(exchange,ticker)
        rows=[r for r in self._read() if not (r.get('exchange')==ex and r.get('ticker')==tk)]
        rows.append({'exchange':ex,'ticker':tk,'name':str(name or '')})
        self._write(rows); return rows[-1]
    def remove(self,exchange,ticker):
        ex,tk=normalize_identity(exchange,ticker)
        rows=[r for r in self._read() if not (r.get('exchange')==ex and r.get('ticker')==tk)]
        self._write(rows); return rows
