#!/usr/bin/env node
"use strict"

const fs = require("node:fs")
const vm = require("node:vm")

const pagePath = process.argv[2]
if (!pagePath) throw new Error("usage: settings-page.cjs <CodexSettings.page>")
const page = fs.readFileSync(pagePath, "utf8")
const lowerPage = page.toLowerCase()
const scriptTag = lowerPage.indexOf("<script")
const scriptStart = scriptTag === -1 ? -1 : lowerPage.indexOf(">", scriptTag)
const scriptEnd = scriptStart === -1 ? -1 : lowerPage.indexOf("</script", scriptStart + 1)
const scriptClose = scriptEnd === -1 ? -1 : lowerPage.indexOf(">", scriptEnd)
if (scriptTag === -1 || scriptStart === -1 || scriptEnd === -1 || scriptClose === -1) {
  throw new Error("settings page script not found")
}
const script = page.slice(scriptStart + 1, scriptEnd)

function runCase(withApi) {
  const elements = {
    "uc-open-settings": {
      handler: null,
      addEventListener(type, handler) {
        if (type !== "click") throw new Error(`unexpected listener: ${type}`)
        this.handler = handler
      },
    },
    "uc-settings-status": { textContent: "initial" },
  }
  const timers = []
  let opens = 0
  const window = {
    UnraidCodex: withApi ? { openSettings() { opens += 1 } } : undefined,
    setInterval(callback, milliseconds) {
      if (milliseconds !== 250) throw new Error(`unexpected interval: ${milliseconds}`)
      timers.push(callback)
      return timers.length
    },
    clearInterval() {},
  }
  const context = {
    document: {
      getElementById(id) {
        if (!elements[id]) throw new Error(`unknown element: ${id}`)
        return elements[id]
      },
    },
    window,
  }
  vm.runInNewContext(script, context, { filename: pagePath })
  return { elements, timers, window, get opens() { return opens } }
}

const ready = runCase(true)
if (ready.opens !== 1) throw new Error(`expected immediate open, got ${ready.opens}`)
if (ready.timers.length !== 0) throw new Error("ready page must not start a retry timer")
if (ready.elements["uc-settings-status"].textContent !== "Session Inspector opened.") {
  throw new Error("ready status was not announced")
}

const delayed = runCase(false)
if (typeof delayed.elements["uc-open-settings"].handler !== "function") {
  throw new Error("settings button click handler was not registered")
}
if (delayed.timers.length !== 1) throw new Error("loading page must start one retry timer")
delayed.elements["uc-open-settings"].handler()
if (!delayed.elements["uc-settings-status"].textContent.includes("still loading")) {
  throw new Error("loading click did not expose a diagnostic status")
}
for (let index = 0; index < 20; index += 1) delayed.timers[0]()
if (!delayed.elements["uc-settings-status"].textContent.includes("did not load")) {
  throw new Error("retry exhaustion did not expose a failure status")
}
delayed.window.UnraidCodex = { openSettings() {} }
delayed.elements["uc-open-settings"].handler()
if (delayed.elements["uc-settings-status"].textContent !== "Session Inspector opened.") {
  throw new Error("settings button did not recover after the API became available")
}

console.log("Codex settings page behavior tests passed")
