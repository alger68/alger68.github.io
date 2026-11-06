ALLOWED_EXCHANGES = {'TWSE', 'TPEX'}

def normalize_identity(exchange: str, ticker: str) -> tuple[str, str]:
    ex = str(exchange).upper().strip()
    tk = str(ticker).upper().strip()
    if ex not in ALLOWED_EXCHANGES:
        raise ValueError('invalid_exchange')
    if not tk.isalnum() or not (4 <= len(tk) <= 8):
        raise ValueError('invalid_ticker')
    return ex, tk
