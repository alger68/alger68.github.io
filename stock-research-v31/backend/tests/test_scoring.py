def test_scoring_uses_fixed_100_point_weights():
    from app.services.scoring import score_company
    r=score_company('個股',{'quality':1,'growth':1,'financial':1,'valuation':1,'momentum':1,'risk':1})
    assert r['total']==100
    assert r['confidence']==1
    assert r['weights']=={'quality':20,'growth':20,'financial':20,'valuation':20,'momentum':10,'risk':10}


def test_missing_metrics_reduce_confidence_and_etf_is_unsupported():
    from app.services.scoring import score_company
    r=score_company('個股',{'quality':1})
    assert r['confidence']<0.5
    etf=score_company('ETF',{})
    assert etf['supported'] is False
    assert etf['total'] is None
