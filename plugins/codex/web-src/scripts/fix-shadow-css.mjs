import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const cssPath = path.resolve(
  here,
  "../../source/usr/local/emhttp/plugins/unraid-codex/web/unraid-codex.css",
)
const css = fs.readFileSync(cssPath, "utf8")

// shadcn emits its token bridge against :root. The bundle is loaded inside a
// shadow root, so apply the same generated declarations to the custom-element
// host without copying or retyping any Aurora token values.
fs.writeFileSync(cssPath, css.replaceAll(":root", ":host"))
