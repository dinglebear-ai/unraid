import * as React from "react"

/**
 * Optional portal container for Aurora overlay components (Sheet, Drawer, …).
 *
 * By default their content portals to `document.body` (correct for a real app).
 * But inside a SCALED, clipped preview (the /components catalog tiles), a
 * body-level portal escapes the tile and covers the whole page. Wrapping such a
 * preview in `<PortalContainerContext.Provider value={tileEl}>` makes those
 * overlays portal INTO the tile instead, where the tile's transform/overflow
 * contains them.
 *
 * Consumers pass the value straight to Radix `*.Portal container={…}`. A `null`
 * value means "default to document.body", so normal pages are unaffected.
 */
export const PortalContainerContext = React.createContext<HTMLElement | null>(null)

export function usePortalContainer(): HTMLElement | null {
  return React.useContext(PortalContainerContext)
}
