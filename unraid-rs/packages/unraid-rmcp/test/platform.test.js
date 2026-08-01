"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { binaryVersion, downloadUrl, releaseBaseUrl, releaseVersion, targetFor } = require("../lib/platform");
const { binaryVersion: pinnedBinaryVersion } = require("../package.json");
const { promoteExtractedBinary } = require("../scripts/install");
test("maps supported platforms to release assets", () => {
  assert.deepEqual(targetFor("linux", "x64"), { asset: "runraid-x86_64.tar.gz", archiveBinary: "runraid-linux-x86_64", binary: "runraid" });
});
test("rejects unsupported platforms", () => {
  assert.throws(() => targetFor("win32", "x64"), /Unsupported platform/);
  assert.throws(() => targetFor("darwin", "arm64"), /Unsupported platform/);
});
test("uses pinned binary version as the binary tag by default", () => {
  assert.equal(binaryVersion(), pinnedBinaryVersion);
  assert.equal(releaseVersion({}), `unraid-rs-v${pinnedBinaryVersion}`);
});
test("defaults to the monorepo's release download base", () => {
  assert.equal(releaseBaseUrl({}), "https://github.com/dinglebear-ai/unraid/releases/download");
});
test("normalises bare, v-prefixed, and already-prefixed release versions to the component tag", () => {
  assert.equal(releaseVersion({ UNRAID_RMCP_BINARY_VERSION: "9.9.9" }), "unraid-rs-v9.9.9");
  assert.equal(releaseVersion({ UNRAID_RMCP_BINARY_VERSION: "v9.9.9" }), "unraid-rs-v9.9.9");
  assert.equal(releaseVersion({ UNRAID_RMCP_BINARY_VERSION: "unraid-rs-v9.9.9" }), "unraid-rs-v9.9.9");
});
test("allows release tag and repo overrides", () => {
  const env = { UNRAID_RMCP_BINARY_VERSION: "v9.9.9", UNRAID_RMCP_REPO: "example/unraid-rmcp" };
  assert.equal(releaseBaseUrl(env), "https://github.com/example/unraid-rmcp/releases/download");
  assert.equal(downloadUrl(targetFor("linux", "x64"), env), "https://github.com/example/unraid-rmcp/releases/download/unraid-rs-v9.9.9/runraid-x86_64.tar.gz");
});

test("normalises the release archive binary name", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "unraid-rmcp-test-"));
  try {
    const target = targetFor("linux", "x64");
    const extracted = path.join(root, target.archiveBinary);
    const destination = path.join(root, target.binary);
    fs.writeFileSync(extracted, "binary");
    promoteExtractedBinary(target, destination, root);
    assert.equal(fs.existsSync(extracted), false);
    assert.equal(fs.readFileSync(destination, "utf8"), "binary");
    assert.equal(fs.statSync(destination).mode & 0o777, 0o755);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
