from __future__ import annotations

import copy
import hashlib
import sys
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import verify_plugin_release as monitor

REPO = "dinglebear-ai/unraid"
TAG = "unraid-rs-v0.6.3"
VERSION = "3.000.006.003"
NAME = f"unraid-mcp-{VERSION}-x86_64-2.txz"
URL = f"https://github.com/{REPO}/releases/download/{TAG}/{NAME}"
PAYLOAD = b"fixture Rust plugin package"


def manifest() -> bytes:
    template = (monitor.ROOT / "plugins/mcp/unraid-mcp.plg").read_text()
    for key, value in {
        "RUST_VERSION_PLACEHOLDER": "0.6.3",
        "VERSION_PLACEHOLDER": VERSION,
        "SHA256_PLACEHOLDER": hashlib.sha256(PAYLOAD).hexdigest(),
        "MD5_PLACEHOLDER": "0" * 32,
    }.items():
        template = template.replace(key, value)
    return template.encode()


class PluginReleaseTests(unittest.TestCase):
    def setUp(self):
        self.bridge = manifest()
        self.releases = {
            "latest": {
                "tag_name": "v2.10.3",
                "assets": [{"name": "unraid-mcp.plg", "url": "bridge"}],
            },
            "tags/unraid-plugin-latest": {
                "tag_name": "unraid-plugin-latest",
                "assets": [{"name": "unraid-mcp.plg", "url": "rolling"}],
            },
            f"tags/{TAG}": {
                "tag_name": TAG,
                "draft": False,
                "prerelease": False,
                "assets": [
                    {"name": NAME, "url": "package", "browser_download_url": URL}
                ],
            },
        }
        self.downloads = {
            "bridge": self.bridge,
            "rolling": self.bridge,
            "package": PAYLOAD,
        }
        self.release_mock = mock.patch.object(
            monitor,
            "release",
            side_effect=lambda repo, tag: copy.deepcopy(self.releases[tag]),
        )
        self.download_mock = mock.patch.object(
            monitor, "download", side_effect=lambda item: self.downloads[item["url"]]
        )
        self.release_mock.start()
        self.download_mock.start()
        self.addCleanup(mock.patch.stopall)

    def test_migrated_bridge_needs_no_txz_on_python_release(self):
        monitor.verify(REPO)

    def test_non_primary_latest_is_rejected(self):
        self.releases["latest"]["tag_name"] = TAG
        with self.assertRaisesRegex(ValueError, "not a primary"):
            monitor.verify(REPO)

    def test_missing_bridge_is_rejected(self):
        self.releases["latest"]["assets"] = []
        with self.assertRaisesRegex(ValueError, "expected one asset"):
            monitor.verify(REPO)

    def test_missing_rolling_manifest_is_rejected(self):
        self.releases["tags/unraid-plugin-latest"]["assets"] = []
        with self.assertRaisesRegex(ValueError, "expected one asset"):
            monitor.verify(REPO)

    def test_bridge_drift_is_rejected(self):
        self.downloads["rolling"] += b"\n"
        with self.assertRaisesRegex(ValueError, "manifests differ"):
            monitor.verify(REPO)

    def test_missing_rust_package_is_rejected(self):
        self.releases[f"tags/{TAG}"]["assets"] = []
        with self.assertRaisesRegex(ValueError, "expected one asset"):
            monitor.verify(REPO)

    def test_wrong_asset_url_is_rejected(self):
        self.releases[f"tags/{TAG}"]["assets"][0]["browser_download_url"] += "-wrong"
        with self.assertRaisesRegex(ValueError, "declared package URL"):
            monitor.verify(REPO)

    def test_corrupt_package_is_rejected(self):
        self.downloads["package"] += b"corruption"
        with self.assertRaisesRegex(ValueError, "SHA256 mismatch"):
            monitor.verify(REPO)

    def test_unpublished_rust_release_is_rejected(self):
        for field in ("draft", "prerelease"):
            with self.subTest(field=field):
                self.releases[f"tags/{TAG}"][field] = True
                with self.assertRaisesRegex(ValueError, "published stable"):
                    monitor.verify(REPO)
                self.releases[f"tags/{TAG}"][field] = False

    def test_manifest_contract_failures(self):
        cases = [
            (self.bridge.replace(VERSION.encode(), b"3.000.006.002"), "must map"),
            (self.bridge.replace(b"x86_64-2.txz", b"x86_64-1.txz"), "filename"),
            (self.bridge.replace(f"{TAG}/".encode(), b"v2.10.3/"), "versioned Rust"),
            (self.bridge.replace(REPO.encode(), b"other/repository"), "versioned Rust"),
            (
                self.bridge.replace(
                    hashlib.sha256(PAYLOAD).hexdigest().encode(), b"invalid"
                ),
                "SHA256",
            ),
            (
                self.bridge.replace(VERSION.encode(), b"VERSION_PLACEHOLDER"),
                "placeholders",
            ),
        ]
        for data, error in cases:
            with self.subTest(error=error), self.assertRaisesRegex(ValueError, error):
                monitor.package_reference(data, REPO)

    def test_xml_must_be_well_formed(self):
        with self.assertRaises(monitor.ET.ParseError):
            monitor.package_reference(self.bridge.replace(b"</PLUGIN>", b""), REPO)

    def test_download_errors_fail_the_monitor(self):
        with (
            mock.patch.object(
                monitor,
                "verify",
                side_effect=monitor.subprocess.CalledProcessError(1, "gh"),
            ),
            mock.patch.dict(monitor.os.environ, GITHUB_REPOSITORY=REPO),
        ):
            self.assertEqual(monitor.main(), 1)

    def test_python_liveness_runs_after_plugin_failure(self):
        workflow = (monitor.ROOT / ".github/workflows/release-liveness.yml").read_text()
        plugin, python = workflow.split(
            "      - name: Detect stale release automation\n"
        )
        self.assertIn("python3 .github/scripts/verify_plugin_release.py", plugin)
        self.assertNotIn("continue-on-error", plugin)
        self.assertIn("        if: ${{ !cancelled() }}\n", python)


if __name__ == "__main__":
    unittest.main()
