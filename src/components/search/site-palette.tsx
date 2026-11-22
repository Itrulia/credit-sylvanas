import type { ReactNode } from 'react'
import { track } from '#/lib/analytics'
import type { Command } from '../command-palette/command'
import { CommandPalette } from '../command-palette/command-palette'
import { CommandPaletteProvider } from '../command-palette/command-palette-provider'
import { useItemSearchGroups } from './item-search-group'
import { useSiteCommands } from './site-commands'

const trackOpen = () => track('palette_open')
// the group label only: a command title can be an item the visitor searched for
const trackRun = (command: Command) =>
  track('palette_select', { group: command.group })

/** The site's Mod+K palette: page, region and realm commands plus live item search. */
export function SitePalette({ children }: { children: ReactNode }) {
  const commands = useSiteCommands()
  return (
    <CommandPaletteProvider
      commands={commands}
      useDynamicGroups={useItemSearchGroups}
      onOpen={trackOpen}
      onRun={trackRun}
    >
      {children}
      <CommandPalette />
    </CommandPaletteProvider>
  )
}
