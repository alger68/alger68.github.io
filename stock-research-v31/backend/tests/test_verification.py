from datetime import datetime, timezone


def datum(**kw):
    from app.models.canonical import CanonicalDatum
    base=dict(metric='eps',value=9.05,unit='TWD',period='2026-Q2',scope='single_quarter',source_name='TWSE',source_url='x',fetched_at=datetime(2026,10,14,tzinfo=timezone.utc))
    base.update(kw)
    return CanonicalDatum(**base)


def test_quarter_unspecified_is_not_verified():
    from app.services.verification import verify_candidates
    x=datum(scope='quarter_unspecified')
    r=verify_candidates([x])
    assert r.verified is False
    assert 'scope' in (r.verification_note or '')


def test_matching_verified_candidates_raise_confidence():
    from app.services.verification import verify_candidates
    a=datum(source_name='TWSE')
    b=datum(source_name='MOPS', source_url='y')
    r=verify_candidates([a,b])
    assert r.verified is True
    assert r.confidence >= 0.9


def test_prefer_current_never_replaces_newer_period_with_older():
    from app.services.verification import prefer_current
    newer=datum(period='2026-Q3', value=11)
    older=datum(period='2026-Q2', value=9)
    assert prefer_current(newer,older).value == 11
    assert prefer_current(older,newer).value == 11
