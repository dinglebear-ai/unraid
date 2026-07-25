#!/usr/bin/env node
"use strict";
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { binaryPath, downloadUrl, installRoot, releaseVersion, targetFor } = require("../lib/platform");
function log(message) { process.stderr.write(`unraid-rmcp: ${message}\n`); }
function download(url, destination) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("http:") ? http : https;
    const request = client.get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) { response.resume(); download(response.headers.location, destination).then(resolve, reject); return; }
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`download failed (${response.statusCode}) from ${url}`)); return; }
      const file = fs.createWriteStream(destination, { mode: 0o600 });
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    });
    request.on("error", reject);
  });
}
function sha256(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function checksumFromText(text, asset) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const hash = parts[0] && parts[0].toLowerCase();
    const name = parts.slice(1).join(" ").replace(/^\*/, "");
    if (/^[a-f0-9]{64}$/.test(hash) && (!asset || !name || path.basename(name) === asset)) {
      return hash;
    }
  }
  throw new Error("checksum file does not contain a SHA-256 entry for " + asset);
}

async function verifyChecksum(url, archive) {
  const asset = path.basename(archive);
  const sidecarFile = archive + ".sha256";
  let expected;

  try {
    await download(url + ".sha256", sidecarFile);
    expected = checksumFromText(fs.readFileSync(sidecarFile, "utf8"), asset);
  } catch (sidecarError) {
    const manifestUrl = url.replace(/\/[^/]+$/, "/SHA256SUMS");
    const manifestFile = archive + ".SHA256SUMS";
    await download(manifestUrl, manifestFile);
    expected = checksumFromText(fs.readFileSync(manifestFile, "utf8"), asset);
  }

  const actual = sha256(archive);
  if (actual !== expected) {
    throw new Error("checksum mismatch for " + asset + ": expected " + expected + ", got " + actual);
  }

  log("verified checksum for " + asset);
}

function extract(archive, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  const result = spawnSync("tar", ["-xzf", archive, "-C", destination], { encoding: "utf8" });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "tar extraction failed").trim());
}
async function main() {
  if (process.env.UNRAID_RMCP_SKIP_DOWNLOAD === "1") { log("skipping binary download because UNRAID_RMCP_SKIP_DOWNLOAD=1"); return; }
  const target = targetFor();
  const destination = binaryPath();
  if (fs.existsSync(destination)) { log(`${path.basename(destination)} already installed for ${releaseVersion()}`); return; }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "unraid-rmcp-install-"));
  const archive = path.join(tempDir, target.asset);
  try {
    const url = downloadUrl(target);
    log(`downloading ${url}`);
    await download(url, archive);
    await verifyChecksum(url, archive);
    extract(archive, installRoot());
    fs.chmodSync(destination, 0o755);
    log(`installed ${destination}`);
  } finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
}
main().catch((error) => { log(error.message); process.exitCode = 1; });
