import * as React from "react"
import { Download, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { Separator } from "@/components/ui/aurora/separator"

export type PackageInfoVariant = "default" | "compact"

export interface PackageInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Package name (rendered in the mono display weight). */
  name: string
  /** Resolved version string, shown in the cyan accent next to the name. */
  version: string
  /** One-line summary under the title. */
  description?: string
  /** Source registry label (e.g. `cargo`, `npm`). Uppercased in the axon-orange footer tone. */
  registry?: string
  /** SPDX-ish license string for the footer. */
  license?: string
  /** Install size string (e.g. `92 KB`) for the footer. */
  size?: string
  /** Marks the version as current — shows the teal LATEST badge. */
  latest?: boolean
  /** Marks the version as behind — shows the amber OUTDATED badge. */
  outdated?: boolean
  /** `compact` drops the footer/install row and shrinks the icon tile. */
  variant?: PackageInfoVariant
  /** Optional handler for the footer Install action. */
  onInstall?: () => void
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

const PackageInfo = (
    { ref,
      name,
      version,
      description,
      registry,
      license,
      size,
      latest = false,
      outdated = false,
      variant = "default",
      onInstall,
      className,
      ...props
    }: PackageInfoProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const isCompact = variant === "compact"
    const hasFooter =
      !isCompact && Boolean(registry || license || size || onInstall)

    return (
      <div
        ref={ref}
        className={cn("aurora-pkg", isCompact && "aurora-pkg--compact", className)}
        {...props}
      >
        <div className="aurora-pkg__head">
          <span className="aurora-pkg__tile">
            <Layers
              width={isCompact ? 18 : 24}
              height={isCompact ? 18 : 24}
              aria-hidden
            />
          </span>
          <span className="aurora-pkg__body">
            <span className="aurora-pkg__title">
              <span className="aurora-pkg__name">{name}</span>
              <span className="aurora-pkg__version">{version}</span>
              {latest ? (
                <Badge tone="success" size="sm">
                  Latest
                </Badge>
              ) : null}
              {outdated ? (
                <Badge tone="warn" size="sm">
                  Outdated
                </Badge>
              ) : null}
            </span>
            {description ? (
              <p className="aurora-pkg__desc">{description}</p>
            ) : null}
          </span>
        </div>

        {hasFooter ? (
          <>
            <Separator className="aurora-pkg__divider" />
            <div className="aurora-pkg__foot">
              <div className="aurora-pkg__meta">
                {registry ? (
                  <span className="aurora-pkg__registry">{registry}</span>
                ) : null}
                {license ? (
                  <span className="aurora-pkg__metaitem">{license}</span>
                ) : null}
                {size ? (
                  <span className="aurora-pkg__metaitem">{size}</span>
                ) : null}
              </div>
              {onInstall || registry || license || size ? (
                <Button
                  type="button"
                  variant="aurora"
                  filled
                  size="sm"
                  onClick={onInstall}
                  disabled={!onInstall}
                  iconLeft={<Download className="size-4" aria-hidden />}
                >
                  Install
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    )
  }
PackageInfo.displayName = "PackageInfo"

const MemoPackageInfo = React.memo(PackageInfo)
MemoPackageInfo.displayName = "PackageInfo"

export { MemoPackageInfo as PackageInfo }
export default MemoPackageInfo
