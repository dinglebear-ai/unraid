"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Action } from "./action"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ *
 * Aurora · Canvas (AI element)
 *
 * A flow canvas with a header chip (status dot + title), a node-count
 * badge, a dotted-grid surface, absolutely-positioned nodes carrying
 * cyan input ports (left) + rose output ports (right), cyan bezier
 * edges that follow the nodes, and a zoom toolbar.
 *
 * Architecture (forwardRef, displayName, compound Node, HTMLAttributes
 * passthrough) is kept from the Aurora registry, while controls and typography
 * follow Aurora tokens and primitives.
 * ------------------------------------------------------------------ */

type CanvasStatus = "running" | "idle" | "blocked"

export interface CanvasEdge {
  /** index of the source Node child */
  from: number
  /** index of the target Node child */
  to: number
}

export interface CanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  status?: CanvasStatus
  /** edges drawn between Node children, by child index */
  edges?: CanvasEdge[]
}

export interface NodeProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

const statusGlow: Record<CanvasStatus, { dot: string; glow: string }> = {
  running: {
    dot: "var(--aurora-accent-primary)",
    glow: "0 0 0 3px color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent), 0 0 12px color-mix(in srgb, var(--aurora-accent-primary) 60%, transparent)",
  },
  idle: {
    dot: "var(--aurora-text-muted)",
    glow: "0 0 0 3px color-mix(in srgb, var(--aurora-text-muted) 18%, transparent)",
  },
  blocked: {
    dot: "var(--axon-orange)",
    glow: "0 0 0 3px color-mix(in srgb, var(--axon-orange) 22%, transparent), 0 0 12px color-mix(in srgb, var(--axon-orange) 55%, transparent)",
  },
}

/* Geometry parsed from a Node child's inline style. Nodes are positioned with
 * absolute left/top + a fixed width; height is estimated from the node card
 * chrome so edges can anchor to the vertical port center. */
type NodeBox = { left: number; top: number; width: number; height: number }

const NODE_HEIGHT = 64
const PORT = 12

function parseLen(value: string | number | undefined, fallback: number): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const n = parseFloat(value)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function nodeBox(style: React.CSSProperties | undefined): NodeBox {
  return {
    left: parseLen(style?.left as string | number | undefined, 0),
    top: parseLen(style?.top as string | number | undefined, 0),
    width: parseLen(style?.width as string | number | undefined, 128),
    height: parseLen(style?.height as string | number | undefined, NODE_HEIGHT),
  }
}

/* Horizontal-tangent cubic bezier from a source right-port to a target
 * left-port so edges follow the nodes. */
function edgePath(a: NodeBox, b: NodeBox): string {
  const x1 = a.left + a.width
  const y1 = a.top + a.height / 2
  const x2 = b.left
  const y2 = b.top + b.height / 2
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.6)
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

const Node = ({ ref, title, description, className, style, ...props }: NodeProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div
      ref={ref}
      className={cn("group/node", className)}
      style={{
        position: "absolute",
        boxSizing: "border-box",
        padding: "10px 14px",
        background: "var(--aurora-surface-raised)",
        border: "1px solid var(--aurora-border-strong)",
        borderRadius: "var(--aurora-radius-1)",
        boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
        cursor: "grab",
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--aurora-font-display)",
          fontWeight: 700,
          fontSize: 15,
          lineHeight: 1.2,
          color: "var(--aurora-text-primary)",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            flexShrink: 0,
            background: "var(--aurora-accent-primary)",
            boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-accent-primary) 60%, transparent)",
          }}
        />
        {title}
      </div>
      {description ? (
        <div
          style={{
            marginTop: 4,
            fontFamily: "var(--aurora-font-sans)",
            fontSize: 13,
            color: "var(--aurora-text-muted)",
          }}
        >
          {description}
        </div>
      ) : null}

      {/* input port (cyan, filled) — left edge */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -PORT / 2,
          top: "50%",
          transform: "translateY(-50%)",
          width: PORT,
          height: PORT,
          borderRadius: 9999,
          background: "var(--aurora-accent-primary)",
          border: "2px solid var(--aurora-page-bg)",
          boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-accent-primary) 55%, transparent)",
        }}
      />
      {/* output port (rose, hollow) — right edge */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: -PORT / 2,
          top: "50%",
          transform: "translateY(-50%)",
          width: PORT,
          height: PORT,
          borderRadius: 9999,
          background: "var(--aurora-page-bg)",
          border: "2px solid var(--aurora-accent-pink)",
          boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-accent-pink) 45%, transparent)",
        }}
      />
    </div>
  )
Node.displayName = "Node"

const Canvas = ({ ref, title, status = "idle", edges = [], className, style, children, ...props }: CanvasProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const nodes = React.Children.toArray(children).filter(
      (c): c is React.ReactElement<NodeProps> => React.isValidElement(c)
    )
    const boxes = nodes.map((n) => nodeBox((n.props as NodeProps).style))
    const glow = statusGlow[status] ?? statusGlow.idle

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        style={{
          minHeight: 250,
          boxSizing: "border-box",
          padding: 16,
          background: "var(--aurora-surface-raised)",
          border: "1px solid var(--aurora-border-strong)",
          borderRadius: "var(--aurora-radius-2)",
          boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--aurora-border-default) 70%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "10px 10px",
          ...style,
        }}
        {...props}
      >
        {/* edges layer */}
        <svg
          aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
        >
          {edges.map((e, i) => {
            const a = boxes[e.from]
            const b = boxes[e.to]
            if (!a || !b) return null
            return (
              <path
                key={i}
                d={edgePath(a, b)}
                fill="none"
                stroke="var(--aurora-accent-primary)"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 4px color-mix(in srgb, var(--aurora-accent-primary) 45%, transparent))" }}
              />
            )
          })}
        </svg>

        {/* header: status chip + node count */}
        {(title != null || nodes.length > 0) && (
          <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none", zIndex: 2 }}>
            {title != null ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 14px",
                  background: "var(--aurora-surface-raised)",
                  border: "1px solid var(--aurora-border-strong)",
                  borderRadius: 9999,
                  boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
                  pointerEvents: "auto",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 9, height: 9, borderRadius: 9999, background: glow.dot, boxShadow: glow.glow }}
                />
                <span
                  style={{
                    fontFamily: "var(--aurora-font-display)",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "var(--aurora-text-primary)",
                  }}
                >
                  {title}
                </span>
              </div>
            ) : (
              <span />
            )}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                fontFamily: "var(--aurora-font-sans)",
                fontSize: 13,
                fontWeight: 560,
                color: "var(--aurora-text-muted)",
                background: "color-mix(in srgb, var(--aurora-control-surface) 60%, transparent)",
                border: "1px solid var(--aurora-border-default)",
                borderRadius: 9999,
                pointerEvents: "auto",
              }}
            >
              {nodes.length} {nodes.length === 1 ? "node" : "nodes"}
            </div>
          </div>
        )}

        {/* nodes layer */}
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>

        {/* zoom toolbar */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: 4,
            background: "var(--aurora-surface-raised)",
            border: "1px solid var(--aurora-border-strong)",
            borderRadius: "var(--aurora-radius-1)",
            boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
            zIndex: 2,
          }}
        >
          <Action size="sm" aria-label="Zoom out">
            <Minus aria-hidden width={16} height={16} strokeWidth={1.65} />
          </Action>
          <span
            style={{
              fontFamily: "var(--aurora-font-sans)",
              fontSize: 13,
              fontWeight: 560,
              color: "var(--aurora-text-primary)",
              minWidth: 44,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            100%
          </span>
          <Action size="sm" aria-label="Zoom in">
            <Plus aria-hidden width={16} height={16} strokeWidth={1.65} />
          </Action>
        </div>
      </div>
    )
  }
Canvas.displayName = "Canvas"

export { Canvas, Node }
