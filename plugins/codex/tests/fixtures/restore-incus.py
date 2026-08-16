#!/usr/bin/env python3
import json
import os
import pathlib
import shutil
import sys

STATE_DIR = pathlib.Path(os.environ["CODEX_TEST_STATE"])
STATE_FILE = STATE_DIR / "state.json"
LOG_FILE = STATE_DIR / "incus.log"

def load_state():
    return json.loads(STATE_FILE.read_text())

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, sort_keys=True))

def fail(message="mock incus command failed"):
    print(message, file=sys.stderr)
    raise SystemExit(1)

def volume_name(value):
    return value.split("/", 1)[-1]

args = sys.argv[1:]
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
with LOG_FILE.open("a") as log:
    log.write(json.dumps(args) + "\n")
state = load_state()

if not args:
    fail("missing command")

if args[0] == "query":
    raise SystemExit(0)

if args[:2] == ["storage", "show"]:
    raise SystemExit(0)

if args[:4] == ["storage", "volume", "snapshot", "create"]:
    state.setdefault("snapshots", []).append(args[6])
    save_state(state)
    raise SystemExit(0)

if args[:4] == ["storage", "volume", "snapshot", "list"]:
    for snapshot in state.get("snapshots", []):
        print(snapshot)
    raise SystemExit(0)

if args[:4] == ["storage", "volume", "snapshot", "delete"]:
    snapshot = args[5].split("/", 1)[-1]
    if snapshot in state.get("snapshots", []):
        state["snapshots"].remove(snapshot)
        save_state(state)
    raise SystemExit(0)

if args[:3] == ["storage", "volume", "show"]:
    name = args[4]
    raise SystemExit(0 if name in state["volumes"] else 1)

if args[:3] == ["storage", "volume", "export"]:
    source = os.environ.get("CODEX_TEST_EXPORT_SOURCE")
    if not source:
        fail("CODEX_TEST_EXPORT_SOURCE is required")
    shutil.copyfile(source, args[5])
    raise SystemExit(0)

if args[:3] == ["storage", "volume", "import"]:
    name = args[5]
    if name in state["volumes"]:
        fail("target volume already exists")
    state["volumes"].append(name)
    save_state(state)
    raise SystemExit(0)

if args[:3] == ["storage", "volume", "set"]:
    name = args[4]
    raise SystemExit(0 if name in state["volumes"] else 1)

if args[:3] == ["storage", "volume", "move"]:
    source = volume_name(args[3])
    target = volume_name(args[4])
    if source not in state["volumes"] or target in state["volumes"]:
        fail("invalid volume move")
    state["volumes"].remove(source)
    state["volumes"].append(target)
    save_state(state)
    raise SystemExit(0)

if args[:3] == ["storage", "volume", "delete"]:
    name = args[4]
    if name in state["volumes"]:
        state["volumes"].remove(name)
        save_state(state)
    raise SystemExit(0)

if args[:3] == ["storage", "volume", "attach"]:
    name = args[4]
    if name not in state["volumes"]:
        fail("volume missing during attach")
    state["device_attached"] = True
    save_state(state)
    raise SystemExit(0)

if args[0] == "info":
    print(f"Name: {args[1]}")
    print(f"Status: {state['container_status']}")
    raise SystemExit(0)

if args[0] == "exec":
    command = args[3:]
    if command[:3] == ["systemctl", "is-active", "--quiet"]:
        raise SystemExit(0 if state["service_active"] else 3)
    if command[:2] == ["systemctl", "stop"]:
        state["service_active"] = False
        save_state(state)
    if command[:2] == ["systemctl", "start"]:
        state["service_active"] = True
        save_state(state)
    raise SystemExit(0)

if args[0] == "stop":
    state["container_status"] = "STOPPED"
    state["service_active"] = False
    save_state(state)
    raise SystemExit(0)

if args[0] == "start":
    state["container_status"] = "RUNNING"
    save_state(state)
    raise SystemExit(0)

if args[:3] == ["config", "device", "show"]:
    if state["device_attached"]:
        print("codex-state:")
        print("  path: /home/agent/.codex")
        print("  source: unraid-codex-state")
    raise SystemExit(0)

if args[:3] == ["config", "device", "remove"]:
    state["device_attached"] = False
    save_state(state)
    raise SystemExit(0)

fail(f"unsupported mock incus command: {args}")
