import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ---------------------------------------------------------------------------
// CVA variants
// ---------------------------------------------------------------------------

const skeletonVariants = cva("aurora-shimmer shrink-0", {
  variants: {
    variant: {
      text:   "h-3.5 w-full rounded",
      title:  "h-5 w-full rounded",
      avatar: "size-9 rounded-full",
      button: "h-9 w-24 rounded-lg",
      card:   "h-32 w-full rounded-2xl",
    },
  },
  defaultVariants: {
    variant: "text",
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Override default width with a Tailwind class, or an explicit size (px when numeric). */
  width?: string | number;
  /** Explicit height (px when numeric); overrides the variant height. */
  height?: string | number;
  /** Render a circular placeholder (avatar / icon). Pairs with `height` for the diameter. */
  circle?: boolean;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function Skeleton(
  { ref, variant, width, height, circle, className, style, ...rest }: SkeletonProps & { ref?: React.Ref<HTMLDivElement> },
) {
  // `width` is a Tailwind/utility class escape hatch only when it's a class
  // token (no digits-with-unit, no %). Explicit sizes go through inline style.
  const widthIsClass =
    typeof width === "string" && /[a-z]/i.test(width) && !/[%]/.test(width);
  const widthClass = widthIsClass ? (width as string) : undefined;
  const inlineWidth = widthIsClass ? undefined : width;

  const sized: React.CSSProperties = {
    ...(inlineWidth != null ? { width: inlineWidth } : null),
    ...(height != null ? { height } : null),
    ...(circle && height != null ? { width: height } : null),
    ...style,
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        skeletonVariants({ variant }),
        circle && "rounded-full",
        widthClass,
        className,
      )}
      style={sized}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonRow — pre-composed avatar + two text lines + button
// ---------------------------------------------------------------------------

export type SkeletonRowProps = React.HTMLAttributes<HTMLDivElement>

export function SkeletonRow({ ref, className, ...rest }: SkeletonRowProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("flex items-center gap-3", className)}
      {...rest}
    >
      {/* Avatar */}
      <Skeleton variant="avatar" />

      {/* Text block */}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton variant="title" width="w-1/3" />
        <Skeleton variant="text"  width="w-2/3" />
      </div>

      {/* Button */}
      <Skeleton variant="button" />
    </div>
  );
}
