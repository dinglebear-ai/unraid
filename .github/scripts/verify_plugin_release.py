#!/usr/bin/env python3
"""Read-only validation of the primary bridge and rolling Rust plugin release."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]


def gh(*args: str) -> bytes:
    return subprocess.run(
        ["gh", *args], check=True, capture_output=True, timeout=120
    ).stdout


def release(repo: str, tag: str) -> dict[str, Any]:
    return json.loads(gh("api", f"repos/{repo}/releases/{tag}"))


def asset(release_data: dict[str, Any], name: str) -> dict[str, Any]:
    matches = [item for item in release_data["assets"] if item["name"] == name]
    if len(matches) != 1:
        raise ValueError(f"{release_data['tag_name']}: expected one asset {name}")
    return matches[0]


def download(item: dict[str, Any]) -> bytes:
    return gh("api", "-H", "Accept: application/octet-stream", item["url"])


def package_reference(manifest: bytes, repo: str) -> tuple[str, str, str]:
    if b"PLACEHOLDER" in manifest:
        raise ValueError("plugin manifest contains unresolved placeholders")
    root = ET.fromstring(manifest)
    packages = root.findall("./FILE[URL]")
    if root.tag != "PLUGIN" or root.get("name") != "unraid-mcp" or len(packages) != 1:
        raise ValueError("expected one Unraid MCP plugin package URL")
    package = packages[0]
    url = (package.findtext("URL") or "").strip()
    prefix = f"https://github.com/{repo}/releases/download/"
    match = re.fullmatch(
        re.escape(prefix) + r"(unraid-rs-v[0-9]+\.[0-9]+\.[0-9]+)/([^/]+)", url
    )
    if not match:
        raise ValueError(f"plugin package URL is not a versioned Rust release: {url}")
    tag, filename = match.groups()
    version = subprocess.run(
        ["bash", str(ROOT / "plugins/mcp/scripts/plugin-version.sh"), tag],
        check=True,
        capture_output=True,
        text=True,
        timeout=10,
    ).stdout.strip()
    if root.get("version") != version:
        raise ValueError(f"plugin version must map {tag} to {version}")
    expected = f"unraid-mcp-{version}-x86_64-2.txz"
    if filename != expected or Path(package.get("Name", "")).name != expected:
        raise ValueError(f"plugin package filename must be {expected}")
    digest = re.findall(rb'<!ENTITY\s+sha256\s+"([a-fA-F0-9]{64})"\s*>', manifest)
    if len(digest) != 1:
        raise ValueError("plugin manifest must declare one SHA256 checksum")
    return tag, url, digest[0].decode().lower()


def verify(repo: str) -> None:
    latest = release(repo, "latest")
    if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", latest["tag_name"]):
        raise ValueError(
            f"repository Latest is not a primary release: {latest['tag_name']}"
        )
    bridge = download(asset(latest, "unraid-mcp.plg"))
    rolling = download(
        asset(release(repo, "tags/unraid-plugin-latest"), "unraid-mcp.plg")
    )
    if bridge != rolling:
        raise ValueError("primary bridge and rolling plugin manifests differ")
    tag, url, checksum = package_reference(bridge, repo)
    rust = release(repo, f"tags/{tag}")
    if rust["tag_name"] != tag or rust["draft"] or rust["prerelease"]:
        raise ValueError(f"{tag} must be a published stable Rust release")
    package = asset(rust, url.rsplit("/", 1)[1])
    if package["browser_download_url"] != url:
        raise ValueError("Rust release asset does not match the declared package URL")
    actual = hashlib.sha256(download(package)).hexdigest()
    if actual != checksum:
        raise ValueError(
            f"Rust package SHA256 mismatch: expected {checksum}, got {actual}"
        )
    print(f"Plugin bridge {latest['tag_name']} matches rolling manifest; {url}")
    print(f"Manifest SHA256: {hashlib.sha256(bridge).hexdigest()}")
    print(f"Package SHA256: {actual}")


def main() -> int:
    try:
        verify(os.environ["GITHUB_REPOSITORY"])
    except (ValueError, KeyError, ET.ParseError, subprocess.SubprocessError) as error:
        print(f"::error::plugin release validation failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
