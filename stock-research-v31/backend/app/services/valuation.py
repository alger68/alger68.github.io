def scenario(eps,pe,label,source_type='internal_sensitivity'):
    try: price=float(eps)*float(pe)
    except Exception: price=None
    return {'label':label,'eps':float(eps) if eps is not None else None,'pe':float(pe) if pe is not None else None,'price':price,'source_type':source_type}

def valuation_range(bear,base,bull,current_price):
    def add_upside(x):
        y=dict(x)
        if y.get('price') is None or not current_price:
            y['upside_pct']=None
        else:
            y['upside_pct']=round((y['price']/float(current_price)-1)*100,4)
        return y
    return {'bear':add_upside(bear),'base':add_upside(base),'bull':add_upside(bull),'current_price':float(current_price) if current_price is not None else None}
