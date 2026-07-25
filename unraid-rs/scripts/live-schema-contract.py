#!/usr/bin/env python3
"""Capture a stable structural GraphQL contract from live introspection."""

from __future__ import annotations

import argparse
import difflib
import json
import os
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


INTROSPECTION_QUERY = r"""
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      fields(includeDeprecated: true) {
        name
        args(includeDeprecated: true) {
          name
          type { ...TypeRef }
        }
        type { ...TypeRef }
      }
      inputFields(includeDeprecated: true) {
        name
        type { ...TypeRef }
      }
      interfaces { name }
      enumValues(includeDeprecated: true) { name }
      possibleTypes { name }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
"""


def type_ref(value: dict[str, object]) -> str:
    kind = value["kind"]
    if kind == "NON_NULL":
        return f"{type_ref(value['ofType'])}!"
    if kind == "LIST":
        return f"[{type_ref(value['ofType'])}]"
    name = value.get("name")
    if not isinstance(name, str):
        raise ValueError(f"named type has no name: {value}")
    return name


def named_types(values: list[dict[str, object]] | None) -> list[str]:
    return sorted(item["name"] for item in values or [])


def normalize_type(value: dict[str, object]) -> dict[str, object]:
    kind = value["kind"]
    result: dict[str, object] = {"kind": kind}

    if kind in {"OBJECT", "INTERFACE"}:
        fields: dict[str, object] = {}
        for field in value.get("fields") or []:
            args = {
                arg["name"]: type_ref(arg["type"])
                for arg in field.get("args") or []
            }
            fields[field["name"]] = {
                "type": type_ref(field["type"]),
                "args": dict(sorted(args.items())),
            }
        result["fields"] = dict(sorted(fields.items()))
        result["interfaces"] = named_types(value.get("interfaces"))
    elif kind == "INPUT_OBJECT":
        result["input_fields"] = dict(
            sorted(
                (
                    field["name"],
                    type_ref(field["type"]),
                )
                for field in value.get("inputFields") or []
            )
        )
    elif kind == "ENUM":
        result["enum_values"] = sorted(
            item["name"] for item in value.get("enumValues") or []
        )
    elif kind == "UNION":
        result["possible_types"] = named_types(value.get("possibleTypes"))

    return result


def normalize(payload: dict[str, object], source_label: str) -> dict[str, object]:
    if payload.get("errors"):
        raise RuntimeError(f"introspection returned GraphQL errors: {payload['errors']}")
    schema = payload["data"]["__schema"]
    types = {
        item["name"]: normalize_type(item)
        for item in schema["types"]
        if item.get("name") and not item["name"].startswith("__")
    }
    return {
        "format": 1,
        "source": source_label,
        "captured_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "roots": {
            key: schema[key]["name"] if schema.get(key) else None
            for key in ("queryType", "mutationType", "subscriptionType")
        },
        "types": dict(sorted(types.items())),
    }


def fetch(url: str, api_key: str, skip_tls_verify: bool) -> dict[str, object]:
    body = json.dumps({"query": INTROSPECTION_QUERY}).encode()
    request = urllib.request.Request(
        url,
        data=body,
        headers={"content-type": "application/json", "x-api-key": api_key},
        method="POST",
    )
    context = ssl._create_unverified_context() if skip_tls_verify else None
    with urllib.request.urlopen(request, context=context, timeout=30) as response:
        return json.load(response)


def main() -> int:
    parser = argparse.ArgumentParser()
    destination = parser.add_mutually_exclusive_group()
    destination.add_argument("--output", type=Path)
    destination.add_argument(
        "--check",
        type=Path,
        help="compare live introspection with an existing normalized snapshot",
    )
    parser.add_argument("--source-label", default="live-unraid")
    args = parser.parse_args()

    url = os.environ.get("UNRAID_API_URL")
    api_key = os.environ.get("UNRAID_API_KEY")
    if not url or not api_key:
        parser.error("UNRAID_API_URL and UNRAID_API_KEY must be set")

    skip_tls_verify = os.environ.get(
        "UNRAID_API_SKIP_TLS_VERIFY", ""
    ).lower() in {"1", "true", "yes"}
    contract = normalize(fetch(url, api_key, skip_tls_verify), args.source_label)
    if args.check:
        expected = json.loads(args.check.read_text())
        expected.pop("captured_at", None)
        actual = dict(contract)
        actual.pop("captured_at", None)
        if actual == expected:
            print(f"live schema matches {args.check}")
            return 0
        expected_text = json.dumps(expected, indent=2, sort_keys=True).splitlines()
        actual_text = json.dumps(actual, indent=2, sort_keys=True).splitlines()
        print(
            "\n".join(
                difflib.unified_diff(
                    expected_text,
                    actual_text,
                    fromfile=str(args.check),
                    tofile="live-introspection",
                    lineterm="",
                )
            )
        )
        return 1

    rendered = json.dumps(contract, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.write_text(rendered)
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
