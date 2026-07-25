#!/usr/bin/env -S uv run python
"""Report Unraid GraphQL root-field coverage for exposed operations."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def _load_report() -> dict[str, Any]:
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    from unraid_mcp.devtools.api_parity import api_parity_report

    return api_parity_report()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit JSON instead of a table")
    args = parser.parse_args()

    report = _load_report()
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0

    print("Unraid GraphQL API parity")
    print(f"tracked GraphQL documents: {report['operation_count']}")
    print()
    for section in ("query", "mutation", "subscription"):
        data = report[section]
        print(
            f"{section:<12} {data['used']:>3}/{data['total']:<3} used  "
            f"{len(data['missing']):>2} missing  "
            f"{len(data['unclassified_missing']):>2} unclassified"
        )

    for section in ("query", "subscription"):
        intentional = report[section]["intentional"]
        if not intentional:
            continue
        print()
        print(f"intentional {section} gaps:")
        for name, reason in intentional.items():
            print(f"  {name}: {reason}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
