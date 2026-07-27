"use strict";

const path = require("node:path");

function packageVersion() {
  return require("../package.json").version;
}

function binaryVersion() {
  return require("../package.json").binaryVersion || packageVersion();
}

function targetFor(platform = process.platform, arch = process.arch) {
  if (platform === "linux" && arch === "x64") {
    return { asset: "runraid-x86_64.tar.gz", binary: "runraid" };
  }
  throw new Error(`Unsupported platform ${platform}/${arch}. Supported target: linux/x64.`);
}

// Release tags in the unraid-mcp monorepo are component-prefixed: the Rust
// server publishes `unraid-rs-v<semver>` (see .github/workflows/rust-release.yml),
// while bare `v<semver>` tags belong to the Python server. Accept a bare or
// v-prefixed version for backwards compatibility and normalise to the tag the
// monorepo actually creates.
const RELEASE_TAG_PREFIX = "unraid-rs-v";

function releaseVersion(env = process.env) {
  const raw = env.UNRAID_RMCP_BINARY_VERSION || env.UNRAID_RMCP_VERSION || binaryVersion();
  if (raw.startsWith(RELEASE_TAG_PREFIX)) return raw;
  return `${RELEASE_TAG_PREFIX}${raw.startsWith("v") ? raw.slice(1) : raw}`;
}

function releaseBaseUrl(env = process.env) {
  const repo = env.UNRAID_RMCP_REPO || "dinglebear-ai/unraid-mcp";
  return env.UNRAID_RMCP_RELEASE_BASE_URL || `https://github.com/${repo}/releases/download`;
}

function downloadUrl(target, env = process.env) {
  return `${releaseBaseUrl(env)}/${releaseVersion(env)}/${target.asset}`;
}

function installRoot() {
  return path.resolve(__dirname, "..", "vendor");
}

function binaryPath(platform = process.platform, arch = process.arch) {
  const target = targetFor(platform, arch);
  return path.join(installRoot(), target.binary);
}

module.exports = { binaryPath, binaryVersion, downloadUrl, releaseBaseUrl, installRoot, packageVersion, releaseVersion, targetFor };
