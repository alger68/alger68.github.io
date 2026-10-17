from urllib.parse import urlencode


class PublicNewsProvider:
    URLS = {
        'TWSE': 'https://openapi.twse.com.tw/v1/opendata/t187ap04_L',
        'TPEX': 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap04_O',
    }

    def __init__(self, http=None, fetcher=None):
        self.http = http
        self.fetcher = fetcher

    @staticmethod
    def _first(row, *keys):
        for key in keys:
            value = row.get(key)
            if value not in (None, ''):
                return value
        return None

    @staticmethod
    def _published_at(date_value, time_value=None):
        raw = str(date_value or '').strip().replace('/', '')
        if len(raw) == 7 and raw.isdigit():
            year = int(raw[:3]) + 1911
            month = raw[3:5]
            day = raw[5:7]
        elif len(raw) == 8 and raw.isdigit():
            year = int(raw[:4])
            month = raw[4:6]
            day = raw[6:8]
        else:
            return None
        tm = ''.join(ch for ch in str(time_value or '') if ch.isdigit())
        if len(tm) >= 6:
            hh, mm, ss = tm[:2], tm[2:4], tm[4:6]
        elif len(tm) >= 4:
            hh, mm, ss = tm[:2], tm[2:4], '00'
        else:
            hh, mm, ss = '00', '00', '00'
        return f'{year:04d}-{month}-{day}T{hh}:{mm}:{ss}+08:00'

    def _official(self, exchange, ticker):
        ex = str(exchange).upper()
        url = self.URLS.get(ex)
        if not url or self.http is None:
            return []
        try:
            rows = self.http.get_json(url)
        except Exception:
            return []
        out = []
        for row in rows or []:
            code = str(self._first(row, '公司代號', 'SecuritiesCompanyCode', 'CompanyCode', 'Code') or '').strip()
            if code != str(ticker).strip():
                continue
            title = str(self._first(row, '主旨', 'Subject', 'Title') or '').strip()
            if not title:
                continue
            date_value = self._first(row, '發言日期', 'Date', 'PublishedDate')
            time_value = self._first(row, '發言時間', 'Time', 'PublishedTime')
            published_at = self._published_at(date_value, time_value)
            event_key = f"{str(date_value or '').replace('/', '')}-{str(time_value or '').replace(':', '')}"
            query = urlencode({'step': '1', 'firstin': 'true', 'co_id': code, 'event_id': event_key})
            out.append({
                'source': 'TWSE MOPS' if ex == 'TWSE' else 'TPEx MOPS',
                'title': title,
                'published_at': published_at,
                'category': '重大訊息',
                'url': f'https://mops.twse.com.tw/mops/web/t05st01?{query}',
                'description': self._first(row, '說明', 'Description'),
                'clause': self._first(row, '符合條款', 'Clause'),
                'occurrence_date': self._first(row, '事實發生日', 'DateOfOccurrence'),
            })
        return out

    def get(self, exchange, ticker):
        if self.fetcher is not None:
            rows = self.fetcher(exchange, ticker)
            return rows if isinstance(rows, list) else []
        return self._official(exchange, ticker)
