#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const packageReadme = path.resolve(__dirname, "..", "README.md");
const repoReadme = path.resolve(__dirname, "..", "..", "..", "README.md");
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(__dirname, "..", "..", "..");

if (fs.existsSync(packageReadme) && fs.lstatSync(packageReadme).isSymbolicLink()) {
  fs.unlinkSync(packageReadme);
}

fs.copyFileSync(repoReadme, packageReadme);

for (const entry of fs.readdirSync(repoRoot)) {
  const source = path.join(repoRoot, entry);
  if (/^licen[cs]e/i.test(entry) && fs.statSync(source).isFile()) {
    const destination = path.join(packageRoot, entry);
    if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) {
      fs.unlinkSync(destination);
    }
    fs.copyFileSync(source, destination);
  }
}
