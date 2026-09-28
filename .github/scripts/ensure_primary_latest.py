#!/usr/bin/env python3
"""Restore the newest primary Unraid MCP release as repository Latest.

Component releases (Rust, Incus, and Codex) must never become the repository-wide
Latest release because legacy Python-era plugin manifests resolve their update
metadata through releases/latest. The primary lane uses unprefixed vX.Y.Z tags.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

PRIMARY_TAG_RE = re.compile(r"^v(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)$")


class LatestReleaseError(RuntimeError):
    """Raised when the primary release cannot be selected or restored."""


def semver_key(tag: str) -> tuple[int, int, int]:
    match = PRIMARY_TAG_RE.fullmatch(tag)
    if not match:
        raise ValueError(f"not a primary release tag: {tag}")
    return tuple(int(match.group(part)) for part in ("major", "minor", "patch"))


def select_primary_release(releases: list[dict[str, Any]]) -> dict[str, Any]:
    candidates = [
        release
        for release in releases
        if release.get("draft") is False
        and release.get("prerelease") is False
        and isinstance(release.get("tag_name"), str)
        and PRIMARY_TAG_RE.fullmatch(release["tag_name"])
    ]
    if not candidates:
        raise LatestReleaseError("no published primary vX.Y.Z release exists")
    return max(candidates, key=lambda release: semver_key(release["tag_name"]))


def gh_json(*args: str, input_text: str | None = None) -> Any:
    result = subprocess.run(
        ["gh", *args],
        check=True,
        capture_output=True,
        text=True,
        input=input_text,
    )
    return json.loads(result.stdout)


def list_releases(repo: str) -> list[dict[str, Any]]:
    releases: list[dict[str, Any]] = []
    page = 1
    while True:
        batch = gh_json("api", f"repos/{repo}/releases?per_page=100&page={page}")
        if not isinstance(batch, list):
            raise LatestReleaseError("GitHub releases API returned a non-list payload")
        releases.extend(batch)
        if len(batch) < 100:
            return releases
        page += 1


def patch_make_latest(repo: str, release_id: int, value: bool) -> None:
    payload = json.dumps({"make_latest": "true" if value else "false"})
    subprocess.run(
        [
            "gh",
            "api",
            "--method",
            "PATCH",
            f"repos/{repo}/releases/{release_id}",
            "--input",
            "-",
        ],
        check=True,
        text=True,
        input=payload,
        stdout=subprocess.DEVNULL,
    )


def write_github_output(tag: str, release_id: int) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return
    with Path(output_path).open("a", encoding="utf-8") as output:
        output.write(f"tag={tag}\nrelease_id={release_id}\n")


def restore_primary_latest(
    repo: str,
    current_tag: str,
    *,
    retries: int = 10,
    delay_seconds: float = 1.0,
) -> dict[str, Any]:
    current = gh_json("api", f"repos/{repo}/releases/tags/{current_tag}")
    if not isinstance(current, dict) or not isinstance(current.get("id"), int):
        raise LatestReleaseError(f"could not resolve current release {current_tag}")

    primary = select_primary_release(list_releases(repo))
    primary_id = primary.get("id")
    primary_tag = primary.get("tag_name")
    if not isinstance(primary_id, int) or not isinstance(primary_tag, str):
        raise LatestReleaseError("selected primary release is missing id or tag_name")

    patch_make_latest(repo, primary_id, True)
    if current["id"] != primary_id:
        patch_make_latest(repo, current["id"], False)

    for attempt in range(1, retries + 1):
        latest = gh_json("api", f"repos/{repo}/releases/latest")
        if isinstance(latest, dict) and latest.get("tag_name") == primary_tag:
            write_github_output(primary_tag, primary_id)
            print(
                f"restored primary Latest release: {primary_tag} "
                f"(release id {primary_id})"
            )
            return primary
        if attempt < retries:
            time.sleep(delay_seconds)

    observed = gh_json("api", f"repos/{repo}/releases/latest")
    observed_tag = observed.get("tag_name") if isinstance(observed, dict) else observed
    raise LatestReleaseError(
        f"Latest release did not converge to {primary_tag}; observed {observed_tag!r}"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "current_tag", help="component release tag that triggered the workflow"
    )
    parser.add_argument(
        "--repo",
        default=os.environ.get("GITHUB_REPOSITORY"),
        help="owner/repo (default: GITHUB_REPOSITORY)",
    )
    parser.add_argument("--retries", type=int, default=10)
    parser.add_argument("--delay", type=float, default=1.0)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.repo:
        print("error: --repo or GITHUB_REPOSITORY is required", file=sys.stderr)
        return 2
    if args.retries < 1 or args.delay < 0:
        print("error: retries must be positive and delay non-negative", file=sys.stderr)
        return 2
    try:
        restore_primary_latest(
            args.repo,
            args.current_tag,
            retries=args.retries,
            delay_seconds=args.delay,
        )
    except (
        LatestReleaseError,
        subprocess.CalledProcessError,
        json.JSONDecodeError,
    ) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
