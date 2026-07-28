#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");
// Canonical home of this package after the monorepo consolidation.
const CANONICAL_REPO = "dinglebear-ai/unraid";
const packageJsonPath = path.join(packageRoot, "package.json");
const packageJson = readJson(packageJsonPath);
const releaseMode = process.argv.includes("--release");
const skipReleaseAssets = process.argv.includes("--skip-release-assets");

const failures = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function normalizeRepoUrl(url) {
  return String(url || "")
    .replace(/^git\+/, "")
    .replace(/#readme$/, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function normalizeHomepage(url) {
  return String(url || "").replace(/#readme$/, "").replace(/\/$/, "");
}

function repoLicenseFiles() {
  return fs
    .readdirSync(repoRoot)
    .filter((entry) => /^licen[cs]e/i.test(entry))
    .filter((entry) => fs.statSync(path.join(repoRoot, entry)).isFile())
    .sort();
}

function compareFiles(left, right) {
  if (!fs.existsSync(left) || !fs.existsSync(right)) {
    return false;
  }

  return fs.readFileSync(left).equals(fs.readFileSync(right));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || packageRoot,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `${command} ${args.join(" ")} failed`).trim();
    throw new Error(detail);
  }

  return result;
}

function checkSyncedFiles() {
  assert(
    compareFiles(path.join(repoRoot, "README.md"), path.join(packageRoot, "README.md")),
    "package README.md must be byte-identical to the repo README.md; run npm pack or scripts/sync-readme.js",
  );

  const licenses = repoLicenseFiles();
  assert(licenses.length > 0, "repo must have at least one LICENSE file to sync into the npm package");

  for (const license of licenses) {
    assert(
      compareFiles(path.join(repoRoot, license), path.join(packageRoot, license)),
      `package ${license} must be byte-identical to repo ${license}; run npm pack or scripts/sync-readme.js`,
    );
  }
}

function findNpmPackage(serverJson) {
  return (serverJson.packages || []).find(
    (entry) => entry.registryType === "npm" || entry.identifier === packageJson.name,
  );
}

function checkMetadata() {
  const serverPath = path.join(repoRoot, "server.json");
  assert(fs.existsSync(serverPath), "repo must contain server.json for package metadata checks");

  if (!fs.existsSync(serverPath)) {
    return;
  }

  const serverJson = readJson(serverPath);
  const npmPackage = findNpmPackage(serverJson);
  const repoUrl = normalizeRepoUrl(packageJson.repository && packageJson.repository.url);
  const serverRepoUrl = normalizeRepoUrl(serverJson.repository && serverJson.repository.url);
  const homepage = normalizeHomepage(packageJson.homepage);
  const serverWebsite = normalizeHomepage(serverJson.websiteUrl);

  assert(packageJson.name, "package.json must include name");
  assert(packageJson.version, "package.json must include version");
  assert(packageJson.description, "package.json must include description");
  assert(packageJson.license, "package.json must include license");
  assert(packageJson.author && packageJson.author.name === "dinglebear.ai", "package.json author must be dinglebear.ai");
  assert(packageJson.engines && packageJson.engines.node, "package.json must declare engines.node");
  assert(packageJson.repository && packageJson.repository.type === "git", "package.json repository.type must be git");
  assert(packageJson.repository && packageJson.repository.directory, "package.json repository.directory must point at this package");
  assert(packageJson.repository && packageJson.repository.directory === path.relative(repoRoot, packageRoot), "package.json repository.directory must match package path");
  assert(packageJson.bugs && packageJson.bugs.url, "package.json must include bugs.url");
  assert(packageJson.mcpName === serverJson.name, "package.json mcpName must match server.json name");
  assert(repoUrl === serverRepoUrl, `package repository ${repoUrl} must match server.json repository ${serverRepoUrl}`);
  assert(homepage === serverWebsite, `package homepage ${homepage} must match server.json websiteUrl ${serverWebsite}`);
  // Anchor the URLs to the canonical monorepo. Asserting only that package.json
  // and server.json agree with EACH OTHER let both drift to the pre-consolidation
  // repo (jmagar/runraid) while CI stayed green.
  for (const [label, value] of [["package repository", repoUrl], ["server.json repository", serverRepoUrl], ["package homepage", homepage], ["server.json websiteUrl", serverWebsite]]) {
    assert(
      typeof value === "string" && value.includes(`/${CANONICAL_REPO}`),
      `${label} must point at ${CANONICAL_REPO} (got ${value})`,
    );
  }
  assert(serverJson.version === packageJson.version, `package version ${packageJson.version} must match server.json version ${serverJson.version}`);

  if (npmPackage) {
    assert(npmPackage.identifier === packageJson.name, "server.json npm package identifier must match package name");
    assert(npmPackage.version === packageJson.version, "server.json npm package version must match package version");
  } else {
    fail("server.json must include an npm package entry");
  }

  const publisherMeta = serverJson._meta && serverJson._meta["io.modelcontextprotocol.registry/publisher-provided"];
  const distribution = publisherMeta && publisherMeta.distribution;
  if (distribution) {
    if (distribution.npm) {
      assert(
        distribution.npm === `${packageJson.name}@${packageJson.version}`,
        `server.json distribution.npm must be ${packageJson.name}@${packageJson.version}`,
      );
    }
    if (distribution.nodePackage) {
      assert(distribution.nodePackage === packageJson.name, "server.json distribution.nodePackage must match package name");
    }
  }

  for (const keyword of ["mcp", "mcp-server", "model-context-protocol"]) {
    assert(Array.isArray(packageJson.keywords) && packageJson.keywords.includes(keyword), `package keywords must include ${keyword}`);
  }

  for (const field of ["bin/", "scripts/", "README.md", "LICENSE*", "package.json"]) {
    assert(Array.isArray(packageJson.files) && packageJson.files.includes(field), `package files must include ${field}`);
  }

  assert(packageJson.scripts && packageJson.scripts.prepack === "node scripts/sync-readme.js", "package prepack must sync README/LICENSE files");
  assert(packageJson.scripts && packageJson.scripts.prepublishOnly === "node scripts/check-package.js --release", "package prepublishOnly must run the release gate");
  assert(packageJson.scripts && packageJson.scripts.check && packageJson.scripts.check.includes("node scripts/check-package.js"), "package check must run the package verifier");
}

function assertRuntimeScriptsDoNotEscapePackage() {
  const runtimeScripts = [packageJson.scripts && packageJson.scripts.postinstall].filter(Boolean);
  for (const script of runtimeScripts) {
    assert(!script.includes("../"), `runtime npm script must not reference files outside the package: ${script}`);
  }

  const runtimeFiles = [];
  if (packageJson.bin) {
    for (const relative of Object.values(packageJson.bin)) {
      runtimeFiles.push(relative);
    }
  }
  for (const relative of ["scripts/install.js", "lib/platform.js"]) {
    const absolute = path.join(packageRoot, relative);
    if (fs.existsSync(absolute)) {
      runtimeFiles.push(relative);
    }
  }

  for (const relative of new Set(runtimeFiles)) {
    const text = fs.readFileSync(path.join(packageRoot, relative), "utf8");
    assert(!text.includes('"..", ".."'), `${relative} must not resolve paths outside the package at runtime`);
    assert(!text.includes("'..', '..'"), `${relative} must not resolve paths outside the package at runtime`);
  }

  const installer = path.join(packageRoot, "scripts", "install.js");
  if (fs.existsSync(installer)) {
    const text = fs.readFileSync(installer, "utf8");
    assert(text.includes("verifyChecksum"), "postinstall downloader must verify release checksums");
    assert(text.includes("sha256"), "postinstall downloader must validate SHA-256 checksums");
  }
}

function packTarball(tempDir) {
  run("npm", ["pack", packageRoot, "--pack-destination", tempDir], { cwd: packageRoot });
  const tarballs = fs.readdirSync(tempDir).filter((entry) => entry.endsWith(".tgz"));
  assert(tarballs.length === 1, "npm pack must produce exactly one tarball");
  return path.join(tempDir, tarballs[0]);
}

function tarList(tarball) {
  return run("tar", ["-tzf", tarball]).stdout.trim().split(/\n+/).filter(Boolean);
}

function tarExtract(tarball, entry) {
  return run("tar", ["-xOzf", tarball, entry]).stdout;
}

function checkPacklist(tarball) {
  const entries = tarList(tarball);
  const allowedPrefixes = ["package/bin/", "package/lib/", "package/scripts/"];
  const allowedExact = new Set(["package/package.json", "package/README.md"]);

  for (const license of repoLicenseFiles()) {
    allowedExact.add(`package/${license}`);
  }

  for (const required of allowedExact) {
    assert(entries.includes(required), `packed tarball missing ${required}`);
  }

  const forbiddenFragments = [
    "node_modules",
    "vendor/",
    "test/",
    ".env",
    "Cargo.",
    "target/",
    "package-lock.json",
    "pnpm-lock.yaml",
    ".tgz",
  ];

  for (const entry of entries) {
    const allowed = allowedExact.has(entry) || allowedPrefixes.some((prefix) => entry.startsWith(prefix));
    assert(allowed, `packed tarball contains unexpected file ${entry}`);
    for (const fragment of forbiddenFragments) {
      assert(!entry.includes(fragment), `packed tarball must not contain ${entry}`);
    }
  }

  assert(
    Buffer.from(tarExtract(tarball, "package/README.md")).equals(fs.readFileSync(path.join(repoRoot, "README.md"))),
    "packed README.md must match repo README.md",
  );

  for (const license of repoLicenseFiles()) {
    assert(
      Buffer.from(tarExtract(tarball, `package/${license}`)).equals(fs.readFileSync(path.join(repoRoot, license))),
      `packed ${license} must match repo ${license}`,
    );
  }
}

function writeSmokeBinary(destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(
    destination,
    "#!/usr/bin/env node\nprocess.stdout.write(`package-smoke-ok ${process.argv.slice(2).join(\" \")}\\n`);\n",
    { mode: 0o755 },
  );
  fs.chmodSync(destination, 0o755);
}

function checkInstalledBins(installRoot) {
  const installedPackageRoot = path.join(installRoot, "node_modules", packageJson.name);
  assert(fs.existsSync(installedPackageRoot), "tarball install must create package under node_modules");

  const env = { ...process.env };
  if (packageJson.name === "soma-rmcp") {
    const fakeBinary = path.join(installRoot, "fake-soma");
    writeSmokeBinary(fakeBinary);
    env.SOMA_BIN = fakeBinary;
  } else {
    const platformPath = path.join(installedPackageRoot, "lib", "platform.js");
    assert(fs.existsSync(platformPath), "downloaded-binary packages must include lib/platform.js");
    if (fs.existsSync(platformPath)) {
      const platform = require(platformPath);
      writeSmokeBinary(platform.binaryPath());
    }
  }

  for (const [name, relative] of Object.entries(packageJson.bin || {})) {
    const binPath = path.join(installedPackageRoot, relative);
    const result = spawnSync(process.execPath, [binPath, "--package-smoke"], {
      cwd: installRoot,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    assert(result.status === 0, `${name} bin smoke exited ${result.status}: ${output.trim()}`);
    assert(output.includes("package-smoke-ok --package-smoke"), `${name} bin smoke did not invoke the installed binary`);
  }
}

function checkTarballInstallSmoke(tarball, tempDir) {
  const installRoot = path.join(tempDir, "consumer");
  fs.mkdirSync(installRoot, { recursive: true });
  run("npm", ["install", "--ignore-scripts", "--prefix", installRoot, tarball], { cwd: tempDir });
  checkInstalledBins(installRoot);
}

function supportedTargets(platform) {
  const tuples = [
    ["linux", "x64"],
    ["win32", "x64"],
    ["darwin", "x64"],
    ["darwin", "arm64"],
  ];
  const targets = [];
  for (const [osName, arch] of tuples) {
    try {
      const target = platform.targetFor(osName, arch);
      targets.push({ osName, arch, target });
    } catch (_) {
      // Unsupported target; ignore.
    }
  }
  return targets;
}

function requestHead(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: "HEAD" }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        if (redirects > 8) {
          reject(new Error(`too many redirects for ${url}`));
          return;
        }
        requestHead(new URL(response.headers.location, url).toString(), redirects + 1).then(resolve, reject);
        return;
      }

      response.resume();
      resolve(response.statusCode);
    });

    request.setTimeout(15000, () => {
      request.destroy(new Error(`timeout checking ${url}`));
    });
    request.on("error", reject);
    request.end();
  });
}

function requestText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          response.resume();
          if (redirects > 8) {
            reject(new Error(`too many redirects for ${url}`));
            return;
          }
          requestText(new URL(response.headers.location, url).toString(), redirects + 1).then(resolve, reject);
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`${url} returned ${response.statusCode}`));
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      })
      .on("error", reject)
      .setTimeout(15000, function onTimeout() {
        this.destroy(new Error(`timeout checking ${url}`));
      });
  });
}

function checksumManifestUrl(assetUrl) {
  return assetUrl.replace(/\/[^/]+$/, "/SHA256SUMS");
}

async function hasChecksumFor(url, asset) {
  const sidecarStatus = await requestHead(`${url}.sha256`);
  if (sidecarStatus >= 200 && sidecarStatus < 300) {
    return true;
  }

  const manifestUrl = checksumManifestUrl(url);
  const manifest = await requestText(manifestUrl);
  return manifest
    .trim()
    .split(/\r?\n/)
    .some((line) => {
      const parts = line.trim().split(/\s+/);
      const hash = parts[0] && parts[0].toLowerCase();
      const name = parts.slice(1).join(" ").replace(/^\*/, "");
      return /^[a-f0-9]{64}$/.test(hash) && path.basename(name) === asset;
    });
}

async function checkReleaseAssets() {
  if (skipReleaseAssets || !releaseMode) {
    return;
  }

  const platformPath = path.join(packageRoot, "lib", "platform.js");
  if (!fs.existsSync(platformPath)) {
    return;
  }

  const platform = require(platformPath);
  if (typeof platform.downloadUrl !== "function" || typeof platform.targetFor !== "function") {
    return;
  }

  for (const { osName, arch, target } of supportedTargets(platform)) {
    const url = platform.downloadUrl(target);
    const status = await requestHead(url);
    assert(status >= 200 && status < 300, `release asset missing for ${osName}/${arch}: ${url} returned ${status}`);
    assert(await hasChecksumFor(url, target.asset), `release checksum missing for ${osName}/${arch}: ${target.asset}`);
  }
}

async function main() {
  checkSyncedFiles();
  checkMetadata();
  assertRuntimeScriptsDoNotEscapePackage();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${packageJson.name}-package-check-`));
  try {
    const tarball = packTarball(tempDir);
    checkPacklist(tarball);
    checkTarballInstallSmoke(tarball, tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  await checkReleaseAssets();

  if (failures.length > 0) {
    for (const failure of failures) {
      process.stderr.write(`package-check: ${failure}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`package-check: ${packageJson.name} ok\n`);
}

main().catch((error) => {
  process.stderr.write(`package-check: ${error.message}\n`);
  process.exitCode = 1;
});
