def _num(v):
    try: return float(v)
    except Exception: return None

def normalize_candles(rows):
    out=[]
    for r in rows or []:
        d=str(r.get('date') or '').strip()
        o,h,l,c=[_num(r.get(k)) for k in ('open','high','low','close')]
        vol=_num(r.get('volume'))
        if not d or None in (o,h,l,c):
            continue
        out.append({'date':d,'open':o,'high':h,'low':l,'close':c,'volume':vol})
    return out
