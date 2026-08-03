#!/usr/bin/env node
"use strict"

const assert = require("node:assert/strict")
const { spawn } = require("node:child_process")
const { createRequire } = require("node:module")
const path = require("node:path")

const testDir = __dirname
const pluginDir = path.resolve(testDir, "../..")
const webRoot = path.join(pluginDir, "web-src")
const requireFromWeb = createRequire(path.join(webRoot, "package.json"))
const { chromium } = requireFromWeb("playwright")
const port = Number(process.env.CODEX_BROWSER_TEST_PORT || 4183)
const origin = `http://127.0.0.1:${port}`

const server = spawn(process.execPath, [path.join(testDir, "mock-server.mjs")], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
})
let serverOutput = ""
server.stdout.on("data", (chunk) => { serverOutput += chunk })
server.stderr.on("data", (chunk) => { serverOutput += chunk })

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(origin)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`mock server did not become ready:
${serverOutput}`)
}

async function waitFor(predicate, message, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 80))
  }
  throw new Error(message)
}

async function main() {
  await waitForServer()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const consoleErrors = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  page.on("pageerror", (error) => consoleErrors.push(error.message))

  await page.goto(origin, { waitUntil: "networkidle" })
  const host = page.locator("unraid-codex-chathead")
  const launcher = host.locator('.uc-launcher')
  await launcher.waitFor()
  assert.equal(await launcher.getAttribute("aria-keyshortcuts"), "Control+Shift+U Meta+Shift+U")

  await page.keyboard.press("Control+Shift+U")
  const prompt = host.locator('[aria-label="Prompt input"]')
  await prompt.waitFor()
  await waitFor(
    async () => prompt.evaluate((element) => element.getRootNode().activeElement === element),
    "shortcut did not focus the prompt",
  )

  const diagnosticButton = host.locator('[aria-label^="Connection diagnostics."]')
  await diagnosticButton.click()
  const diagnosticDialog = host.locator('[role="dialog"][aria-label="Connection diagnostics"]')
  await diagnosticDialog.waitFor()
  await waitFor(
    async () => (await diagnosticDialog.textContent()).includes("Authenticated and ready"),
    "Unraid MCP never became healthy in diagnostics",
  )
  const diagnosticText = await diagnosticDialog.textContent()
  assert.match(diagnosticText, /App server/)
  assert.match(diagnosticText, /Unraid MCP/)
  assert.match(diagnosticText, /ChatGPT auth/)
  assert.match(diagnosticText, /Signed in/)
  assert.match(diagnosticText, /Last successful check/)

  await page.keyboard.press("Escape")
  await page.waitForTimeout(80)
  assert.equal(await diagnosticDialog.count(), 0)
  assert.equal(await host.locator(".uc-sheet").count(), 1)

  await host.locator('[aria-label="Inspect session"]').click()
  const shortcutSelect = host.locator('[aria-label="Codex launcher shortcut"]')
  await shortcutSelect.waitFor()
  await shortcutSelect.click()
  await host.getByRole("option", { name: "Disabled" }).click()
  assert.equal(await shortcutSelect.textContent(), "Disabled")

  await page.evaluate(() => window.UnraidCodex.close())
  await launcher.waitFor()
  assert.equal(await launcher.getAttribute("aria-keyshortcuts"), null)
  await page.keyboard.press("Control+Shift+U")
  await page.waitForTimeout(150)
  assert.equal(await host.locator('.uc-sheet').count(), 0)

  await page.evaluate(() => {
    const input = document.createElement("input")
    input.id = "shortcut-editable-guard"
    document.body.appendChild(input)
    input.focus()
    localStorage.setItem("unraid-codex.shortcut", "KeyK")
    window.dispatchEvent(new CustomEvent("unraid-codex:shortcut-changed", { detail: "KeyK" }))
  })
  await page.keyboard.press("Control+Shift+K")
  await page.waitForTimeout(150)
  assert.equal(await host.locator('.uc-sheet').count(), 0)

  await page.evaluate(() => {
    const input = document.querySelector("#shortcut-editable-guard")
    input?.blur()
    document.body.tabIndex = -1
    document.body.focus()
  })
  await page.keyboard.press("Control+Shift+K")
  await prompt.waitFor()

  await page.setViewportSize({ width: 338, height: 740 })
  await diagnosticButton.click()
  await diagnosticDialog.waitFor()
  const [buttonBox, dialogBox] = await Promise.all([
    diagnosticButton.boundingBox(),
    diagnosticDialog.boundingBox(),
  ])
  assert.ok(
    buttonBox && buttonBox.width >= 44 && buttonBox.height >= 44,
    `mobile diagnostics target is too small: ${JSON.stringify(buttonBox)}`,
  )
  assert.ok(dialogBox && dialogBox.x >= 0 && dialogBox.x + dialogBox.width <= 338, "mobile diagnostics overflow")

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  assert.equal(dimensions.scrollWidth, dimensions.clientWidth)
  assert.deepEqual(consoleErrors, [])
  await browser.close()
}

main()
  .then(() => {
    server.kill("SIGTERM")
    console.log("Codex browser smoke checks passed")
  })
  .catch((error) => {
    server.kill("SIGTERM")
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
