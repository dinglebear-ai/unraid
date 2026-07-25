import { parentPort } from "node:worker_threads";

type CatalogKind = "pypi" | "brew" | "apt";

interface CatalogRequest {
  kind: CatalogKind;
  bytes: ArrayBuffer;
}

function parseApt(text: string) {
  const results: Array<{ ecosystem: "apt"; name: string; description?: string; version?: string }> = [];
  let name: string | undefined;
  let description: string | undefined;
  let version: string | undefined;
  const flush = () => {
    if (name) results.push({ ecosystem: "apt", name, description, version });
    name = description = version = undefined;
  };
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i < text.length && text.charCodeAt(i) !== 10) continue;
    const line = text.slice(start, i).replace(/\r$/, "");
    start = i + 1;
    if (!line) { flush(); continue; }
    if (line.startsWith(" ") || line.startsWith("\t")) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1).trim();
    if (key === "Package") name = value;
    else if (key === "Description") description = value;
    else if (key === "Version") version = value;
  }
  flush();
  return results;
}

parentPort?.on("message", ({ kind, bytes }: CatalogRequest) => {
  try {
    const text = Buffer.from(bytes).toString("utf-8");
    let result: unknown;
    if (kind === "pypi") {
      const data = JSON.parse(text) as { projects: Array<{ name: string }> };
      result = data.projects.map((project) => project.name);
    } else if (kind === "brew") {
      const data = JSON.parse(text) as Array<{ name: string; desc?: string; versions: { stable?: string } }>;
      result = data.map((formula) => ({
        ecosystem: "brew" as const,
        name: formula.name,
        description: formula.desc,
        version: formula.versions.stable,
      }));
    } else {
      result = parseApt(text);
    }
    parentPort?.postMessage({ result });
  } catch (error) {
    parentPort?.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});
