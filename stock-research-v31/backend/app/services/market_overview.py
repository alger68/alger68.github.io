def build_market_overview(rows,checked_at=None):
    clean=[]
    for r in rows or []:
        try: ch=float(r.get('change_pct'))
        except Exception: continue
        clean.append({**r,'change_pct':ch})
    breadth={'up':sum(x['change_pct']>0 for x in clean),'down':sum(x['change_pct']<0 for x in clean),'flat':sum(x['change_pct']==0 for x in clean)}
    gain=sorted(clean,key=lambda x:x['change_pct'],reverse=True)[:10]
    loss=sorted(clean,key=lambda x:x['change_pct'])[:10]
    sectors={}
    for x in clean:
        s=x.get('sector') or '其他'; sectors.setdefault(s,[]).append(x['change_pct'])
    heat=[{'sector':k,'avg_change_pct':sum(v)/len(v),'count':len(v)} for k,v in sectors.items()]
    heat.sort(key=lambda x:x['avg_change_pct'],reverse=True)
    return {'checked_at':checked_at,'breadth':breadth,'top_gainers':gain,'top_losers':loss,'sectors':heat}
