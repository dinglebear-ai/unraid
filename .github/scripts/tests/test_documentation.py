"""Regression tests for canonical instructions and offline Markdown validation."""

import importlib.util
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "check_documentation.py"
SPEC = importlib.util.spec_from_file_location("check_documentation", SCRIPT)
docs = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(docs)


class DocumentationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)

    def write(self, name, content="# Test\n"):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def triplet(self, scope="."):
        self.write(str(Path(scope) / "AGENTS.md"))
        for name in docs.ALIASES:
            (self.root / scope / name).symlink_to("AGENTS.md")

    def test_correct_nested_instruction_triplets(self):
        self.triplet()
        self.triplet("component/docs")
        self.assertEqual(docs.check_instruction_links(self.root, [Path("."), Path("component/docs")]), [])

    def test_legacy_direction_is_rejected_without_mutation(self):
        self.write("CLAUDE.md", "Keep this content")
        (self.root / "AGENTS.md").symlink_to("CLAUDE.md")
        (self.root / "GEMINI.md").symlink_to("CLAUDE.md")
        self.assertTrue(docs.repair_instruction_links(self.root, [Path(".")]))
        self.assertEqual((self.root / "CLAUDE.md").read_text(), "Keep this content")
        self.assertEqual(os.readlink(self.root / "AGENTS.md"), "CLAUDE.md")

    def test_regular_alias_prevents_all_repairs(self):
        self.write("AGENTS.md")
        self.write("CLAUDE.md", "Independent instructions")
        self.assertTrue(docs.repair_instruction_links(self.root, [Path(".")]))
        self.assertFalse(os.path.lexists(self.root / "GEMINI.md"))
        self.assertEqual((self.root / "CLAUDE.md").read_text(), "Independent instructions")

    def test_repairs_wrong_and_missing_aliases_idempotently(self):
        self.write("AGENTS.md", "Canonical bytes\n")
        (self.root / "CLAUDE.md").symlink_to("missing.md")
        for _ in range(2):
            self.assertEqual(docs.repair_instruction_links(self.root, [Path(".")]), [])
            self.assertEqual(docs.check_instruction_links(self.root, [Path(".")]), [])
        self.assertEqual((self.root / "AGENTS.md").read_bytes(), b"Canonical bytes\n")

    def test_absolute_alias_and_empty_canonical_are_rejected(self):
        self.triplet()
        (self.root / "CLAUDE.md").unlink()
        (self.root / "CLAUDE.md").symlink_to(self.root / "AGENTS.md")
        self.write("AGENTS.md", " \n")
        self.assertEqual(len(docs.check_instruction_links(self.root, [Path(".")])), 2)

    def test_missing_canonical_is_rejected(self):
        (self.root / "CLAUDE.md").symlink_to("AGENTS.md")
        self.assertTrue(docs.check_instruction_links(self.root, [Path(".")]))

    def local_pair(self, scope="."):
        canonical = self.write(str(Path(scope) / "AGENTS.override.md"),
                               "Read and follow the shared AGENTS.md first.\n\n@AGENTS.md\n")
        (self.root / scope / "CLAUDE.local.md").symlink_to("AGENTS.override.md")
        return canonical

    def initialize_git(self, ignore_names=True):
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "core.excludesFile", os.devnull], check=True)
        if ignore_names:
            self.write(".gitignore", "\n".join(sorted(docs.LOCAL_INSTRUCTION_NAMES)) + "\n")

    def test_local_instruction_pairs_are_optional(self):
        self.assertEqual(docs.check_local_instruction_links(self.root, [Path(".")]), [])

    def test_local_pairs_share_canonical_content_at_each_scope(self):
        for scope in (".", "component"):
            self.triplet(scope)
            canonical = self.local_pair(scope)
            canonical.write_text(canonical.read_text() + "Private workflow preference.\n")
            self.assertEqual((self.root / scope / "CLAUDE.local.md").read_bytes(), canonical.read_bytes())
        self.assertEqual(docs.check_local_instruction_links(self.root, [Path("."), Path("component")]), [])

    def test_local_override_requires_shared_import_and_nonempty_content(self):
        canonical = self.local_pair()
        for content in ("", "Local notes without shared instructions.\n"):
            with self.subTest(content=content):
                canonical.write_text(content)
                self.assertTrue(docs.check_local_instruction_links(self.root, [Path(".")]))

    def test_local_alias_must_be_relative_and_not_a_copy(self):
        canonical = self.local_pair()
        alias = self.root / "CLAUDE.local.md"
        alias.unlink()
        alias.symlink_to(canonical)
        self.assertTrue(docs.check_local_instruction_links(self.root, [Path(".")]))
        alias.unlink()
        self.write("CLAUDE.local.md", "Preserve this independent local content.")
        self.assertTrue(docs.check_local_instruction_links(self.root, [Path(".")]))
        self.assertEqual(alias.read_text(), "Preserve this independent local content.")

    def test_local_canonical_must_not_be_an_alias(self):
        self.write("CLAUDE.local.md", "Preserve this content.")
        (self.root / "AGENTS.override.md").symlink_to("CLAUDE.local.md")
        self.assertTrue(docs.check_local_instruction_links(self.root, [Path(".")]))
        self.assertEqual((self.root / "CLAUDE.local.md").read_text(), "Preserve this content.")

    def test_dangling_local_alias_and_legacy_filename_are_rejected(self):
        (self.root / "CLAUDE.local.md").symlink_to("AGENTS.override.md")
        self.assertTrue(docs.check_local_instruction_links(self.root, [Path(".")]))
        (self.root / "CLAUDE.local.md").unlink()
        self.write("CLAUDE.md.local", "Migrate this file.")
        self.assertTrue(docs.check_local_instruction_links(self.root, [Path(".")]))

    def test_ignore_policy_applies_in_clean_clones_and_nested_scopes(self):
        self.initialize_git()
        self.assertEqual(docs.check_local_instruction_policy(self.root, docs.repository_files(self.root),
                                                           [Path("."), Path("component")]), [])
        self.local_pair()
        self.assertEqual(docs.check_local_instruction_policy(self.root, docs.repository_files(self.root),
                                                           [Path(".")]), [])

    def test_missing_and_root_only_ignore_rules_fail(self):
        self.initialize_git(ignore_names=False)
        self.assertEqual(len(docs.check_local_instruction_policy(self.root, [], [Path(".")])), 3)
        self.write(".gitignore", "\n".join("/" + name for name in sorted(docs.LOCAL_INSTRUCTION_NAMES)) + "\n")
        self.assertEqual(len(docs.check_local_instruction_policy(self.root, [],
                                                               [Path("."), Path("component")])), 3)

    def test_force_added_private_instructions_are_rejected_without_content_in_errors(self):
        self.initialize_git()
        self.write("component/AGENTS.override.md", "PRIVATE_SENTINEL_DO_NOT_PRINT")
        subprocess.run(["git", "-C", str(self.root), "add", "-f", "component/AGENTS.override.md"], check=True)
        errors = docs.check_local_instruction_policy(self.root, docs.repository_files(self.root), [Path(".")])
        self.assertEqual(len(errors), 1)
        self.assertIn("must remain untracked", errors[0])
        self.assertNotIn("PRIVATE_SENTINEL", errors[0])

    def test_local_instruction_contents_are_excluded_from_markdown_validation(self):
        for name in docs.LOCAL_INSTRUCTION_NAMES:
            self.write(name, "[private](do-not-include-this-in-diagnostics)")
            self.assertFalse(docs.is_maintained_markdown(Path(name)))
            self.assertEqual(docs.check_local_links(self.root, [Path(name)]), ([], 0, 0))

    def test_relative_encoded_and_reference_links(self):
        self.write("docs/with spaces.md")
        self.write("README.md", "[A](docs/with%20spaces.md#heading)\n[B][ref]\n[ref]: <docs/with spaces.md>\n")
        errors, files, links = docs.check_local_links(self.root, [Path("README.md")])
        self.assertEqual((errors, files, links), ([], 1, 2))

    def test_missing_and_escaping_links_fail(self):
        self.write("README.md", "[missing](missing.md)\n[escape](../outside.md)\n![image](missing.png)")
        errors, _, links = docs.check_local_links(self.root, [Path("README.md")])
        self.assertEqual((len(errors), links), (3, 3))

    def test_examples_external_links_and_anchors_are_ignored(self):
        tick = chr(96)
        fence = tick * 3
        text = f"{fence}md\n[example](missing.md)\n{fence}\n{tick}[code](absent.md){tick}\n"
        text += "~~~\n[other](no.md)\n~~~\n[web](https://example.com)\n[anchor](#title)\n[root](/route)"
        self.write("README.md", text)
        self.assertEqual(docs.check_local_links(self.root, [Path("README.md")]), ([], 1, 0))

    def test_history_and_generated_snapshots_are_excluded(self):
        for name in ("docs/sessions/old.md", "unraid-rs/CHANGELOG.md", "plugins/incus/docs/unraid/API.md", "unraid-py/docs/unraid/schema.md", "unraid-py/docs/review/evidence.md"):
            with self.subTest(name=name):
                self.assertFalse(docs.is_maintained_markdown(Path(name)))
        self.assertTrue(docs.is_maintained_markdown(Path("unraid-rs/docs/stack/ARCH.md")))

    def test_git_discovery_includes_new_files_but_not_ignored_files(self):
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        self.write(".gitignore", "cache/\n")
        self.write("README.md")
        self.write("cache/AGENTS.md")
        self.assertIn(Path("README.md"), docs.repository_files(self.root))
        self.assertNotIn(Path("cache/AGENTS.md"), docs.repository_files(self.root))

    def test_ci_covers_markdown_and_runs_checker(self):
        workflow = SCRIPT.parents[1] / "workflows/meta-ci.yml"
        content = workflow.read_text()
        self.assertIn('"**/*.md"', content)
        self.assertIn("python3 .github/scripts/check_documentation.py", content)

    def test_xtask_delegates_to_shared_safe_helper(self):
        source = SCRIPT.parents[2] / "unraid-rs/xtask/src/main.rs"
        content = source.read_text()
        self.assertIn("check_documentation.py", content)
        self.assertIn('"--repair-links"', content)
        self.assertNotIn('symlink("CLAUDE.md"', content)


if __name__ == "__main__":
    unittest.main()
