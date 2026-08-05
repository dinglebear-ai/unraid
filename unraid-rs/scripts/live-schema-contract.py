#!/usr/bin/env python3
"""Capture a stable structural GraphQL contract from a live Unraid API.

Full schema introspection is preferred for speed. When production blocks that
root, a bounded breadth-first targeted type crawler is used automatically. Both
paths produce the same normalized format consumed by the Rust contract test.
"""

from __future__ import annotations

import argparse
import difflib
import json
import os
import ssl
import sys
import urllib.request
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

FULL_QUERY = r"""
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind name
      fields(includeDeprecated: true) {
        name args(includeDeprecated: true) { name type { ...TypeRef } }
        type { ...TypeRef }
      }
      inputFields(includeDeprecated: true) { name type { ...TypeRef } }
      interfaces { name }
      enumValues(includeDeprecated: true) { name }
      possibleTypes { name }
    }
  }
}
fragment TypeRef on __Type {
  kind name
  ofType { kind name ofType { kind name ofType { kind name ofType {
    kind name ofType { kind name ofType { kind name ofType { kind name } } }
  } } } }
}
"""

TYPE_FRAGMENTS = r"""
fragment TypeDefinition on __Type {
  kind name
  fields(includeDeprecated: true) {
    name args(includeDeprecated: true) { name type { ...TypeRef } }
    type { ...TypeRef }
  }
  inputFields(includeDeprecated: true) { name type { ...TypeRef } }
  interfaces { name }
  enumValues(includeDeprecated: true) { name }
  possibleTypes { name }
}
fragment TypeRef on __Type {
  kind name
  ofType { kind name ofType { kind name ofType { kind name ofType {
    kind name ofType { kind name ofType { kind name ofType { kind name } } }
  } } } }
}
"""


def type_ref(value: dict[str, Any]) -> str:
    kind = value["kind"]
    if kind == "NON_NULL":
        wrapped = value.get("ofType")
        if not isinstance(wrapped, dict):
            raise ValueError(f"NON_NULL has no ofType: {value}")
        return f"{type_ref(wrapped)}!"
    if kind == "LIST":
        wrapped = value.get("ofType")
        if not isinstance(wrapped, dict):
            raise ValueError(f"LIST has no ofType: {value}")
        return f"[{type_ref(wrapped)}]"
    name = value.get("name")
    if not isinstance(name, str):
        raise ValueError(f"named type has no name: {value}")
    return name


def named_type(value: dict[str, Any]) -> str:
    current = value
    while current.get("kind") in {"LIST", "NON_NULL"}:
        current = current.get("ofType")
        if not isinstance(current, dict):
            raise ValueError("wrapper type has no ofType")
    name = current.get("name")
    if not isinstance(name, str):
        raise ValueError("named type has no name")
    return name


def named_types(values: list[dict[str, Any]] | None) -> list[str]:
    return sorted(item["name"] for item in values or [])


def normalize_type(value: dict[str, Any]) -> dict[str, Any]:
    kind = value["kind"]
    result: dict[str, Any] = {"kind": kind}
    if kind in {"OBJECT", "INTERFACE"}:
        fields: dict[str, Any] = {}
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
        result["input_fields"] = dict(sorted(
            (field["name"], type_ref(field["type"]))
            for field in value.get("inputFields") or []
        ))
    elif kind == "ENUM":
        result["enum_values"] = sorted(
            item["name"] for item in value.get("enumValues") or []
        )
    elif kind == "UNION":
        result["possible_types"] = named_types(value.get("possibleTypes"))
    return result


def referenced_names(value: dict[str, Any]) -> set[str]:
    names: set[str] = set()
    for field in value.get("fields") or []:
        names.add(named_type(field["type"]))
        for arg in field.get("args") or []:
            names.add(named_type(arg["type"]))
    for field in value.get("inputFields") or []:
        names.add(named_type(field["type"]))
    names.update(named_types(value.get("interfaces")))
    names.update(named_types(value.get("possibleTypes")))
    return {name for name in names if not name.startswith("__")}


def contract(source: str, roots: dict[str, str | None], types: dict[str, Any]) -> dict[str, Any]:
    return {
        "format": 1,
        "source": source,
        "captured_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "roots": roots,
        "types": dict(sorted(types.items())),
    }


def normalize_full(payload: dict[str, Any], source: str) -> dict[str, Any]:
    if payload.get("errors"):
        raise RuntimeError("full introspection returned GraphQL errors")
    schema = payload["data"]["__schema"]
    types = {
        item["name"]: normalize_type(item)
        for item in schema["types"]
        if item.get("name") and not item["name"].startswith("__")
    }
    roots = {
        key: schema[key]["name"] if schema.get(key) else None
        for key in ("queryType", "mutationType", "subscriptionType")
    }
    return contract(source, roots, types)


def build_batch(names: list[str]) -> tuple[str, dict[str, str]]:
    ordered = sorted(set(names))
    definitions = ", ".join(f"$n{i}: String!" for i in range(len(ordered)))
    selections = "\n".join(
        f"  t{i}: __type(name: $n{i}) {{ ...TypeDefinition }}"
        for i in range(len(ordered))
    )
    query = (
        f"query DynamicTypes({definitions}) {{\n"
        f"{selections}\n"
        "}\n"
        f"{TYPE_FRAGMENTS}"
    )
    return query, {f"n{i}": name for i, name in enumerate(ordered)}


def post(url: str, api_key: str, insecure: bool, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps({"query": query, "variables": variables or {}}).encode(),
        headers={"content-type": "application/json", "x-api-key": api_key},
        method="POST",
    )
    context = ssl._create_unverified_context() if insecure else None
    with urllib.request.urlopen(request, context=context, timeout=30) as response:
        return json.load(response)


def crawl_targeted(
    url: str,
    api_key: str,
    insecure: bool,
    source: str,
    roots: dict[str, str | None],
    batch_size: int,
    max_types: int,
    max_batches: int,
) -> dict[str, Any]:
    required = [roots["queryType"], roots["mutationType"]]
    pending = deque(sorted(name for name in required if name))
    subscription = roots.get("subscriptionType")
    if subscription:
        pending.append(subscription)
    visited: dict[str, dict[str, Any]] = {}
    batches = 0

    while pending:
        batches += 1
        if batches > max_batches:
            raise RuntimeError(f"targeted crawl exceeded max batches ({max_batches})")
        names: list[str] = []
        while pending and len(names) < batch_size:
            name = pending.popleft()
            if name not in visited and name not in names:
                names.append(name)
        if not names:
            continue
        query, variables = build_batch(names)
        payload = post(url, api_key, insecure, query, variables)
        if payload.get("errors"):
            raise RuntimeError("targeted introspection returned GraphQL errors")
        data = payload.get("data")
        if not isinstance(data, dict):
            raise RuntimeError("targeted response has no data object")
        for index, requested in enumerate(sorted(set(names))):
            value = data.get(f"t{index}")
            if value is None and requested == subscription:
                roots["subscriptionType"] = None
                continue
            if not isinstance(value, dict):
                raise RuntimeError(f"targeted introspection returned null for {requested}")
            if value.get("name") != requested:
                raise RuntimeError(f"targeted introspection returned wrong type for {requested}")
            normalized = normalize_type(value)
            prior = visited.get(requested)
            if prior is not None and prior != normalized:
                raise RuntimeError(f"conflicting targeted definitions for {requested}")
            visited[requested] = normalized
            if len(visited) > max_types:
                raise RuntimeError(f"targeted crawl exceeded max types ({max_types})")
            for referenced in sorted(referenced_names(value)):
                if referenced not in visited and referenced not in pending:
                    pending.append(referenced)

    for name in required:
        if name and name not in visited:
            raise RuntimeError(f"required root type {name} was not discovered")
    return contract(source, roots, visited)


def capture(url: str, api_key: str, insecure: bool, source: str, roots: dict[str, str | None], batch_size: int, max_types: int, max_batches: int) -> dict[str, Any]:
    payload = post(url, api_key, insecure, FULL_QUERY)
    try:
        return normalize_full(payload, source)
    except (KeyError, TypeError, RuntimeError, ValueError) as error:
        print(f"full schema introspection unavailable ({error}); using targeted type crawl", file=sys.stderr)
        return crawl_targeted(url, api_key, insecure, source, dict(roots), batch_size, max_types, max_batches)


def self_test() -> None:
    fixture_path = Path(__file__).parent.parent / "tests/fixtures/dynamic/minimal-query-types.json"
    fixture = json.loads(fixture_path.read_text())
    query = fixture["data"]["t0"]
    assert list(normalize_type(query)["fields"]) == ["disk", "ping"]
    assert referenced_names(query) == {"Boolean", "Disk", "PrefixedID"}
    document, variables = build_batch(["VmMutations", "Mutation"])
    assert variables == {"n0": "Mutation", "n1": "VmMutations"}
    assert "__schema" not in document
    assert "VmMutations" not in document
    print("live-schema-contract self-test passed")


def main() -> int:
    parser = argparse.ArgumentParser()
    destination = parser.add_mutually_exclusive_group()
    destination.add_argument("--output", type=Path)
    destination.add_argument("--check", type=Path)
    parser.add_argument("--source-label", default="live-unraid")
    parser.add_argument("--query-root", default=os.environ.get("UNRAID_QUERY_ROOT", "Query"))
    parser.add_argument("--mutation-root", default=os.environ.get("UNRAID_MUTATION_ROOT", "Mutation"))
    parser.add_argument("--subscription-root", default=os.environ.get("UNRAID_SUBSCRIPTION_ROOT", "Subscription"))
    parser.add_argument("--batch-size", type=int, default=20)
    parser.add_argument("--max-types", type=int, default=2000)
    parser.add_argument("--max-batches", type=int, default=200)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if min(args.batch_size, args.max_types, args.max_batches) <= 0:
        parser.error("batch and crawl limits must be positive")
    url = os.environ.get("UNRAID_API_URL")
    api_key = os.environ.get("UNRAID_API_KEY")
    if not url or not api_key:
        parser.error("UNRAID_API_URL and UNRAID_API_KEY must be set")
    insecure = os.environ.get("UNRAID_API_SKIP_TLS_VERIFY", "").lower() in {"1", "true", "yes"}
    result = capture(
        url, api_key, insecure, args.source_label,
        {
            "queryType": args.query_root,
            "mutationType": args.mutation_root,
            "subscriptionType": args.subscription_root or None,
        },
        args.batch_size, args.max_types, args.max_batches,
    )
    if args.check:
        expected = json.loads(args.check.read_text())
        expected.pop("captured_at", None)
        actual = dict(result)
        actual.pop("captured_at", None)
        if actual == expected:
            print(f"live schema matches {args.check}")
            return 0
        print("\n".join(difflib.unified_diff(
            json.dumps(expected, indent=2, sort_keys=True).splitlines(),
            json.dumps(actual, indent=2, sort_keys=True).splitlines(),
            fromfile=str(args.check), tofile="live-introspection", lineterm="",
        )))
        return 1
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.write_text(rendered)
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
