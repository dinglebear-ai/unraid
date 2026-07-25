"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { useClipboard } from "@/lib/aurora/use-clipboard"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CodeLanguage = "typescript" | "rust" | "bash" | "json" | "toml" | "diff" | string

export interface CodeBlockProps {
  code: string
  language?: CodeLanguage
  filename?: string
  showLineNumbers?: boolean
  variant?: "default" | "diff"
}

export interface CodeChipProps {
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Token types & Aurora color map
// ---------------------------------------------------------------------------

type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "operator"
  | "type"
  | "function"
  | "plain"
  | "diff-add"
  | "diff-remove"
  | "diff-header"

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "var(--aurora-accent-primary)",       // cyan
  string: "var(--aurora-accent-pink)",            // pink
  comment: "var(--aurora-text-muted)",            // muted
  number: "var(--aurora-warn)",                   // warn amber
  operator: "var(--aurora-accent-strong)",        // bright cyan
  type: "var(--aurora-code-type)",
  function: "var(--aurora-code-function)",
  plain: "var(--aurora-text-primary)",
  "diff-add": "var(--aurora-success)",
  "diff-remove": "var(--aurora-error)",
  "diff-header": "var(--aurora-warn)",
}

// ---------------------------------------------------------------------------
// Tokenizers per language
// ---------------------------------------------------------------------------

interface Token {
  type: TokenType
  text: string
}

// Generic rule-based tokenizer
type Rule = { regex: RegExp; type: TokenType }

function tokenize(code: string, rules: Rule[]): Token[] {
  const tokens: Token[] = []
  let remaining = code

  outer: while (remaining.length > 0) {
    for (const rule of rules) {
      const match = remaining.match(rule.regex)
      if (match && match.index === 0) {
        tokens.push({ type: rule.type, text: match[0] })
        remaining = remaining.slice(match[0].length)
        continue outer
      }
    }
    // Advance by one char as plain text, merging with previous plain token
    const last = tokens[tokens.length - 1]
    if (last && last.type === "plain") {
      last.text += remaining[0]
    } else {
      tokens.push({ type: "plain", text: remaining[0] })
    }
    remaining = remaining.slice(1)
  }

  return tokens
}

const TS_KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|from|default|class|extends|implements|interface|type|enum|namespace|async|await|new|this|super|typeof|instanceof|void|null|undefined|true|false|in|of|try|catch|finally|throw|delete|readonly|public|private|protected|static|abstract|declare|as|keyof|is)\b/

const RUST_KEYWORDS =
  /\b(fn|let|mut|pub|use|mod|struct|enum|impl|trait|return|if|else|for|while|loop|match|break|continue|async|await|move|ref|self|Self|super|crate|where|type|const|static|extern|unsafe|dyn|Box|Vec|Option|Result|Some|None|Ok|Err|true|false)\b/

const BASH_KEYWORDS =
  /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|local|readonly|shift|set|unset|trap)\b/

function makeTypeScriptRules(): Rule[] {
  return [
    { regex: /\/\/[^\n]*/, type: "comment" },
    { regex: /\/\*[\s\S]*?\*\//, type: "comment" },
    { regex: /`(?:[^`\\]|\\.)*`/, type: "string" },
    { regex: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { regex: /'(?:[^'\\]|\\.)*'/, type: "string" },
    { regex: TS_KEYWORDS, type: "keyword" },
    { regex: /\b[A-Z][A-Za-z0-9_]*\b/, type: "type" },
    { regex: /\b[a-z_$][A-Za-z0-9_$]*(?=\s*\()/, type: "function" },
    { regex: /\b\d+(\.\d+)?\b/, type: "number" },
    { regex: /[=<>!&|+\-*/%?:^~]+/, type: "operator" },
  ]
}

function makeRustRules(): Rule[] {
  return [
    { regex: /\/\/[^\n]*/, type: "comment" },
    { regex: /\/\*[\s\S]*?\*\//, type: "comment" },
    { regex: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { regex: /r#?"[\s\S]*?"#?/, type: "string" },
    { regex: RUST_KEYWORDS, type: "keyword" },
    { regex: /\b[A-Z][A-Za-z0-9_]*\b/, type: "type" },
    { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/, type: "function" },
    { regex: /\b\d+(\.\d+)?(u8|u16|u32|u64|i8|i16|i32|i64|f32|f64|usize|isize)?\b/, type: "number" },
    { regex: /[=<>!&|+\-*/%?:^~]+/, type: "operator" },
  ]
}

const BASH_COMMANDS =
  /\b(npx|npm|pnpm|yarn|bun|node|deno|docker|kubectl|helm|git|cargo|go|make|curl|wget|ssh|scp|rsync|sudo|apt|brew|pip|python|python3)\b/

function makeBashRules(): Rule[] {
  return [
    { regex: /#[^\n]*/, type: "comment" },
    { regex: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { regex: /'[^']*'/, type: "string" },
    { regex: BASH_KEYWORDS, type: "keyword" },
    { regex: BASH_COMMANDS, type: "string" },
    { regex: /\$[A-Za-z_][A-Za-z0-9_]*|\$\{[^}]*\}/, type: "type" },
    { regex: /\b\d+\b/, type: "number" },
    { regex: /[=<>!|&]+/, type: "operator" },
  ]
}

function makeJsonRules(): Rule[] {
  return [
    { regex: /"(?:[^"\\]|\\.)*"\s*:/, type: "keyword" },
    { regex: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { regex: /\b(true|false|null)\b/, type: "keyword" },
    { regex: /-?\d+(\.\d+)?([eE][+-]?\d+)?/, type: "number" },
    { regex: /[{}\[\],:]/, type: "operator" },
  ]
}

function makeTomlRules(): Rule[] {
  return [
    { regex: /#[^\n]*/, type: "comment" },
    { regex: /"""[\s\S]*?"""/, type: "string" },
    { regex: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { regex: /'[^']*'/, type: "string" },
    { regex: /^\[[^\]]*\]/m, type: "type" },
    { regex: /^[a-zA-Z_][a-zA-Z0-9_-]*\s*(?==)/m, type: "keyword" },
    { regex: /\b(true|false)\b/, type: "keyword" },
    { regex: /\b\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z?)?\b/, type: "number" },
    { regex: /-?\d+(\.\d+)?/, type: "number" },
  ]
}

function getRules(language: CodeLanguage): Rule[] {
  switch (language) {
    case "typescript":
    case "tsx":
    case "jsx":
    case "javascript":
    case "js":
    case "ts":
      return makeTypeScriptRules()
    case "rust":
      return makeRustRules()
    case "bash":
    case "sh":
    case "shell":
      return makeBashRules()
    case "json":
      return makeJsonRules()
    case "toml":
      return makeTomlRules()
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Diff line parser
// ---------------------------------------------------------------------------

type DiffLine = {
  text: string
  type: "add" | "remove" | "header" | "context"
}

function parseDiffLines(code: string): DiffLine[] {
  return code.split("\n").map((line) => {
    if (line.startsWith("+")) return { text: line, type: "add" }
    if (line.startsWith("-")) return { text: line, type: "remove" }
    if (line.startsWith("@@") || line.startsWith("diff ") || line.startsWith("index ")) {
      return { text: line, type: "header" }
    }
    return { text: line, type: "context" }
  })
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderTokens(tokens: Token[]): React.ReactNode {
  return tokens.map((tok, i) => (
    <span key={i} style={{ color: TOKEN_COLORS[tok.type] ?? TOKEN_COLORS.plain }}>
      {tok.text}
    </span>
  ))
}

function highlightLine(line: string, rules: Rule[]): React.ReactNode {
  if (rules.length === 0) return line
  return renderTokens(tokenize(line, rules))
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ code }: { code: string }) {
  const { copied, error, copy } = useClipboard(2000)
  const handleCopy = React.useCallback(() => void copy(code), [code, copy])

  return (
    <Button
      type="button"
      variant="plain"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : error ? "Unable to copy" : "Copy code"}
      title={copied ? "Copied" : error ? "Unable to copy" : "Copy to clipboard"}
      style={{
        gap: "6px",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "var(--aurora-font-sans)",
        color: copied ? "var(--aurora-success)" : "var(--aurora-text-primary)",
        padding: "4px 6px",
        flexShrink: 0,
      }}
    >
      {copied ? (
        <>
          <Check size={15} strokeWidth={1.75} aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy size={15} strokeWidth={1.65} aria-hidden />
          Copy
        </>
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Main CodeBlock component
// ---------------------------------------------------------------------------

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  variant = "default",
}: CodeBlockProps) {
  const rules = getRules(language)
  const isDiff = variant === "diff" || language === "diff"

  const diffLineBg = (type: DiffLine["type"]): string => {
    switch (type) {
      case "add":
        return "color-mix(in srgb, var(--aurora-success) 8%, transparent)"
      case "remove":
        return "color-mix(in srgb, var(--aurora-error) 8%, transparent)"
      case "header":
        return "color-mix(in srgb, var(--aurora-warn) 8%, transparent)"
      default:
        return "transparent"
    }
  }

  const diffLineColor = (type: DiffLine["type"]): string => {
    switch (type) {
      case "add":
        return "var(--aurora-success)"
      case "remove":
        return "var(--aurora-error)"
      case "header":
        return "var(--aurora-warn)"
      default:
        return "var(--aurora-text-primary)"
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        background: "var(--aurora-panel-strong)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: "var(--aurora-radius-2)",
        overflow: "hidden",
        boxShadow: "var(--aurora-shadow-medium)",
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          minWidth: 0,
          background: "var(--aurora-panel-medium)",
          borderBottom: "1px solid var(--aurora-border-default)",
          boxShadow: "var(--aurora-highlight-medium)",
        }}
      >
        {/* Language / filename badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: "14px",
            color: "var(--aurora-text-muted)",
            fontFamily: "var(--aurora-font-mono)",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename ?? language}
        </span>

        <div style={{ flex: 1 }} />

        <CopyButton code={code} />
      </div>

      {/* Code body */}
      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          minWidth: 0,
          maxHeight: "480px",
          padding: "16px 0",
        }}
      >
        {isDiff ? (
          // Diff rendering
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--aurora-font-mono)",
              fontSize: "15px",
              lineHeight: "1.7",
            }}
          >
            <tbody>
              {parseDiffLines(code).map((line, i) => (
                <tr
                  key={i}
                  style={{ background: diffLineBg(line.type) }}
                >
                  {showLineNumbers && (
                    <td
                      style={{
                        padding: "0 10px",
                        userSelect: "none",
                        color: "var(--aurora-text-muted)",
                        fontSize: "11px",
                        textAlign: "right",
                        minWidth: "36px",
                        borderRight: "1px solid var(--aurora-border-default)",
                        opacity: 0.5,
                        verticalAlign: "top",
                        paddingTop: "1px",
                      }}
                    >
                      {i + 1}
                    </td>
                  )}
                  <td
                    style={{
                      padding: "0 20px",
                      whiteSpace: "pre",
                      color: diffLineColor(line.type),
                    }}
                  >
                    {line.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Default rendering
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--aurora-font-mono)",
              fontSize: "15px",
              lineHeight: "1.7",
            }}
          >
            <tbody>
              {code.split("\n").map((line, i) => (
                <tr key={i}>
                  {showLineNumbers && (
                    <td
                      style={{
                        padding: "0 10px",
                        userSelect: "none",
                        color: "var(--aurora-text-muted)",
                        fontSize: "11px",
                        textAlign: "right",
                        minWidth: "36px",
                        borderRight: "1px solid var(--aurora-border-default)",
                        opacity: 0.45,
                        verticalAlign: "top",
                        paddingTop: "1px",
                      }}
                    >
                      {i + 1}
                    </td>
                  )}
                  <td style={{ padding: "0 20px", whiteSpace: "pre" }}>
                    {highlightLine(line, rules)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CodeChip – inline monospace pill for references
// ---------------------------------------------------------------------------

export function CodeChip({ children }: CodeChipProps) {
  return (
    <code
      style={{
        display: "inline",
        fontFamily: "var(--aurora-font-mono)",
        fontSize: "0.85em",
        color: "var(--aurora-accent-primary)",
        background: "color-mix(in srgb, var(--aurora-accent-primary) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent)",
        borderRadius: "6px",
        padding: "1px 6px",
        lineHeight: "1.5",
      }}
    >
      {children}
    </code>
  )
}

export default CodeBlock
