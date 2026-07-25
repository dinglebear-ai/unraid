"use client"

/**
 * Aurora Confirmation — operator approve/cancel gate for a risky action.
 *
 * Visual layer is ported 1:1 from the Claude Design source (icon badge, intent
 * tint, sunken detail list, right-aligned action row). Architecture stays
 * shadcn/Aurora: `forwardRef`, `displayName`, `React.memo`, full
 * `React.HTMLAttributes` spread, and the Radix/cva `Button` for actions.
 *
 * This file deliberately re-implements `Confirmation` (rather than re-exporting
 * the legacy `core` version) so it can carry CD's `intent` + `details` API while
 * keeping every architectural guarantee. Token-only colors (`--aurora-*`); no
 * hardcoded hex; no `violet`.
 */

import * as React from "react"
import { ChevronRight, CircleAlert, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"

export type ConfirmationIntent = "default" | "danger"

export interface ConfirmationProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  /** Optional list of statements/lines previewing exactly what will run. */
  details?: React.ReactNode[]
  /** `danger` swaps the icon to a triangle-alert and uses destructive action styling. */
  intent?: ConfirmationIntent
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: React.MouseEventHandler<HTMLButtonElement>
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

const Confirmation = (
    { ref,
      title,
      description,
      details,
      intent = "default",
      confirmLabel = "Approve",
      cancelLabel = "Cancel",
      onConfirm,
      onCancel,
      className,
      ...props
    }: ConfirmationProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const reactId = React.useId()
    const titleId = `${reactId}-title`
    const descriptionId = description ? `${reactId}-description` : undefined
    const Icon = intent === "danger" ? TriangleAlert : CircleAlert
    const cls = [
      "aurora-confirm",
      intent === "danger" && "aurora-confirm--danger",
      className,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div
        ref={ref}
        className={cls}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        {...props}
      >
        <div className="aurora-confirm__head">
          <span className="aurora-confirm__badge" aria-hidden>
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="aurora-confirm__text">
            <h3 id={titleId} className="aurora-confirm__title">{title}</h3>
            {description ? <p id={descriptionId} className="aurora-confirm__desc">{description}</p> : null}
          </div>
        </div>

        {details && details.length > 0 ? (
          <div className="aurora-confirm__details">
            {details.map((detail, index) => (
              <div className="aurora-confirm__detail" key={index}>
                <ChevronRight className="aurora-confirm__chevron size-3.5" aria-hidden />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="aurora-confirm__actions">
          <Button type="button" variant="neutral" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={intent === "danger" ? "destructive" : "aurora"} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    )
  }
Confirmation.displayName = "Confirmation"

const MemoConfirmation = React.memo(Confirmation)
MemoConfirmation.displayName = "Confirmation"

export { MemoConfirmation as Confirmation }
export default MemoConfirmation
