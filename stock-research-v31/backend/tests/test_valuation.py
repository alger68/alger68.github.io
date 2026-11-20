def test_internal_sensitivity_is_labeled_and_range_has_upside():
    from app.services.valuation import scenario, valuation_range
    bear=scenario(8,15,'Bear','internal_sensitivity')
    base=scenario(10,18,'Base','internal_sensitivity')
    bull=scenario(12,20,'Bull','internal_sensitivity')
    r=valuation_range(bear,base,bull,150)
    assert base['price']==180
    assert base['source_type']=='internal_sensitivity'
    assert r['base']['upside_pct']==20
