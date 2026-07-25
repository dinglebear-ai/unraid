#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { binaryPath } = require("../lib/platform");
function fail(message) { process.stderr.write(`unraid-rmcp: ${message}\n`); process.exit(1); }
const binary = binaryPath();
if (!fs.existsSync(binary)) {
  const installer = path.resolve(__dirname, "..", "scripts", "install.js");
  const install = spawnSync(process.execPath, [installer], { stdio: "inherit" });
  if (install.status !== 0) fail("binary is not installed; postinstall may have failed");
}
const child = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });
if (child.error) fail(child.error.message);
if (child.signal) process.kill(process.pid, child.signal);
else process.exit(child.status ?? 1);
