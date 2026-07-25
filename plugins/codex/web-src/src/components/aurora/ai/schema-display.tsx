import * as React from "react"
import { Code } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JsonSchemaProperty {
  type?: string
  description?: string
  items?: { type?: string }
  [key: string]: unknown
}

export interface JsonSchema {
  type?: string
  required?: string[]
  properties?: Record<string, JsonSchemaProperty>
  [key: string]: unknown
}

export interface SchemaDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** JSON Schema object to render. */
  schema: JsonSchema | unknown
  /** Header title shown beside the code glyph. */
  title?: string
  /** Initial view tab. Defaults to "fields". */
  defaultView?: "fields" | "json"
}

// ---------------------------------------------------------------------------
// Type-tone mapping — each JSON-schema scalar maps to an Aurora status tone.
// Array/string -> success, integer/number -> warn, boolean -> rose.
// ---------------------------------------------------------------------------

type TypeTone = {
  badge: "info" | "success" | "warn" | "rose"
}

function toneForType(type: string): TypeTone {
  const base = type.replace(/\[\]$/, "")
  switch (base) {
    case "integer":
    case "number":
      return {
        badge: "warn",
      }
    case "boolean":
      return {
        badge: "rose",
      }
    case "object":
      return {
        badge: "info",
      }
    // string, array (string[]), and anything else → success teal
    default:
      return {
        badge: "success",
      }
  }
}

function displayType(prop: JsonSchemaProperty): string {
  if (prop.type === "array") {
    const itemType = prop.items?.type ?? "any"
    return `${itemType}[]`
  }
  return prop.type ?? "any"
}

// ---------------------------------------------------------------------------
// Raw JSON renderer (token-colored, mono).
// ---------------------------------------------------------------------------

function renderJsonValue(value: unknown, depth = 0): React.ReactNode {
  const indent = "  ".repeat(depth)

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: "var(--aurora-text-muted)" }}>[]</span>
    return (
      <>
        <span style={{ color: "var(--aurora-text-muted)" }}>[</span>
        {"\n"}
        {value.map((item, index) => (
          <React.Fragment key={index}>
            {indent}
            {"  "}
            {renderJsonValue(item, depth + 1)}
            {index < value.length - 1 ? <span style={{ color: "var(--aurora-text-muted)" }}>,</span> : null}
            {"\n"}
          </React.Fragment>
        ))}
        {indent}
        <span style={{ color: "var(--aurora-text-muted)" }}>]</span>
      </>
    )
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span style={{ color: "var(--aurora-text-muted)" }}>{`{}`}</span>
    return (
      <>
        <span style={{ color: "var(--aurora-text-muted)" }}>{`{`}</span>
        {"\n"}
        {entries.map(([key, entryValue], index) => (
          <React.Fragment key={key}>
            {indent}
            {"  "}
            <span style={{ color: "var(--aurora-accent-primary)" }}>{`"${key}"`}</span>
            <span style={{ color: "var(--aurora-text-muted)" }}>: </span>
            {renderJsonValue(entryValue, depth + 1)}
            {index < entries.length - 1 ? <span style={{ color: "var(--aurora-text-muted)" }}>,</span> : null}
            {"\n"}
          </React.Fragment>
        ))}
        {indent}
        <span style={{ color: "var(--aurora-text-muted)" }}>{`}`}</span>
      </>
    )
  }

  if (typeof value === "string") return <span style={{ color: "var(--aurora-accent-pink)" }}>{`"${value}"`}</span>
  if (typeof value === "number") return <span style={{ color: "var(--aurora-warn)" }}>{value}</span>
  if (typeof value === "boolean") return <span style={{ color: "var(--aurora-success)" }}>{String(value)}</span>
  if (value === null) return <span style={{ color: "var(--aurora-text-muted)" }}>null</span>
  return <span style={{ color: "var(--aurora-text-primary)" }}>{String(value)}</span>
}

// ---------------------------------------------------------------------------
// SchemaDisplay
// ---------------------------------------------------------------------------

const SchemaDisplay = ({ ref, schema, title = "Schema", defaultView = "fields", className, style, ...props }: SchemaDisplayProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const [view, setView] = React.useState<"fields" | "json">(defaultView)

    const typed = (schema ?? {}) as JsonSchema
    const properties = typed.properties ?? {}
    const required = new Set(typed.required ?? [])
    const fieldNames = Object.keys(properties)

    const tabBase =
      "rounded-[8px] px-3 py-1.5 aurora-text-control transition-colors focus-visible:outline-none focus-visible:ring-2"

    return (
      <div
        ref={ref}
        className={cn("overflow-hidden rounded-[var(--aurora-radius-1)] border", className)}
        style={{
          borderColor: "var(--aurora-border-strong)",
          background: "var(--aurora-surface-raised)",
          boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
          fontFamily: "var(--aurora-font-sans)",
          ...style,
        }}
        {...props}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--aurora-border-default)" }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Code
              className="size-[18px] shrink-0"
              style={{ color: "var(--axon-orange)" }}
              aria-hidden
            />
            <span
              className="truncate text-[16px] font-bold"
              style={{ color: "var(--aurora-text-primary)" }}
            >
              {title}
            </span>
          </div>
          <div
            role="tablist"
            aria-label="Schema view"
            className="flex shrink-0 items-center gap-1 rounded-[10px] p-1"
            style={{
              border: "1px solid var(--aurora-border-default)",
              background: "var(--aurora-control-surface)",
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "fields"}
              onClick={() => setView("fields")}
              className={tabBase}
              style={
                view === "fields"
                  ? {
                      color: "var(--aurora-accent-primary)",
                      background: "var(--aurora-accent-primary-surface)",
                      border: "1px solid var(--aurora-accent-primary-border)",
                      boxShadow: "var(--aurora-active-glow)",
                    }
                  : {
                      color: "var(--aurora-text-muted)",
                      background: "transparent",
                      border: "1px solid transparent",
                    }
              }
            >
              Fields
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "json"}
              onClick={() => setView("json")}
              className={tabBase}
              style={
                view === "json"
                  ? {
                      color: "var(--aurora-accent-primary)",
                      background: "var(--aurora-accent-primary-surface)",
                      border: "1px solid var(--aurora-accent-primary-border)",
                      boxShadow: "var(--aurora-active-glow)",
                    }
                  : {
                      color: "var(--aurora-text-muted)",
                      background: "transparent",
                      border: "1px solid transparent",
                    }
              }
            >
              JSON
            </button>
          </div>
        </div>

        {/* Body */}
        {view === "fields" ? (
          <div role="tabpanel" aria-label="Fields">
            {fieldNames.length === 0 ? (
              <div
                className="px-5 py-4 text-[13px]"
                style={{ color: "var(--aurora-text-muted)" }}
              >
                No fields defined.
              </div>
            ) : (
              fieldNames.map((name, index) => {
                const prop = properties[name]
                const type = displayType(prop)
                const tone = toneForType(type)
                const isRequired = required.has(name)
                return (
                  <div
                    key={name}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-5 py-4"
                    style={
                      index < fieldNames.length - 1
                        ? { borderBottom: "1px solid var(--aurora-border-default)" }
                        : undefined
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-[16px] font-bold"
                          style={{ color: "var(--aurora-text-primary)", fontFamily: "var(--aurora-font-mono)" }}
                        >
                          {name}
                        </span>
                        {isRequired ? (
                          <Badge tone="warn" size="sm" shape="label">
                            Required
                          </Badge>
                        ) : null}
                      </div>
                      {prop.description ? (
                        <p
                          className="mt-1.5 text-[14px]"
                          style={{ color: "var(--aurora-text-muted)" }}
                        >
                          {prop.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge tone={tone.badge} size="sm" shape="tag">
                      {type}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div role="tabpanel" aria-label="JSON">
            <pre
              className="aurora-text-code m-0 overflow-auto px-5 py-4"
              style={{ background: "transparent" }}
            >
              {renderJsonValue(schema)}
            </pre>
          </div>
        )}
      </div>
    )
  }
SchemaDisplay.displayName = "SchemaDisplay"

export { SchemaDisplay }
export default SchemaDisplay
