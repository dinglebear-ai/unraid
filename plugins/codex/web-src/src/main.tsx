import React from "react"
import { createRoot } from "react-dom/client"
import { App, readChatTheme } from "@/App"
import { PortalContainerContext } from "@/lib/aurora/portal-container"
import "./index.css"

const DOCK_STYLE_ID = "unraid-codex-dock-style"
if (!document.getElementById(DOCK_STYLE_ID)) {
  const dockStyle = document.createElement("style")
  dockStyle.id = DOCK_STYLE_ID
  dockStyle.textContent = `
    @media (min-width: 900px) {
      html.unraid-codex-docked body {
        width: calc(100% - var(--unraid-codex-dock-width, 520px)) !important;
        transition: width 180ms ease;
      }
    }
  `
  document.head?.appendChild(dockStyle)
}

class UnraidCodexChathead extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return
    const shadow = this.attachShadow({ mode: "open" })
    const stylesheet = document.createElement("link")
    stylesheet.rel = "stylesheet"
    stylesheet.href = "/plugins/unraid-codex/web/unraid-codex.css?v=14"
    const mount = document.createElement("div")
    const theme = readChatTheme()
    mount.className = `uc-root light uc-theme-${theme}`
    mount.dataset.chatTheme = theme
    shadow.append(stylesheet, mount)
    createRoot(mount).render(
      <PortalContainerContext.Provider value={mount}>
        <App rootElement={mount} />
      </PortalContainerContext.Provider>,
    )
  }
}

if (!customElements.get("unraid-codex-chathead")) {
  customElements.define("unraid-codex-chathead", UnraidCodexChathead)
}

declare global {
  interface Window {
    UnraidCodex?: {
      mount: () => void
      open: () => void
      openSettings: () => void
      close: () => void
      toggle: () => void
    }
  }
}

const getHost = () => document.querySelector<UnraidCodexChathead>("unraid-codex-chathead")
const mountChathead = () => {
  if (getHost()) return
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", mountChathead, { once: true })
    return
  }
  document.body.appendChild(document.createElement("unraid-codex-chathead"))
}

const openSettings = () => {
  mountChathead()
  const notify = () =>
    window.dispatchEvent(new CustomEvent("unraid-codex:open-settings"))
  notify()
  window.setTimeout(notify, 0)
}

window.UnraidCodex = {
  mount: mountChathead,
  open: () => getHost()?.shadowRoot?.querySelector<HTMLButtonElement>(".uc-launcher")?.click(),
  openSettings,
  close: () =>
    getHost()?.shadowRoot?.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click(),
  toggle: () => getHost()?.shadowRoot?.querySelector<HTMLButtonElement>(".uc-launcher")?.click(),
}

mountChathead()
