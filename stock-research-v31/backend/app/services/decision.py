def decide(score,valuation,risk=False,asset='個股'):
    if str(asset).upper()=='ETF' or not score or score.get('confidence',0)<0.6 or score.get('total') is None:
        return {'state':'INSUFFICIENT_DATA','gates':{},'reasons':['insufficient_verified_data']}
    if risk:
        return {'state':'AVOID','gates':{'risk':False},'reasons':['risk_gate_failed']}
    cats=score.get('categories') or {}
    gates={
        'quality':(cats.get('quality') or 0)>=12,
        'growth':(cats.get('growth') or 0)>=12,
        'financial':(cats.get('financial') or 0)>=12,
        'valuation':bool(valuation and valuation.get('base') and valuation['base'].get('upside_pct') is not None and valuation['base']['upside_pct']>=0),
        'momentum':(cats.get('momentum') or 0)>=5,
    }
    if not gates['valuation']:
        return {'state':'WATCH','gates':gates,'reasons':['valuation_gate_failed']}
    if all(gates.values()) and score['total']>=85:
        return {'state':'BUY_ZONE','gates':gates,'reasons':['all_gates_pass']}
    if score['total']>=70:
        return {'state':'ACCUMULATE','gates':gates,'reasons':['score_pass_partial_gates']}
    return {'state':'HOLD','gates':gates,'reasons':['score_below_accumulate']}
