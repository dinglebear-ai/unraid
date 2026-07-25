#!/usr/bin/env python3
"""Fail the build when a workflow uses an action this repo's allowlist forbids.

WHY: the repo is configured with `allowed_actions: selected`. GitHub rejects a
non-allowlisted action at COMPILE time — before scheduling any job — producing a
`startup_failure` with no check-run, no jobs and no logs. The workflow then shows
up as an ABSENT check rather than a failing one, so branch protection cannot see
it. rust-ci sat broken and invisible that way from 2026-07-24 until 2026-07-25.

A workflow's GITHUB_TOKEN cannot read the live setting (that needs the
`administration` permission, unavailable to workflows), so this checks against the
checked-in mirror at .github/allowed-actions.txt. See that file for how to keep
the two in sync.

Matching rules mirror GitHub's:
  * `actions/*` and `github/*` are always allowed (github_owned_allowed: true)
  * a local action (`./...`) or a reusable workflow in this repo needs no entry
  * `docker/*@*` style patterns glob on both the owner/repo and the ref
"""

from __future__ import annotations

import fnmatch
import glob
import re
import sys

ALLOWLIST = ".github/allowed-actions.txt"
# Owners whose actions GitHub itself publishes; covered by github_owned_allowed.
GITHUB_OWNED = {"actions", "github"}

USES = re.compile(r"^\s*-?\s*uses\s*:\s*['\"]?([^'\"\s]+)", re.M)


def load_patterns(path: str) -> list[str]:
    out = []
    try:
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#"):
                out.append(line)
    except FileNotFoundError:
        print(f"error: {path} is missing — it mirrors the repo Actions allowlist", file=sys.stderr)
        raise SystemExit(1)
    if not out:
        print(f"error: {path} lists no patterns", file=sys.stderr)
        raise SystemExit(1)
    return out


def allowed(ref: str, patterns: list[str]) -> bool:
    # Local composite action or a reusable workflow inside this repo.
    if ref.startswith("./") or ref.startswith("."):
        return True
    owner = ref.split("/", 1)[0]
    if owner in GITHUB_OWNED:
        return True
    # GitHub matches the pattern against the whole `owner/repo@ref` string.
    return any(fnmatch.fnmatch(ref, p) for p in patterns)


def main() -> int:
    patterns = load_patterns(ALLOWLIST)
    workflows = sorted(glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml"))

    violations: list[tuple[str, str]] = []
    checked = 0
    for path in workflows:
        for ref in USES.findall(open(path, encoding="utf-8").read()):
            checked += 1
            if not allowed(ref, patterns):
                violations.append((path, ref))

    if violations:
        print("Action allowlist check FAILED — these would be rejected by GitHub at", file=sys.stderr)
        print("startup, producing an INVISIBLE missing check rather than a red one:\n", file=sys.stderr)
        seen = set()
        for path, ref in violations:
            print(f"  {path}: {ref}", file=sys.stderr)
            seen.add(ref.split("@", 1)[0])
        print("\nTo allow them you must do BOTH:", file=sys.stderr)
        for name in sorted(seen):
            print(f"  1. add '{name}@*' to {ALLOWLIST}", file=sys.stderr)
        print("  2. apply the same change to the repo setting:", file=sys.stderr)
        print("     gh api -X PUT repos/$GITHUB_REPOSITORY/actions/permissions/selected-actions --input <json>", file=sys.stderr)
        print("\nUpdating only this file makes the check pass while CI still breaks at startup.", file=sys.stderr)
        return 1

    print(f"all {checked} action references across {len(workflows)} workflows are allowlisted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
