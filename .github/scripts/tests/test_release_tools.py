from __future__ import annotations

import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import plugin_calver  # noqa: E402
import release_contract  # noqa: E402
import release_pr_fixup  # noqa: E402


class PluginCalverTests(unittest.TestCase):
    def test_migrates_legacy_version_to_fixed_width_calver(self):
        version = plugin_calver.next_version(
            dt.date(2026, 7, 26),
            "2026.7.24",
            ["2026.7.24"],
        )
        self.assertEqual(version, "20260726.001")
        self.assertGreater(version, "2026.7.24")

    def test_sequence_increments_for_same_day(self):
        version = plugin_calver.next_version(
            dt.date(2026, 7, 26),
            "20260726.002",
            ["20260726.001", "20260726.002"],
        )
        self.assertEqual(version, "20260726.003")

    def test_rejects_calendar_regression(self):
        with self.assertRaisesRegex(ValueError, "predates"):
            plugin_calver.next_version(
                dt.date(2026, 7, 25),
                "20260726.001",
                ["20260726.001"],
            )

    def test_updates_only_the_version_entity(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "plugin.plg"
            path.write_text(
                '<!ENTITY name "demo">\n'
                '<!ENTITY version "2026.7.24"> '
                '<!-- x-release-please-version -->\n',
                encoding="utf-8",
            )
            plugin_calver.update_plugin_version(path, "20260726.001")
            updated = path.read_text(encoding="utf-8")
            self.assertIn('<!ENTITY name "demo">', updated)
            self.assertIn('<!ENTITY version "20260726.001">', updated)
            self.assertIn("managed by .github/scripts/plugin_calver.py", updated)
            self.assertNotIn("x-release-please-version", updated)


class ReleaseContractTests(unittest.TestCase):
    def test_semver_ordering_is_numeric(self):
        self.assertGreater(
            release_contract.semver_key("2.10.0"),
            release_contract.semver_key("2.9.9"),
        )

    def test_expected_release_units_are_stable(self):
        self.assertEqual(
            release_contract.RELEASE_PLEASE_PACKAGES,
            {"unraid-py", "unraid-rs"},
        )
        self.assertEqual(set(plugin_calver.COMPONENTS), {"incus", "codex"})

    def test_legacy_version_is_recognized_as_calendar_date(self):
        self.assertEqual(
            plugin_calver.calendar_date("2026.7.24"),
            dt.date(2026, 7, 24),
        )


class ReleasePrFixupTests(unittest.TestCase):
    def test_restores_compatibility_crate_and_npm_distribution(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "unraid-rs/crates/lab-auth").mkdir(parents=True)
            (root / ".release-please-manifest.json").write_text(
                '{"unraid-rs": "0.3.0"}\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/Cargo.toml").write_text(
                '[package]\n'
                'name = "unraid-rmcp"\n'
                'version = "0.3.0"\n'
                '[dependencies]\n'
                'lab-auth = { version = "0.3.0", path = "crates/lab-auth" }\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/crates/lab-auth/Cargo.toml").write_text(
                '[package]\n'
                'name = "lab-auth"\n'
                'version = "0.3.0"\n'
                'license = "MIT"\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/Cargo.lock").write_text(
                'version = 4\n\n'
                '[[package]]\n'
                'name = "lab-auth"\n'
                'version = "0.3.0"\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/server.json").write_text(
                json.dumps(
                    {
                        "_meta": {
                            "io.modelcontextprotocol.registry/publisher-provided": {
                                "distribution": {
                                    "npm": "@dinglebear/unraid@0.2.5"
                                }
                            }
                        }
                    }
                ),
                encoding="utf-8",
            )

            changed = release_pr_fixup.apply(root)
            self.assertEqual(
                {path.relative_to(root).as_posix() for path in changed},
                {
                    "unraid-rs/Cargo.toml",
                    "unraid-rs/Cargo.lock",
                    "unraid-rs/crates/lab-auth/Cargo.toml",
                    "unraid-rs/server.json",
                },
            )
            self.assertIn(
                'version = "=0.15.0"',
                (root / "unraid-rs/Cargo.toml").read_text(),
            )
            self.assertIn(
                'version = "0.15.0"',
                (root / "unraid-rs/crates/lab-auth/Cargo.toml").read_text(),
            )
            self.assertIn(
                'version = "0.15.0"',
                (root / "unraid-rs/Cargo.lock").read_text(),
            )
            server = json.loads((root / "unraid-rs/server.json").read_text())
            self.assertEqual(
                server["_meta"][
                    "io.modelcontextprotocol.registry/publisher-provided"
                ]["distribution"]["npm"],
                "@dinglebear/unraid@0.3.0",
            )
            self.assertEqual(release_pr_fixup.apply(root), [])


if __name__ == "__main__":
    unittest.main()
