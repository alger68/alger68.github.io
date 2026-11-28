import json


def test_snapshot_provider_isolates_exchange_and_ticker(tmp_path):
    from app.providers.github_snapshot import GitHubSnapshotProvider
    p = tmp_path/'TWSE'; p.mkdir()
    (p/'2395.json').write_text(json.dumps({'subject':{'exchange':'TWSE','ticker':'2395'},'datasets':{'x':1}}), encoding='utf-8')
    provider = GitHubSnapshotProvider(tmp_path)
    result = provider.get_company('TWSE','2395')
    assert result.error is None
    assert result.data['subject']['ticker'] == '2395'
    missing = provider.get_company('TPEX','2395')
    assert missing.data is None
    assert missing.error == 'snapshot_not_found'


def test_snapshot_provider_rejects_identity_mismatch_and_malformed_payload(tmp_path):
    from app.providers.github_snapshot import GitHubSnapshotProvider
    p = tmp_path/'TWSE'; p.mkdir()
    (p/'2395.json').write_text(json.dumps({'subject':{'exchange':'TWSE','ticker':'2454'}}), encoding='utf-8')
    provider = GitHubSnapshotProvider(tmp_path)
    result = provider.get_company('TWSE','2395')
    assert result.data is None
    assert result.error == 'identity_mismatch'
    (p/'2395.json').write_text('{bad', encoding='utf-8')
    malformed = provider.get_company('TWSE','2395')
    assert malformed.data is None
    assert malformed.error == 'malformed_snapshot'
