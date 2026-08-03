export const CODEX_SHORTCUT_EVENT = "unraid-codex:shortcut-changed"
const STORAGE_KEY = "unraid-codex.shortcut"

export type CodexShortcut = "disabled" | "KeyU" | "KeyK" | "KeyJ" | "KeyC"

export const CODEX_SHORTCUT_OPTIONS: Array<{ value: CodexShortcut; label: string }> = [
  { value: "KeyU", label: "Ctrl/⌘ + Shift + U" },
  { value: "KeyK", label: "Ctrl/⌘ + Shift + K" },
  { value: "KeyJ", label: "Ctrl/⌘ + Shift + J" },
  { value: "KeyC", label: "Ctrl/⌘ + Shift + C" },
  { value: "disabled", label: "Disabled" },
]

export function readCodexShortcut(): CodexShortcut {
  const value = localStorage.getItem(STORAGE_KEY)
  return CODEX_SHORTCUT_OPTIONS.some((option) => option.value === value)
    ? (value as CodexShortcut)
    : "KeyU"
}

export function writeCodexShortcut(value: CodexShortcut) {
  localStorage.setItem(STORAGE_KEY, value)
  window.dispatchEvent(new CustomEvent(CODEX_SHORTCUT_EVENT, { detail: value }))
}

export function codexShortcutLabel(value: CodexShortcut) {
  return CODEX_SHORTCUT_OPTIONS.find((option) => option.value === value)?.label ?? "Disabled"
}

export function codexShortcutAria(value: CodexShortcut) {
  if (value === "disabled") return undefined
  const key = value.slice(-1)
  return `Control+Shift+${key} Meta+Shift+${key}`
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
    ),
  )
}

export function matchesCodexShortcut(event: KeyboardEvent, value = readCodexShortcut()) {
  if (value === "disabled") return false
  if (event.repeat || event.isComposing || event.altKey) return false
  if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return false
  return event.code === value
}
