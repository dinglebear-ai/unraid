from __future__ import annotations

import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import ensure_primary_latest  # noqa: E402
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
                "<!-- x-release-please-version -->\n",
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


class PrimaryLatestTests(unittest.TestCase):
    def test_selects_highest_numeric_primary_semver(self):
        selected = ensure_primary_latest.select_primary_release(
            [
                {
                    "id": 1,
                    "tag_name": "unraid-rs-v9.0.0",
                    "draft": False,
                    "prerelease": False,
                },
                {
                    "id": 2,
                    "tag_name": "v2.9.9",
                    "draft": False,
                    "prerelease": False,
                },
                {
                    "id": 3,
                    "tag_name": "v2.10.1",
                    "draft": False,
                    "prerelease": False,
                },
                {
                    "id": 4,
                    "tag_name": "v9.0.0",
                    "draft": True,
                    "prerelease": False,
                },
                {
                    "id": 5,
                    "tag_name": "v3.0.0",
                    "draft": False,
                    "prerelease": True,
                },
            ]
        )
        self.assertEqual(selected["id"], 3)
        self.assertEqual(selected["tag_name"], "v2.10.1")

    def test_rejects_missing_primary_release(self):
        with self.assertRaisesRegex(
            ensure_primary_latest.LatestReleaseError,
            "no published primary",
        ):
            ensure_primary_latest.select_primary_release(
                [
                    {
                        "id": 1,
                        "tag_name": "codex-v20260805.001",
                        "draft": False,
                        "prerelease": False,
                    }
                ]
            )

    def test_promotes_primary_before_demoting_component(self):
        primary = {
            "id": 20,
            "tag_name": "v2.10.1",
            "draft": False,
            "prerelease": False,
        }
        with (
            mock.patch.object(
                ensure_primary_latest,
                "gh_json",
                side_effect=[{"id": 10}, {"tag_name": "v2.10.1"}],
            ),
            mock.patch.object(
                ensure_primary_latest,
                "list_releases",
                return_value=[primary],
            ),
            mock.patch.object(
                ensure_primary_latest,
                "patch_make_latest",
            ) as patch_latest,
            mock.patch.object(ensure_primary_latest, "write_github_output"),
            mock.patch("builtins.print"),
        ):
            selected = ensure_primary_latest.restore_primary_latest(
                "dinglebear-ai/unraid",
                "codex-v20260805.001",
                delay_seconds=0,
            )

        self.assertEqual(selected, primary)
        self.assertEqual(
            patch_latest.call_args_list,
            [
                mock.call("dinglebear-ai/unraid", 20, True),
                mock.call("dinglebear-ai/unraid", 10, False),
            ],
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
                "[package]\n"
                'name = "unraid-rmcp"\n'
                'version = "0.3.0"\n'
                "[dependencies]\n"
                'lab-auth = { version = "0.3.0", path = "crates/lab-auth" }\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/crates/lab-auth/Cargo.toml").write_text(
                '[package]\nname = "lab-auth"\nversion = "0.3.0"\nlicense = "MIT"\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/Cargo.lock").write_text(
                'version = 4\n\n[[package]]\nname = "lab-auth"\nversion = "0.3.0"\n',
                encoding="utf-8",
            )
            (root / "unraid-rs/server.json").write_text(
                json.dumps(
                    {
                        "_meta": {
                            "io.modelcontextprotocol.registry/publisher-provided": {
                                "distribution": {"npm": "@dinglebear/unraid@0.2.5"}
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
                server["_meta"]["io.modelcontextprotocol.registry/publisher-provided"][
                    "distribution"
                ]["npm"],
                "@dinglebear/unraid@0.3.0",
            )
            self.assertEqual(release_pr_fixup.apply(root), [])


if __name__ == "__main__":
    unittest.main()
