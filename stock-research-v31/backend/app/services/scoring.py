WEIGHTS={'quality':20,'growth':20,'financial':20,'valuation':20,'momentum':10,'risk':10}

def score_company(asset,metrics):
    if str(asset).upper()=='ETF':
        return {'supported':False,'total':None,'confidence':0.0,'weights':WEIGHTS,'categories':{},'missing':list(WEIGHTS)}
    categories={}; present=0
    for k,w in WEIGHTS.items():
        v=metrics.get(k)
        if v is None:
            categories[k]=None
        else:
            v=max(0.0,min(1.0,float(v))); categories[k]=round(v*w,4); present+=1
    confidence=present/len(WEIGHTS)
    total=None if present==0 else round(sum(v for v in categories.values() if v is not None),4)
    return {'supported':True,'total':total,'confidence':confidence,'weights':WEIGHTS,'categories':categories,'missing':[k for k,v in categories.items() if v is None]}
