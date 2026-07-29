#!/usr/bin/env python3
"""Prepare lexicographically safe CalVer releases for Unraid plugins.

Unraid compares plugin versions as raw strings. The compact fixed-width format
YYYYMMDD.NNN therefore preserves chronological ordering and sorts after the
legacy YYYY.M.D values already published by this repository.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

CALVER_RE = re.compile(r"^(?P<date>\d{8})\.(?P<sequence>\d{3})$")
LEGACY_CALVER_RE = re.compile(r"^(?P<year>\d{4})\.(?P<month>\d{1,2})\.(?P<day>\d{1,2})$")
VERSION_ENTITY_RE = re.compile(
    r'(?m)^(?P<prefix>\s*<!ENTITY\s+version\s+")(?P<version>[^"]+)'
    r'(?P<suffix>"\s*>)(?:\s*<!--.*?-->)?\s*$'
)


@dataclass(frozen=True)
class Component:
    name: str
    manifest: str
    tag_prefix: str


@dataclass(frozen=True)
class ReleasePlan:
    component: str
    manifest: str
    current_version: str
    version: str
    tag: str
    calendar_date: str
    sequence: int


COMPONENTS = {
    "incus": Component("incus", "plugins/incus/incus.plg", "incus-v"),
    "codex": Component("codex", "plugins/codex/unraid-codex.plg", "codex-v"),
}


def read_plugin_version(path: Path) -> str:
    match = VERSION_ENTITY_RE.search(path.read_text(encoding="utf-8"))
    if not match:
        raise ValueError(f"could not parse <!ENTITY version> from {path}")
    return match.group("version")


def calendar_date(version: str) -> dt.date:
    match = CALVER_RE.fullmatch(version)
    if match:
        return dt.datetime.strptime(match.group("date"), "%Y%m%d").date()

    legacy = LEGACY_CALVER_RE.fullmatch(version)
    if legacy:
        return dt.date(
            int(legacy.group("year")),
            int(legacy.group("month")),
            int(legacy.group("day")),
        )

    raise ValueError(
        f"unsupported plugin version {version!r}; expected legacy YYYY.M.D "
        "or current YYYYMMDD.NNN"
    )


def parse_current_calver(version: str) -> tuple[dt.date, int] | None:
    match = CALVER_RE.fullmatch(version)
    if not match:
        return None
    return (
        dt.datetime.strptime(match.group("date"), "%Y%m%d").date(),
        int(match.group("sequence")),
    )


def make_version(release_date: dt.date, sequence: int) -> str:
    if not 1 <= sequence <= 999:
        raise ValueError("plugin release sequence must be between 1 and 999")
    return f"{release_date:%Y%m%d}.{sequence:03d}"


def next_version(
    release_date: dt.date,
    current_version: str,
    released_versions: Iterable[str],
) -> str:
    released = list(released_versions)
    dated_versions = [current_version, *released]
    latest_calendar_date = max(calendar_date(version) for version in dated_versions)
    if release_date < latest_calendar_date:
        raise ValueError(
            f"release date {release_date.isoformat()} predates the latest plugin "
            f"release date {latest_calendar_date.isoformat()}"
        )

    sequences = []
    for version in dated_versions:
        parsed = parse_current_calver(version)
        if parsed and parsed[0] == release_date:
            sequences.append(parsed[1])

    candidate = make_version(release_date, max(sequences, default=0) + 1)
    lexical_floor = max(dated_versions)
    if candidate <= lexical_floor:
        raise ValueError(
            f"candidate {candidate} does not sort after existing version {lexical_floor}"
        )
    return candidate


def validate_explicit_version(
    version: str,
    current_version: str,
    released_versions: Iterable[str],
) -> None:
    if not CALVER_RE.fullmatch(version):
        raise ValueError("explicit plugin version must use YYYYMMDD.NNN")

    released = list(released_versions)
    version_date = calendar_date(version)
    latest_calendar_date = max(
        calendar_date(item) for item in [current_version, *released]
    )
    if version_date < latest_calendar_date:
        raise ValueError(
            f"explicit version date {version_date.isoformat()} predates "
            f"{latest_calendar_date.isoformat()}"
        )

    lexical_floor = max([current_version, *released])
    if version <= lexical_floor:
        raise ValueError(
            f"explicit version {version} must sort after existing version {lexical_floor}"
        )


def update_plugin_version(path: Path, version: str) -> None:
    text = path.read_text(encoding="utf-8")

    def replacement(match: re.Match[str]) -> str:
        return (
            f'{match.group("prefix")}{version}{match.group("suffix")} '
            '<!-- managed by .github/scripts/plugin_calver.py -->'
        )

    updated, count = VERSION_ENTITY_RE.subn(replacement, text, count=1)
    if count != 1:
        raise ValueError(f"expected exactly one version entity in {path}, found {count}")
    path.write_text(updated, encoding="utf-8")


def git_tag_versions(repo_root: Path, prefix: str) -> list[str]:
    result = subprocess.run(
        ["git", "tag", "--list", f"{prefix}*"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return [
        line.removeprefix(prefix)
        for line in result.stdout.splitlines()
        if line.startswith(prefix)
    ]


def build_plan(
    repo_root: Path,
    component_name: str,
    release_date: dt.date,
    explicit_version: str | None = None,
) -> ReleasePlan:
    component = COMPONENTS[component_name]
    manifest = repo_root / component.manifest
    current = read_plugin_version(manifest)
    released = git_tag_versions(repo_root, component.tag_prefix)

    if explicit_version:
        validate_explicit_version(explicit_version, current, released)
        version = explicit_version
    else:
        version = next_version(release_date, current, released)

    parsed = parse_current_calver(version)
    assert parsed is not None
    return ReleasePlan(
        component=component.name,
        manifest=component.manifest,
        current_version=current,
        version=version,
        tag=f"{component.tag_prefix}{version}",
        calendar_date=parsed[0].isoformat(),
        sequence=parsed[1],
    )


def parse_args() -> argparse.Namespace:
    default_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("component", choices=sorted(COMPONENTS))
    parser.add_argument("--repo-root", type=Path, default=default_root)
    parser.add_argument(
        "--date",
        type=dt.date.fromisoformat,
        default=dt.date.today(),
        help="release date in YYYY-MM-DD form (default: today)",
    )
    parser.add_argument("--version", help="explicit YYYYMMDD.NNN version")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true", dest="as_json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    plan = build_plan(repo_root, args.component, args.date, args.version)
    if not args.dry_run:
        update_plugin_version(repo_root / plan.manifest, plan.version)

    if args.as_json:
        print(json.dumps(asdict(plan), sort_keys=True))
    else:
        mode = "would prepare" if args.dry_run else "prepared"
        print(
            f"{mode} {plan.component} {plan.current_version} -> {plan.version} "
            f"({plan.tag})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
