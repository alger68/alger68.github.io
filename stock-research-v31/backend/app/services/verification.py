from app.models.canonical import CanonicalDatum

UNVERIFIED_SCOPES={'quarter_unspecified','unknown',None}

def verify_candidates(candidates: list[CanonicalDatum]) -> CanonicalDatum:
    if not candidates:
        raise ValueError('no_candidates')
    chosen=max(candidates,key=lambda x:(x.period or '',x.fetched_at))
    out=chosen.model_copy(deep=True)
    if out.scope in UNVERIFIED_SCOPES:
        out.verified=False; out.confidence=0.35; out.verification_note='scope_unverified'
        return out
    comparable=[x for x in candidates if x.period==out.period and x.scope==out.scope and x.value==out.value]
    if len({x.source_name for x in comparable})>=2:
        out.verified=True; out.confidence=0.95; out.verification_note='cross_source_match'
    else:
        out.verified=True; out.confidence=0.75; out.verification_note='single_authoritative_source'
    return out

def prefer_current(current: CanonicalDatum | None, incoming: CanonicalDatum | None) -> CanonicalDatum | None:
    if current is None: return incoming
    if incoming is None: return current
    cp=current.period or ''
    ip=incoming.period or ''
    if ip>cp: return incoming
    if ip<cp: return current
    return incoming if incoming.fetched_at>=current.fetched_at else current
