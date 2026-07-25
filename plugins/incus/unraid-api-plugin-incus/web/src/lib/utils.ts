// Vendored from @unraid/ui (upstream/unraid-api/unraid-ui/src/lib/utils.ts), trimmed to
// just the `cn` class-merging helper — this plugin doesn't need the markdown utilities.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
