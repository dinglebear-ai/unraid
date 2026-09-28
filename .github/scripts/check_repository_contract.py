#!/usr/bin/env python3
"""Run the pinned fleet contract with this repository's canonical instruction rule.

The upstream implementation hard-codes CLAUDE.md as canonical. Replace only that
rule with the mandatory AGENTS.md working-tree and Git-index validator. Keep
all other upstream findings fatal; do not alter the imported implementation.
"""

from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
import subprocess
import sys
from types import ModuleType


REPLACED_CHECK = "symlink-convention"


def load_fleet(script: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location("unraid_pinned_fleet_contract", script)
    if spec is None or spec.loader is None:
        raise ValueError(f"Cannot load fleet validator: {script}")
    module = importlib.util.module_from_spec(spec)
    # Dataclass annotations resolve their defining module through sys.modules.
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    if not callable(getattr(module, "check", None)):
        raise ValueError("Fleet validator does not expose check(repo, profile)")
    return module


def check(repo: Path, fleet_script: Path, profile: str) -> int:
    fleet = load_fleet(fleet_script)
    findings = [finding for finding in fleet.check(repo, profile)
                if finding.check != REPLACED_CHECK]
    for finding in findings:
        print(finding.render())
    # This is mandatory even when the upstream has no findings. In particular,
    # a correct working tree must not conceal an obsolete or malformed index.
    local = subprocess.run(
        [sys.executable, str(repo / ".github/scripts/check_documentation.py"), "--check-index"],
        cwd=repo, capture_output=True, text=True, timeout=60,
    )
    if local.stdout:
        print(local.stdout, end="")
    if local.stderr:
        print(local.stderr, end="", file=sys.stderr)
    if local.returncode:
        print(f"repository-documentation: validator exited {local.returncode}")
    failed = bool(findings) or local.returncode != 0
    if not failed:
        print("Repository contract passed with AGENTS.md canonical instructions")
    return int(failed)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--fleet-script", type=Path, required=True)
    parser.add_argument("--profile", choices=("rust", "python", "node", "go", "ops"), default="rust")
    args = parser.parse_args(argv)
    try:
        return check(args.repo.resolve(), args.fleet_script.resolve(), args.profile)
    except Exception as exc:
        # A failed import or changed upstream API must never become a green gate.
        print(f"Repository contract failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
