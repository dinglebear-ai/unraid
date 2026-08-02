#!/usr/bin/env python3
"""Restore release invariants that release-please's Rust strategy cannot preserve."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

LAB_AUTH_VERSION = "0.15.0"


def _write_if_changed(path: Path, content: str, changed: list[Path]) -> None:
    if path.read_text(encoding="utf-8") != content:
        path.write_text(content, encoding="utf-8")
        changed.append(path)


def apply(repo_root: Path) -> list[Path]:
    repo_root = repo_root.resolve()
    manifest = json.loads((repo_root / ".release-please-manifest.json").read_text())
    release_version = manifest["unraid-rs"]
    changed: list[Path] = []

    cargo_path = repo_root / "unraid-rs/Cargo.toml"
    cargo = cargo_path.read_text(encoding="utf-8")
    cargo, count = re.subn(
        r'(?m)^(lab-auth\s*=\s*\{\s*version\s*=\s*")[^"]+("\s*,\s*path\s*=\s*"crates/lab-auth"\s*\}\s*)$',
        rf'\g<1>={LAB_AUTH_VERSION}\2',
        cargo,
    )
    if count != 1:
        raise RuntimeError(f"expected one lab-auth dependency in {cargo_path}, found {count}")
    _write_if_changed(cargo_path, cargo, changed)

    auth_path = repo_root / "unraid-rs/crates/lab-auth/Cargo.toml"
    auth = auth_path.read_text(encoding="utf-8")
    package_start = auth.find("[package]")
    if package_start < 0:
        raise RuntimeError(f"missing [package] in {auth_path}")
    next_section = auth.find("\n[", package_start + 1)
    if next_section < 0:
        next_section = len(auth)
    package = auth[package_start:next_section]
    package, count = re.subn(
        r'(?m)^version\s*=\s*"[^"]+"\s*$',
        f'version = "{LAB_AUTH_VERSION}"',
        package,
        count=1,
    )
    if count != 1:
        raise RuntimeError(f"expected package version in {auth_path}, found {count}")
    auth = auth[:package_start] + package + auth[next_section:]
    _write_if_changed(auth_path, auth, changed)

    lock_path = repo_root / "unraid-rs/Cargo.lock"
    lock = lock_path.read_text(encoding="utf-8")
    pattern = re.compile(r'(\[\[package\]\]\nname = "lab-auth"\nversion = ")[^"]+(")')
    lock, count = pattern.subn(rf'\g<1>{LAB_AUTH_VERSION}\2', lock, count=1)
    if count != 1:
        raise RuntimeError(f"expected lab-auth package in {lock_path}, found {count}")
    _write_if_changed(lock_path, lock, changed)

    server_path = repo_root / "unraid-rs/server.json"
    server = json.loads(server_path.read_text(encoding="utf-8"))
    publisher = server["_meta"]["io.modelcontextprotocol.registry/publisher-provided"]
    publisher["distribution"]["npm"] = f"@dinglebear/unraid@{release_version}"
    _write_if_changed(
        server_path, json.dumps(server, indent=2, ensure_ascii=False) + "\n", changed
    )
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--repo-root", type=Path, default=Path(__file__).resolve().parents[2]
    )
    args = parser.parse_args()
    for path in apply(args.repo_root):
        print(path.relative_to(args.repo_root.resolve()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
