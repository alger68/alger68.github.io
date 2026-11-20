from math import sqrt

def _sma(xs,n):
    if len(xs)<n: return None
    return sum(xs[-n:])/n

def _ema_series(xs,n):
    if not xs: return []
    a=2/(n+1); out=[xs[0]]
    for x in xs[1:]: out.append(a*x+(1-a)*out[-1])
    return out

def _rsi(xs,n=14):
    if len(xs)<n+1: return None
    gains=[]; losses=[]
    for a,b in zip(xs[-(n+1):-1],xs[-n:]):
        diff=b-a; gains.append(max(diff,0)); losses.append(max(-diff,0))
    ag=sum(gains)/n; al=sum(losses)/n
    if al==0: return 100.0
    rs=ag/al
    return 100-(100/(1+rs))

def _macd(xs):
    if len(xs)<35: return {'macd':None,'signal':None,'histogram':None}
    e12=_ema_series(xs,12); e26=_ema_series(xs,26)
    line=[a-b for a,b in zip(e12,e26)]
    signal=_ema_series(line,9)
    return {'macd':line[-1],'signal':signal[-1],'histogram':line[-1]-signal[-1]}

def _kd(candles,n=9):
    if len(candles)<n: return {'k':None,'d':None}
    k=d=50.0
    for i in range(n-1,len(candles)):
        win=candles[i-n+1:i+1]; hh=max(x['high'] for x in win); ll=min(x['low'] for x in win)
        rsv=50.0 if hh==ll else (candles[i]['close']-ll)/(hh-ll)*100
        k=(2/3)*k+(1/3)*rsv; d=(2/3)*d+(1/3)*k
    return {'k':k,'d':d}

def _bollinger(xs,n=20,m=2):
    if len(xs)<n: return {'middle':None,'upper':None,'lower':None}
    w=xs[-n:]; mid=sum(w)/n; sd=sqrt(sum((x-mid)**2 for x in w)/n)
    return {'middle':mid,'upper':mid+m*sd,'lower':mid-m*sd}

def technical_summary(candles):
    closes=[float(x['close']) for x in candles or []]
    sma={str(n):_sma(closes,n) for n in (5,20,60,120,240)}
    sufficient=len(closes)>=20
    warnings=[] if sufficient else ['insufficient_history']
    return {
        'available':sufficient,
        'sma':sma,
        'rsi14':_rsi(closes,14) if sufficient else None,
        'macd':_macd(closes) if sufficient else {'macd':None,'signal':None,'histogram':None},
        'kd':_kd(candles) if sufficient else {'k':None,'d':None},
        'bollinger':_bollinger(closes) if sufficient else {'middle':None,'upper':None,'lower':None},
        'warnings':warnings,
    }
