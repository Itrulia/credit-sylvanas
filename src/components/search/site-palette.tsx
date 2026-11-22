import type { ReactNode } from 'react'
import { CommandPalette } from '../command-palette/command-palette'
import { CommandPaletteProvider } from '../command-palette/command-palette-provider'
import { useItemSearchGroups } from './item-search-group'
import { useSiteCommands } from './site-commands'

/** The site's Mod+K palette: page, region, realm and theme commands plus live item search. */
export function SitePalette({ children }: { children: ReactNode }) {
  const commands = useSiteCommands()
  return (
    <CommandPaletteProvider
      commands={commands}
      useDynamicGroups={useItemSearchGroups}
    >
      {children}
      <CommandPalette />
    </CommandPaletteProvider>
  )
}
