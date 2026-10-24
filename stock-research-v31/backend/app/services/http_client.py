import httpx

class JsonHttpClient:
    def __init__(self, timeout: float = 15.0, retries: int = 2):
        self.timeout = timeout
        self.retries = retries

    def get_json(self, url: str):
        last = None
        for _ in range(self.retries + 1):
            try:
                r = httpx.get(url, timeout=self.timeout, headers={'Accept':'application/json','User-Agent':'StockMasterAI/3.1'})
                r.raise_for_status()
                data = r.json()
                if not isinstance(data, list):
                    raise ValueError('invalid_payload')
                return data
            except Exception as exc:
                last = exc
        raise RuntimeError(f'provider_http_failed: {last}')
