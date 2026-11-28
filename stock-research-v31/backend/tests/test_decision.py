def test_low_confidence_forces_insufficient_data_and_etf_is_not_company_decision():
    from app.services.decision import decide
    assert decide({'total':80,'confidence':0.3,'categories':{}},None,False,'個股')['state']=='INSUFFICIENT_DATA'
    assert decide({'total':80,'confidence':1,'categories':{}},None,False,'ETF')['state']=='INSUFFICIENT_DATA'


def test_high_score_with_valuation_gate_passes_buy_zone_but_expensive_is_watch():
    from app.services.decision import decide
    score={'total':90,'confidence':1,'categories':{'quality':18,'growth':18,'financial':18,'valuation':18,'momentum':9,'risk':9}}
    good={'base':{'price':200,'upside_pct':25}}
    expensive={'base':{'price':130,'upside_pct':-10}}
    assert decide(score,good,False,'個股')['state']=='BUY_ZONE'
    assert decide(score,expensive,False,'個股')['state']=='WATCH'
