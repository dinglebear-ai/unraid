#!/usr/bin/env python3
"""Validate the monorepo release contract and print its concrete release plan."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tomllib
from dataclasses import asdict, dataclass
from pathlib import Path

from plugin_calver import CALVER_RE, COMPONENTS, calendar_date, read_plugin_version

BOOTSTRAP_SHA = "2f4e40d475f93a354d1420d22127b23c5aed56b5"
RELEASE_PLEASE_PACKAGES = {"unraid-py", "unraid-rs"}
SEMVER_RE = re.compile(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(?:[-+].*)?$")


@dataclass(frozen=True)
class ReleaseUnit:
    name: str
    version: str
    tag: str
    manager: str


def git(repo_root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def semver_key(version: str) -> tuple[int, int, int]:
    match = SEMVER_RE.fullmatch(version)
    if not match:
        raise ValueError(f"invalid semantic version {version!r}")
    return tuple(int(match.group(part)) for part in ("major", "minor", "patch"))


def tagged_versions(repo_root: Path, prefix: str) -> list[str]:
    output = git(repo_root, "tag", "--list", f"{prefix}*")
    return [
        line.removeprefix(prefix)
        for line in output.splitlines()
        if line.startswith(prefix)
    ]


def assert_true(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def validate_release_please(repo_root: Path, errors: list[str]) -> list[ReleaseUnit]:
    config = json.loads((repo_root / "release-please-config.json").read_text())
    manifest = json.loads((repo_root / ".release-please-manifest.json").read_text())
    packages = config.get("packages", {})

    assert_true(
        config.get("bootstrap-sha") == BOOTSTRAP_SHA,
        f"release-please bootstrap-sha must be {BOOTSTRAP_SHA}",
        errors,
    )
    assert_true(
        set(packages) == RELEASE_PLEASE_PACKAGES,
        f"release-please packages must be exactly {sorted(RELEASE_PLEASE_PACKAGES)}",
        errors,
    )
    assert_true(
        set(manifest) == RELEASE_PLEASE_PACKAGES,
        f"release manifest packages must be exactly {sorted(RELEASE_PLEASE_PACKAGES)}",
        errors,
    )

    python_cfg = packages.get("unraid-py", {})
    rust_cfg = packages.get("unraid-rs", {})
    assert_true(
        python_cfg.get("component") == ""
        and python_cfg.get("include-component-in-tag") is False,
        "unraid-py must explicitly produce unprefixed vX.Y.Z tags",
        errors,
    )
    assert_true(
        rust_cfg.get("component") == "unraid-rs",
        "unraid-rs must produce unraid-rs-vX.Y.Z tags",
        errors,
    )
    rust_extra_files = {
        (entry.get("path"), entry.get("jsonpath"))
        for entry in rust_cfg.get("extra-files", [])
        if isinstance(entry, dict)
    }
    assert_true(
        ("packages/unraid-rmcp/package.json", "$.binaryVersion") in rust_extra_files,
        "release-please must update the npm launcher's binaryVersion",
        errors,
    )

    pyproject = tomllib.loads((repo_root / "unraid-py/pyproject.toml").read_text())
    cargo = tomllib.loads((repo_root / "unraid-rs/Cargo.toml").read_text())
    npm_package = json.loads(
        (repo_root / "unraid-rs/packages/unraid-rmcp/package.json").read_text()
    )
    versions = {
        "unraid-py": pyproject["project"]["version"],
        "unraid-rs": cargo["package"]["version"],
    }
    tag_prefixes = {"unraid-py": "v", "unraid-rs": "unraid-rs-v"}
    assert_true(
        npm_package.get("version") == versions["unraid-rs"],
        f"npm package version {npm_package.get('version')} != Rust {versions['unraid-rs']}",
        errors,
    )
    assert_true(
        npm_package.get("binaryVersion") == versions["unraid-rs"],
        f"npm binaryVersion {npm_package.get('binaryVersion')} != Rust {versions['unraid-rs']}",
        errors,
    )

    units: list[ReleaseUnit] = []
    for name in sorted(RELEASE_PLEASE_PACKAGES):
        version = versions[name]
        manifest_version = manifest.get(name)
        assert_true(
            version == manifest_version,
            f"{name} source version {version} != manifest {manifest_version}",
            errors,
        )
        try:
            current_key = semver_key(version)
        except ValueError as exc:
            errors.append(str(exc))
            continue

        released = tagged_versions(repo_root, tag_prefixes[name])
        valid_released = []
        for released_version in released:
            try:
                valid_released.append((semver_key(released_version), released_version))
            except ValueError:
                continue
        if valid_released:
            latest_key, latest = max(valid_released)
            assert_true(
                current_key >= latest_key,
                f"{name} version {version} regresses from released {latest}",
                errors,
            )

        units.append(
            ReleaseUnit(
                name=name,
                version=version,
                tag=f"{tag_prefixes[name]}{version}",
                manager="release-please",
            )
        )

    try:
        git(repo_root, "cat-file", "-e", f"{BOOTSTRAP_SHA}^{{commit}}")
        release_as = git(
            repo_root,
            "log",
            f"{BOOTSTRAP_SHA}..HEAD",
            "--format=%B%x00",
        )
        assert_true(
            "Release-As:" not in release_as,
            "Release-As directives are forbidden after the monorepo bootstrap boundary",
            errors,
        )
    except subprocess.CalledProcessError as exc:
        errors.append(f"could not validate bootstrap commit: {exc}")

    return units


def validate_plugins(repo_root: Path, errors: list[str]) -> list[ReleaseUnit]:
    units: list[ReleaseUnit] = []
    for name, component in COMPONENTS.items():
        manifest = repo_root / component.manifest
        text = manifest.read_text(encoding="utf-8")
        version = read_plugin_version(manifest)
        released = tagged_versions(repo_root, component.tag_prefix)
        lexical_floor = max(released, default="")

        assert_true(
            "x-release-please-version" not in text,
            f"{component.manifest} must not be managed by release-please",
            errors,
        )
        assert_true(
            version >= lexical_floor,
            f"{name} version {version} sorts before released {lexical_floor}",
            errors,
        )

        # An imported plugin may have a legacy manifest version before its first
        # monorepo tag exists. Preserve that untouched baseline; once a component
        # has tags, every changed manifest must use the fixed-width CalVer lane.
        changed_since_release = bool(released) and version != lexical_floor
        if changed_since_release:
            assert_true(
                CALVER_RE.fullmatch(version) is not None,
                f"new {name} releases must use fixed-width YYYYMMDD.NNN CalVer",
                errors,
            )
        try:
            calendar_date(version)
        except ValueError as exc:
            errors.append(f"{name}: {exc}")

        units.append(
            ReleaseUnit(
                name=name,
                version=version,
                tag=f"{component.tag_prefix}{version}",
                manager="plugin-calver",
            )
        )
    return units


def validate(repo_root: Path) -> tuple[list[str], list[ReleaseUnit]]:
    errors: list[str] = []
    units = validate_release_please(repo_root, errors)
    units.extend(validate_plugins(repo_root, errors))
    return errors, units


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root", type=Path, default=Path(__file__).resolve().parents[2]
    )
    parser.add_argument("--json", action="store_true", dest="as_json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    errors, units = validate(args.repo_root.resolve())
    plan = {"units": [asdict(unit) for unit in units], "errors": errors}
    if args.as_json:
        print(json.dumps(plan, indent=2, sort_keys=True))
    else:
        for unit in units:
            print(f"{unit.name}: {unit.version} -> {unit.tag} ({unit.manager})")
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
