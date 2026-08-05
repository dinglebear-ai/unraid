#!/usr/bin/env bash
set -euo pipefail

plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/scripts/backup-state.sh"
restore_script="$plugin_dir/source/usr/local/emhttp/plugins/unraid-codex/scripts/restore-state.sh"
mock_incus="$plugin_dir/tests/fixtures/restore-incus.py"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/fixture" "$tmp/plugin" "$tmp/run" "$tmp/state"
printf 'restored-state\n' >"$tmp/fixture/state.txt"
tar -czf "$tmp/backup.tar.gz" -C "$tmp/fixture" .
openssl rand -hex 64 >"$tmp/plugin/backup.key"
chmod 0600 "$tmp/plugin/backup.key"
test_iterations=1000
backup=""

cat >"$tmp/incus-env.sh" <<EOF
INCUS_DIR="$tmp/incus"
EOF
touch "$tmp/incus.cfg"
ln -s "$mock_incus" "$tmp/bin/incus"

cat >"$tmp/bin/start-incus" <<'EOF'
#!/usr/bin/env python3
import json, os, pathlib
path = pathlib.Path(os.environ["CODEX_TEST_STATE"]) / "state.json"
state = json.loads(path.read_text())
state["container_status"] = "RUNNING"
path.write_text(json.dumps(state, sort_keys=True))
EOF
chmod 0755 "$tmp/bin/start-incus"

cat >"$tmp/bin/start-appserver" <<'EOF'
#!/usr/bin/env python3
import json, os, pathlib, sys
path = pathlib.Path(os.environ["CODEX_TEST_STATE"]) / "state.json"
state = json.loads(path.read_text())
count = state.get("start_count", 0)
state["start_count"] = count + 1
path.write_text(json.dumps(state, sort_keys=True))
if os.environ.get("CODEX_TEST_START_FAIL_ONCE") == "1" and count == 0:
    raise SystemExit(1)
state["service_active"] = True
path.write_text(json.dumps(state, sort_keys=True))
EOF
chmod 0755 "$tmp/bin/start-appserver"

reset_state() {
  python3 - "$tmp/state/state.json" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
path.write_text(json.dumps({
    "container_status": "RUNNING",
    "device_attached": True,
    "service_active": True,
    "snapshots": [],
    "start_count": 0,
    "volumes": ["unraid-codex-state"],
}, sort_keys=True))
PY
  : >"$tmp/state/incus.log"
}

assert_state() {
  python3 - "$tmp/state/state.json" "$1" <<'PY'
import json
import pathlib
import re
import sys

state = json.loads(pathlib.Path(sys.argv[1]).read_text())
mode = sys.argv[2]
assert state["container_status"] == "RUNNING", state
assert state["device_attached"] is True, state
assert "unraid-codex-state" in state["volumes"], state
if mode == "success":
    assert state["service_active"] is True, state
    assert state["start_count"] == 1, state
    assert any(re.fullmatch(r"unraid-codex-state-pre-restore-[0-9]{8}-[0-9]{6}", name) for name in state["volumes"]), state
elif mode == "inactive":
    assert state["service_active"] is False, state
    assert state["start_count"] == 0, state
    assert any(re.fullmatch(r"unraid-codex-state-pre-restore-[0-9]{8}-[0-9]{6}", name) for name in state["volumes"]), state
elif mode == "rollback":
    assert state["service_active"] is True, state
    assert state["start_count"] == 2, state
    assert not any("pre-restore" in name for name in state["volumes"]), state
    assert any(re.fullmatch(r"unraid-codex-state-failed-restore-[0-9]{8}-[0-9]{6}", name) for name in state["volumes"]), state
else:
    raise AssertionError(mode)
PY
}

export PATH="$tmp/bin:$PATH"
export CODEX_TEST_STATE="$tmp/state"
export CODEX_TEST_ALLOW_NON_ROOT=1
export CODEX_TEST_PBKDF2_ITERATIONS="$test_iterations"
export CODEX_BACKUP_DIR="$tmp/backups"
export CODEX_BACKUP_TMP_DIR="$tmp/run"
export CODEX_RESTORE_TMP_DIR="$tmp/run"
export CODEX_TEST_EXPORT_SOURCE="$tmp/backup.tar.gz"
export CODEX_PLUGIN_CONFIG="$tmp/plugin"
export CODEX_BACKUP_KEY_FILE="$tmp/plugin/backup.key"
export CODEX_MAINTENANCE_LOCK="$tmp/run/maintenance.lock"
export INCUS_ENV="$tmp/incus-env.sh"
export INCUS_CONFIG="$tmp/incus.cfg"
export CODEX_INCUS_START_HELPER="$tmp/bin/start-incus"
export CODEX_START_APPSERVER="$tmp/bin/start-appserver"

reset_state
mapfile -t backup_output < <("$backup_script")
backup="${backup_output[-1]}"
[[ -f "$backup" && -f "$backup.sha256" && -f "$backup.hmac" ]]
[[ "$(stat -c '%a' "$backup")" = 600 ]]
python3 - "$tmp/state/state.json" <<'PY'
import json
import pathlib
import sys
state = json.loads(pathlib.Path(sys.argv[1]).read_text())
assert len(state["snapshots"]) == 1, state
assert state["service_active"] is True, state
PY
if find "$tmp/run" -maxdepth 1 -name 'unraid-codex-state.*.tar.gz' -print -quit | grep -q .; then
  echo "plaintext backup export was not removed" >&2
  exit 1
fi

reset_state
verify_output="$($restore_script "$backup")"
grep -Fq 'verification=ok' <<<"$verify_output"
test ! -s "$tmp/state/incus.log"

cp "$backup" "$tmp/tampered.tar.gz.enc"
cp "$backup.sha256" "$tmp/tampered.tar.gz.enc.sha256"
cp "$backup.hmac" "$tmp/tampered.tar.gz.enc.hmac"
printf x >>"$tmp/tampered.tar.gz.enc"
if "$restore_script" "$tmp/tampered.tar.gz.enc" >"$tmp/tampered.out" 2>&1; then
  echo "tampered backup unexpectedly passed verification" >&2
  exit 1
fi
grep -Fq 'backup SHA-256 does not match its sidecar' "$tmp/tampered.out"

cp "$backup" "$tmp/bad-hmac.tar.gz.enc"
cp "$backup.sha256" "$tmp/bad-hmac.tar.gz.enc.sha256"
printf '%064d\n' 0 >"$tmp/bad-hmac.tar.gz.enc.hmac"
if "$restore_script" "$tmp/bad-hmac.tar.gz.enc" >"$tmp/bad-hmac.out" 2>&1; then
  echo "backup with an invalid HMAC unexpectedly passed verification" >&2
  exit 1
fi
grep -Fq 'backup HMAC verification failed' "$tmp/bad-hmac.out"

reset_state
success_output="$($restore_script --force "$backup")"
grep -Fq 'restore=ok' <<<"$success_output"
assert_state success
grep -Fq '["storage", "volume", "import"' "$tmp/state/incus.log"
grep -Fq '["storage", "volume", "move"' "$tmp/state/incus.log"

reset_state
python3 - "$tmp/state/state.json" <<'PY'
import json
import pathlib
import sys
path = pathlib.Path(sys.argv[1])
state = json.loads(path.read_text())
state["service_active"] = False
path.write_text(json.dumps(state, sort_keys=True))
PY
inactive_output="$($restore_script --force "$backup")"
grep -Fq 'restore=ok' <<<"$inactive_output"
assert_state inactive

reset_state
export CODEX_TEST_START_FAIL_ONCE=1
if "$restore_script" --force "$backup" >"$tmp/rollback.out" 2>&1; then
  echo "restore with failed health restart unexpectedly succeeded" >&2
  exit 1
fi
unset CODEX_TEST_START_FAIL_ONCE
grep -Fq 'Previous Codex state was restored successfully' "$tmp/rollback.out"
assert_state rollback

if find "$tmp/run" -maxdepth 1 -name 'unraid-codex-restore.*.tar.gz' -print -quit | grep -q .; then
  echo "decrypted restore payload was not removed" >&2
  exit 1
fi

echo "Codex encrypted backup restore tests passed"
