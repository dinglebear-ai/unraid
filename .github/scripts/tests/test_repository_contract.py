"""The local contract adapter replaces one rule, not the fleet quality gate."""

import contextlib
import importlib.util
import io
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "check_repository_contract.py"
SPEC = importlib.util.spec_from_file_location("check_repository_contract", SCRIPT)
contract = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(contract)


class RepositoryContractTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.output = io.StringIO()

    def finding(self, name):
        return SimpleNamespace(check=name, render=lambda: f"{name}: retained finding")

    def invoke(self, findings, local_exit=0):
        fleet = SimpleNamespace(check=lambda repo, profile: findings)
        result = subprocess.CompletedProcess([], local_exit, "local validator ran\n", "")
        with patch.object(contract, "load_fleet", return_value=fleet), \
                patch.object(contract.subprocess, "run", return_value=result) as run, \
                contextlib.redirect_stdout(self.output):
            exit_code = contract.check(self.root, self.root / "fleet.py", "rust")
        command = run.call_args.args[0]
        self.assertEqual(command[1:], [str(self.root / ".github/scripts/check_documentation.py"), "--check-index"])
        self.assertEqual(run.call_args.kwargs["cwd"], self.root)
        return exit_code

    def test_only_obsolete_symlink_findings_are_replaced(self):
        self.assertEqual(self.invoke([self.finding("symlink-convention")]), 0)
        self.assertNotIn("retained finding", self.output.getvalue())

    def test_unrelated_and_unknown_findings_still_fail(self):
        for name in ("docs-frontmatter", "workspace-lints", "future-fleet-rule", "symlink-convention-extra"):
            with self.subTest(name=name):
                self.assertEqual(self.invoke([self.finding("symlink-convention"), self.finding(name)]), 1)
                self.assertIn(name, self.output.getvalue())

    def test_local_validation_is_mandatory_without_upstream_findings(self):
        self.assertEqual(self.invoke([], local_exit=1), 1)
        self.assertIn("validator exited 1", self.output.getvalue())

    def test_local_failure_cannot_be_hidden_by_obsolete_findings(self):
        self.assertEqual(self.invoke([self.finding("symlink-convention")], local_exit=2), 1)

    def test_local_validator_exception_is_a_failure(self):
        fleet = SimpleNamespace(check=lambda repo, profile: [])
        with patch.object(contract, "load_fleet", return_value=fleet), \
                patch.object(contract.subprocess, "run", side_effect=OSError("missing checker")), \
                contextlib.redirect_stderr(self.output):
            self.assertEqual(contract.main(["--repo", str(self.root), "--fleet-script", "unused.py"]), 1)

    def test_missing_or_invalid_upstream_is_a_failure(self):
        invalid = self.root / "invalid.py"
        invalid.write_text("unrelated = True\n")
        for script in (self.root / "missing.py", invalid):
            with self.subTest(script=script), contextlib.redirect_stderr(self.output):
                self.assertEqual(contract.main(["--repo", str(self.root), "--fleet-script", str(script)]), 1)

    def test_loader_supports_upstream_dataclasses(self):
        script = self.root / "fleet.py"
        script.write_text("from __future__ import annotations\nfrom dataclasses import dataclass\n"
                          "@dataclass(frozen=True)\nclass Finding:\n    check: str\n"
                          "def check(repo, profile):\n    return [Finding('kept')]\n")
        module = contract.load_fleet(script)
        self.assertEqual(module.check(self.root, "rust")[0].check, "kept")


if __name__ == "__main__":
    unittest.main()
