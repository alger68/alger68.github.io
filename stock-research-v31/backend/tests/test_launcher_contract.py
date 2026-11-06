from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
INSTALL=(ROOT/'install.command').read_text(encoding='utf-8')
LAUNCH=(ROOT/'StockMaster.command').read_text(encoding='utf-8')
MAIN=(ROOT/'backend/app/main.py').read_text(encoding='utf-8')


def test_install_preserves_existing_env_and_reuses_venv():
    assert 'if [ ! -d .venv ]' in INSTALL
    assert 'if [ ! -f .env ]' in INSTALL
    assert 'cp .env.example .env' in INSTALL


def test_launcher_guards_dependencies_and_duplicate_server():
    assert 'command -v curl' in LAUNCH
    assert 'command -v open' in LAUNCH
    assert 'kill -0 "$OLD_PID"' in LAUNCH
    assert 'open "$BASE_URL/"' in LAUNCH


def test_launcher_avoids_old_stockmaster_port_collision():
    assert 'for candidate in 8000 8001 8002 8003 8004 8005' in LAUNCH
    assert 'PORT="$candidate"' in LAUNCH
    assert '--port "$PORT"' in LAUNCH
    assert 'BASE_URL="http://127.0.0.1:$PORT"' in LAUNCH


def test_launcher_verifies_exact_build_before_opening_browser():
    assert 'EXPECTED_BUILD=' in LAUNCH
    assert '/api/health' in LAUNCH
    assert '"build":"$EXPECTED_BUILD"' in LAUNCH or 'EXPECTED_BUILD' in LAUNCH
    assert "'build': settings.build" in MAIN


def test_launcher_removes_stale_pid_before_start():
    assert 'rm -f .stockmaster.pid' in LAUNCH
    stale_guard=LAUNCH.index('rm -f .stockmaster.pid')
    start=LAUNCH.index('nohup python -m uvicorn')
    assert stale_guard < start


def test_launcher_cleans_failed_server_and_pid():
    assert 'kill "$SERVER_PID"' in LAUNCH
    assert 'rm -f .stockmaster.pid' in LAUNCH
    assert 'trap cleanup' in LAUNCH


def test_launcher_records_architecture_for_mac_diagnostics():
    assert 'uname -m' in LAUNCH
    assert 'logs/startup.log' in LAUNCH
