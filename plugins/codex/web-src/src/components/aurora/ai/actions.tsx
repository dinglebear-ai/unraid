"use client"

/**
 * Aurora Actions — a horizontal row of message/turn action buttons.
 *
 * `Actions` is the row container (flex, 8px gap). Import `Action` from
 * `./action` or from the `ai-elements` barrel so the registry has one
 * canonical action button implementation.
 *
 * Architecture stays shadcn-compatible: compound `Actions` + `Action` parts, `forwardRef`,
 * `displayName`, `React.memo`, native button props (`onClick`, `disabled`,
 * `type`), and full a11y (`aria-label` for icon-only, `aria-pressed` for
 * toggles, focus-visible ring). No `violet`.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
export { Action } from "./action"
export type { ActionProps } from "./action"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

export type ActionsProps = React.HTMLAttributes<HTMLDivElement>

const Actions = ({ ref, className, children, ...props }: ActionsProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div
      ref={ref}
      role="group"
      className={cn("aurora-actions", className)}
      {...props}
    >
      {children}
    </div>
  )
Actions.displayName = "Actions"

const MemoActions = React.memo(Actions)
MemoActions.displayName = "Actions"

export { MemoActions as Actions }
export default MemoActions
