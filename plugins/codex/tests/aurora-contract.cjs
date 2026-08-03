#!/usr/bin/env node
"use strict"

const fs = require("node:fs")
const path = require("node:path")

const webSrc = process.argv[2]
if (!webSrc) {
  console.error("usage: aurora-contract.cjs <web-src-dir>")
  process.exit(2)
}

const read = (name) => fs.readFileSync(path.join(webSrc, name), "utf8")
const fail = (message) => {
  console.error("Aurora design contract failed: " + message)
  process.exit(1)
}

const indexCss = read("index.css")
const auroraComponents = read("components/aurora-components.css")
const app = read("App.tsx")
const renderers = read("renderers.tsx")
const main = read("main.tsx")
const select = read("components/ui/aurora/select.tsx")
const reasoning = read("components/aurora/ai/reasoning.tsx")
const message = read("components/aurora/ai/message.tsx")
const promptInput = read("components/aurora/prompt-input.tsx")
const toolCalls = read("components/aurora/tool-calls.tsx")
const toolModel = read("components/aurora/tool-calls-model.ts")

if (!indexCss.includes('@import "./components/aurora.css";')) {
  fail("index.css must import the canonical Aurora token contract")
}
if (/^:root\s*\{/m.test(indexCss) || /^\.dark\s*\{/m.test(indexCss)) {
  fail("index.css must not define a second top-level Aurora palette")
}
if (!main.includes("mount.className = ") || !main.includes("uc-root light uc-theme-")) {
  fail("the shadow-root mount must carry the canonical .light class")
}
if (!select.includes('type SelectTone = "primary" | "neutral" | "orange"')) {
  fail("Select must expose canonical semantic tones")
}
if (!reasoning.includes("aria-controls={contentId}") || !reasoning.includes('role="region"')) {
  fail("Reasoning must expose an accessible disclosure region")
}
if (!reasoning.includes("Reasoning details were not provided for this turn.")) {
  fail("Reasoning must render an explicit empty-details state")
}
if (renderers.includes("Tool Activity")) {
  fail("tool runs must not restore the redundant Tool Activity banner")
}
if (!toolCalls.includes("aurora-tool-activity__trigger") || !toolCalls.includes("summarizeToolActivity")) {
  fail("tool runs must render as one compact activity disclosure")
}
if (!toolModel.includes("describeTool") || !toolModel.includes("trimRepeatedCategory")) {
  fail("tool identities must normalize duplicate providers and repeated category words")
}
if (!message.includes("aurora-message-meta")) {
  fail("message metadata must expose a stable hover/focus hook")
}
if (!indexCss.includes(".uc-message .aurora-message-meta") || !indexCss.includes("pointer-events: none;")) {
  fail("desktop message metadata must remain hidden until interaction")
}
if (!indexCss.includes(".uc-message .aurora-message-meta > span") || !indexCss.includes("min-height: 40px;")) {
  fail("mobile message actions must hide timestamps and retain a touch-sized action")
}
if (!promptInput.includes(`variant="aurora"\n              size="icon"\n              filled`)) {
  fail("Send must remain the single filled primary composer action")
}
if (!/modelBtn:[\s\S]*?color: "var\(--aurora-text-muted\)"/.test(promptInput)) {
  fail("the model selector must remain visually neutral")
}

for (const [name, source] of [["App.tsx", app], ["renderers.tsx", renderers]]) {
  for (const tag of ["SelectTrigger", "SelectContent"]) {
    const elements = source.match(new RegExp("<" + tag + "\\b(?:(?!>).)*>", "gs")) || []
    for (const element of elements) {
      if (!/\btone=/.test(element)) {
        fail(name + " contains " + tag + " without an explicit semantic tone")
      }
    }
  }
}

const rawColor = /#[0-9a-f]{3,8}|\brgba?\(/i
if (rawColor.test(auroraComponents)) {
  fail("shared Aurora components must use canonical color tokens, not raw colors")
}
const selector = /\.uc-theme-aurora[^{}]*\{/g
let match
while ((match = selector.exec(indexCss))) {
  let depth = 1
  let cursor = match.index + match[0].length
  while (cursor < indexCss.length && depth > 0) {
    if (indexCss[cursor] === "{") depth += 1
    if (indexCss[cursor] === "}") depth -= 1
    cursor += 1
  }
  const block = indexCss.slice(match.index, cursor)
  if (rawColor.test(block)) {
    fail("raw color found in Aurora-specific block: " + match[0].trim())
  }
}

const permissionStart = indexCss.indexOf("  .uc-header-popover {")
const permissionEnd = indexCss.indexOf("  .uc-conversation-shell {", permissionStart)
if (permissionStart < 0 || permissionEnd < 0) {
  fail("permission panel styles are missing")
}
const permissionCss = indexCss.slice(permissionStart, permissionEnd)
if (rawColor.test(permissionCss)) {
  fail("permission panel must use canonical Aurora semantic tokens")
}
if (/position:\s*fixed/.test(permissionCss)) {
  fail("permission panel must remain sheet-relative, not viewport-fixed")
}
if (!/\.uc-permission-menu\s*\{[^}]*position:\s*static/s.test(indexCss)) {
  fail("permission menu must not create a narrow positioning context")
}
if (!/\.uc-header-actions\s*\{[^}]*position:\s*static/s.test(indexCss)) {
  fail("header actions must not create a narrow positioning context")
}
if (!indexCss.includes("accent-color: var(--axon-orange-button);")) {
  fail("approval checkboxes must use the canonical orange semantic token")
}

const sourceColor = /#[0-9a-f]{3,8}|\brgba?\(/i
const pending = [webSrc]
while (pending.length) {
  const current = pending.pop()
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name)
    if (entry.isDirectory()) {
      pending.push(fullPath)
      continue
    }
    if (!/\.tsx?$/.test(entry.name)) continue
    const source = fs.readFileSync(fullPath, "utf8")
    if (sourceColor.test(source)) {
      fail("raw color found in TypeScript source: " + path.relative(webSrc, fullPath))
    }
  }
}

console.log("Aurora design contract checks passed")
