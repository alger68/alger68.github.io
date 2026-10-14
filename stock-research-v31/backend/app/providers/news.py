class PublicNewsProvider:
    def __init__(self, fetcher=None): self.fetcher=fetcher
    def get(self,exchange,ticker):
        if self.fetcher is None: return []
        rows=self.fetcher(exchange,ticker)
        return rows if isinstance(rows,list) else []
