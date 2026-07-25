import * as React from "react"

export type ClipboardState = "idle" | "copied" | "error"

async function writeClipboard(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error("Clipboard API is unavailable")
  await navigator.clipboard.writeText(value)
}

/** Clipboard state with explicit failure UI and unmount-safe timers. */
export function useClipboard(timeout = 1800) {
  const [state, setState] = React.useState<ClipboardState>("idle")
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setState("idle")
  }, [])

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copy = React.useCallback(async (value: string) => {
    if (timer.current) clearTimeout(timer.current)
    let copied = false
    try {
      await writeClipboard(value)
      copied = true
      setState("copied")
    } catch {
      setState("error")
    }
    timer.current = setTimeout(() => {
      timer.current = null
      setState("idle")
    }, timeout)
    return copied
  }, [timeout])

  return { state, copy, reset, copied: state === "copied", error: state === "error" }
}
