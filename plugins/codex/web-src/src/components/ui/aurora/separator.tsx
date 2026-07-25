import * as React from "react"
import { cn } from "@/lib/utils"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

function Separator({ ref, className, orientation = "horizontal", decorative = true, style, ...props }: SeparatorProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={decorative ? undefined : orientation}
      data-orientation={orientation}
      className={cn(
        orientation === "vertical" ? "w-px shrink-0 self-stretch" : "h-px w-full shrink-0",
        className,
      )}
      style={{
        background: "var(--aurora-border-default)",
        ...style,
      }}
      {...props}
    />
  )
}

export { Separator }
export default Separator
