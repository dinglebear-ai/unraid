// Vendored from @unraid/ui (upstream/unraid-api/unraid-ui/src/components/common/badge/badge.variants.ts),
// trimmed to the variants this plugin actually uses.
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold leading-tight transition-all duration-200 ease-in-out h-fit",
  {
    variants: {
      variant: {
        green: "bg-unraid-green-200 text-unraid-green-800",
        red: "bg-unraid-red text-white",
        gray: "bg-gray-200 text-gray-800",
        orange: "bg-orange text-white",
      },
      size: {
        sm: "text-sm px-2 py-1 gap-2",
        md: "text-base px-3 py-2 gap-2",
      },
    },
    defaultVariants: {
      variant: "gray",
      size: "sm",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
