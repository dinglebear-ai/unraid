#!/usr/bin/env python3
"""Assert every pinned GitHub Action carries an accurate version comment.

The 40-hex SHA is the real pin — that part is enforced by
unraid-py/tests/test_supply_chain_policy.py::test_every_external_action_is_immutable.
This script guards the *comment* beside it, which is what a human actually reads
when auditing pins or bumping a version.

Why it matters: after the consolidation, build-unraid-plugin.yml annotated
actions/checkout@9c091bb… as "# v5.0.0" while every other workflow annotated the
SAME SHA as "# v7.0.0". Nothing was broken at runtime, but anyone bumping from
that file would have "upgraded" to a real v5 SHA — a silent downgrade.

Two rules:
  1. A given (action, sha) pair must never be annotated with two different versions.
  2. Every pinned action must have a version comment at all.

NOTE: this lives in a script rather than inline in meta-ci.yml on purpose. The
policy test above scans workflow YAML line-by-line for the literal "uses:", so a
regex containing that text inside a workflow file trips it as a false positive.
"""

from __future__ import annotations

import collections
import glob
import re
import sys

# Split so the literal "uses:" never appears in this file's own source either —
# harmless here, but keeps the pattern greppable without self-matching.
PIN = re.compile(r"\buses" + r":\s*([^@\s]+)@([0-9a-f]{40})(?:\s*#\s*(\S+))?")

WORKFLOWS = sorted(glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml"))


def main() -> int:
    versions: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    unannotated: list[str] = []

    for path in WORKFLOWS:
        for action, sha, version in PIN.findall(open(path, encoding="utf-8").read()):
            if version:
                versions[(action, sha)].add(version)
            else:
                unannotated.append(f"{path}: {action}@{sha[:12]}")

    failures: list[str] = []

    conflicts = {k: sorted(v) for k, v in versions.items() if len(v) > 1}
    for (action, sha), vers in sorted(conflicts.items()):
        failures.append(f"{action}@{sha[:12]} is annotated as {' and '.join(vers)} in different workflows")

    for entry in unannotated:
        failures.append(f"pinned action without a version comment — {entry}")

    if failures:
        print("action pin comment check FAILED:", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        print(
            "\nPick the correct version for the SHA and use it everywhere "
            "(resolve with: gh api repos/<owner>/<repo>/tags --jq '.[] | \"\\(.name) \\(.commit.sha)\"' | grep <sha>)",
            file=sys.stderr,
        )
        return 1

    print(f"{len(versions)} pinned action/SHA pairs across {len(WORKFLOWS)} workflows have consistent version comments")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
