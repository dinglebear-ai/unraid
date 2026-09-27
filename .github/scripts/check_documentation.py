#!/usr/bin/env python3
"""Check canonical agent instructions and maintained local Markdown links.

Offline and standard-library-only. Historical/generated references, external
URLs, and Markdown anchors are not validated. See docs/README.md for scope.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote, urlsplit


INSTRUCTION_NAMES = {"AGENTS.md", "CLAUDE.md", "GEMINI.md"}
ALIASES = ("CLAUDE.md", "GEMINI.md")
LOCAL_INSTRUCTION_NAMES = {"AGENTS.override.md", "CLAUDE.local.md", "CLAUDE.md.local"}
EXCLUDED_TREES = (
    "plugins/incus/docs/unraid/",
    "unraid-py/docs/unraid/",
    "unraid-py/docs/review/",
)
INLINE_LINK = re.compile(r'!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))')
REFERENCE_LINK = re.compile(
    r'^ {0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|([^\s]+))', re.MULTILINE
)


def repository_files(root: Path) -> list[Path]:
    """Include tracked and nonignored new files without walking build trees."""
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        check=True, capture_output=True,
    )
    return sorted({Path(os.fsdecode(name)) for name in result.stdout.split(b"\0") if name})


def instruction_scopes(files: list[Path]) -> list[Path]:
    return sorted({path.parent for path in files if path.name in INSTRUCTION_NAMES})


def canonical_errors(root: Path, scope: Path) -> list[str]:
    canonical = root / scope / "AGENTS.md"
    if canonical.is_symlink() or not canonical.is_file():
        return [f"{scope}: AGENTS.md must be a regular canonical file, not a symlink"]
    if not canonical.read_text(encoding="utf-8").strip():
        return [f"{scope}: AGENTS.md must not be empty"]
    return []


def check_instruction_links(root: Path, scopes: list[Path]) -> list[str]:
    errors = []
    for scope in scopes:
        errors.extend(canonical_errors(root, scope))
        for name in ALIASES:
            alias = root / scope / name
            if not alias.is_symlink() or os.readlink(alias) != "AGENTS.md":
                errors.append(f"{scope / name}: must be a relative symlink to AGENTS.md")
    return errors


def repair_instruction_links(root: Path, scopes: list[Path]) -> list[str]:
    """Repair missing/wrong aliases only; never overwrite a real document.

    Validate every scope before changing any link. Inverted legacy layouts
    require a deliberate content-preserving migration, not automatic repair.
    """
    errors = []
    for scope in scopes:
        errors.extend(canonical_errors(root, scope))
        for name in ALIASES:
            alias = root / scope / name
            if os.path.lexists(alias) and not alias.is_symlink():
                errors.append(f"{scope / name}: refusing to replace a non-symlink; preserve its content")
    if errors:
        return errors
    for scope in scopes:
        for name in ALIASES:
            alias = root / scope / name
            if alias.is_symlink():
                if os.readlink(alias) == "AGENTS.md":
                    continue
                alias.unlink()
            alias.symlink_to("AGENTS.md")
    return []


def check_local_instruction_policy(root: Path, files: list[Path], scopes: list[Path]) -> list[str]:
    """Private instruction names must be ignored and absent from Git discovery.

    Git still returns force-added ignored files from ls-files --cached, so this
    also rejects accidentally staged private content without reading it.
    """
    errors = [
        f"{path}: local instructions must remain untracked and ignored"
        for path in files if path.name in LOCAL_INSTRUCTION_NAMES
    ]
    expected = sorted({scope / name for scope in scopes for name in LOCAL_INSTRUCTION_NAMES})
    if not expected:
        return errors
    result = subprocess.run(
        ["git", "-C", str(root), "check-ignore", "--no-index", "--stdin", "-z"],
        input=b"\0".join(os.fsencode(path) for path in expected) + b"\0",
        capture_output=True,
    )
    if result.returncode not in (0, 1):
        result.check_returncode()
    ignored = set(result.stdout.split(b"\0"))
    errors.extend(
        f"{path}: local instruction filename must be covered by Git ignore rules"
        for path in expected if os.fsencode(path) not in ignored
    )
    return errors


def check_local_instruction_links(root: Path, scopes: list[Path]) -> list[str]:
    """Validate optional local pairs without requiring them in a clean clone."""
    errors = []
    for scope in scopes:
        canonical = root / scope / "AGENTS.override.md"
        alias = root / scope / "CLAUDE.local.md"
        if os.path.lexists(root / scope / "CLAUDE.md.local"):
            errors.append(f"{scope / 'CLAUDE.md.local'}: migrate the unsupported name to AGENTS.override.md")
        if not os.path.lexists(canonical) and not os.path.lexists(alias):
            continue
        if canonical.is_symlink() or not canonical.is_file():
            errors.append(f"{scope / 'AGENTS.override.md'}: must be a regular canonical local file")
        else:
            content = canonical.read_text(encoding="utf-8")
            if not content.strip():
                errors.append(f"{scope / 'AGENTS.override.md'}: must not be empty")
            elif not re.search(r"^@AGENTS\.md[ \t]*$", content, re.MULTILINE):
                errors.append(f"{scope / 'AGENTS.override.md'}: must include the shared @AGENTS.md import")
        if not alias.is_symlink() or os.readlink(alias) != "AGENTS.override.md":
            errors.append(f"{scope / 'CLAUDE.local.md'}: must be a relative symlink to AGENTS.override.md")
    return errors


def is_maintained_markdown(path: Path) -> bool:
    name = path.as_posix()
    return (
        path.suffix.lower() == ".md"
        and path.name not in LOCAL_INSTRUCTION_NAMES
        and path.name.upper() != "CHANGELOG.MD"
        and "/docs/sessions/" not in "/" + name
        and "/openwiki/" not in "/" + name
        and not name.startswith(EXCLUDED_TREES)
    )


def prose_only(text: str) -> str:
    """Ignore fenced examples and inline code when finding actual links."""
    lines = []
    fence = None
    for line in text.splitlines():
        match = re.match(r"^ {0,3}([\x60]{3,}|~{3,})(.*)$", line)
        if fence:
            if match and match[1][0] == fence[0] and len(match[1]) >= len(fence) and not match[2].strip():
                fence = None
            continue
        if match:
            fence = match[1]
            continue
        lines.append(line)
    return re.sub(r"([\x60]+).*?\1", "", "\n".join(lines))


def local_link_targets(text: str) -> list[str]:
    prose = prose_only(text)
    return [match[1] or match[2] for pattern in (INLINE_LINK, REFERENCE_LINK) for match in pattern.finditer(prose)]


def check_local_links(root: Path, paths: list[Path]) -> tuple[list[str], int, int]:
    errors = []
    checked_files = checked_links = 0
    root = root.resolve()
    for relative in paths:
        path = root / relative
        if not is_maintained_markdown(relative) or path.is_symlink():
            continue
        if not path.is_file():
            # Git may still report an intentionally deleted file before staging.
            continue
        checked_files += 1
        for target in local_link_targets(path.read_text(encoding="utf-8")):
            uri = urlsplit(target)
            if uri.scheme or uri.netloc or not uri.path or uri.path.startswith("/"):
                continue
            checked_links += 1
            destination = (path.parent / unquote(uri.path)).resolve()
            if not destination.is_relative_to(root):
                errors.append(f"{relative}: local link escapes the repository: {target}")
            elif not destination.exists():
                errors.append(f"{relative}: missing local link target: {target}")
    return errors, checked_files, checked_links


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repair-links", action="store_true", help="repair aliases without replacing real documents")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    try:
        files = repository_files(root)
        scopes = instruction_scopes(files)
        if not scopes:
            raise ValueError("No repository instruction files found")
        errors = repair_instruction_links(root, scopes) if args.repair_links else []
        if not errors:
            errors.extend(check_instruction_links(root, scopes))
        errors.extend(check_local_instruction_policy(root, files, scopes))
        errors.extend(check_local_instruction_links(root, scopes))
        link_errors, docs, links = check_local_links(root, files)
        errors.extend(link_errors)
    except (OSError, subprocess.CalledProcessError, ValueError) as exc:
        print(f"Documentation check failed: {exc}")
        return 1
    for error in errors:
        print(f"ERROR: {error}")
    print(f"Checked {len(scopes)} instruction scopes, {docs} maintained documents, {links} local links")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
