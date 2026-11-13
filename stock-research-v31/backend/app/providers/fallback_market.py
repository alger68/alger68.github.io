class FallbackMarketProvider:
    def __init__(self, primary, fallback):
        self.primary=primary; self.fallback=fallback; self.checked_at=None; self._active=None
    def rows(self):
        rows=[]
        try: rows=self.primary.rows() or []
        except Exception: rows=[]
        if rows:
            self._active='taishin_nova'; self.checked_at=getattr(self.primary,'checked_at',None); return rows
        rows=self.fallback.rows() or []
        self._active='public_twse_tpex'; self.checked_at=getattr(self.fallback,'checked_at',None); return rows
    def status(self):
        return {'enabled':True,'provider':'fallback_market','connected':self._active is not None,'active':self._active,'primary':self.primary.status() if hasattr(self.primary,'status') else {},'fallback':self.fallback.status() if hasattr(self.fallback,'status') else {}}
