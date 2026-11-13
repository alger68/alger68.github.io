from datetime import datetime, timezone
import json
from pathlib import Path
from app.models.provider import ProviderResult
from app.providers.base import normalize_identity

class GitHubSnapshotProvider:
    def __init__(self, root: Path | str):
        self.root = Path(root)

    def get_company(self, exchange: str, ticker: str) -> ProviderResult[dict]:
        now = datetime.now(timezone.utc)
        try:
            ex, tk = normalize_identity(exchange, ticker)
        except ValueError as exc:
            return ProviderResult(source_name='GitHub Snapshot', fetched_at=now, data=None, error=str(exc))
        path = self.root / ex / f'{tk}.json'
        if not path.exists():
            return ProviderResult(source_name='GitHub Snapshot', source_url=str(path), fetched_at=now, data=None, error='snapshot_not_found')
        try:
            payload = json.loads(path.read_text(encoding='utf-8'))
        except Exception:
            return ProviderResult(source_name='GitHub Snapshot', source_url=str(path), fetched_at=now, data=None, error='malformed_snapshot')
        subject = payload.get('subject') or {}
        if str(subject.get('exchange','')).upper() != ex or str(subject.get('ticker','')).upper() != tk:
            return ProviderResult(source_name='GitHub Snapshot', source_url=str(path), fetched_at=now, data=None, error='identity_mismatch')
        return ProviderResult(source_name='GitHub Snapshot', source_url=str(path), fetched_at=now, data=payload)
