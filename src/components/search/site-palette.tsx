import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { track } from '#/lib/analytics'
import type { Command } from '../command-palette/command'
import { CommandPalette } from '../command-palette/command-palette'
import { CommandPaletteProvider } from '../command-palette/command-palette-provider'
import { useItemSearchGroups } from './item-search-group'
import { useFavouriteCommands, useRecentGroups } from './saved-item-groups'
import { useSiteCommands } from './site-commands'

const trackOpen = () => track('palette_open')
// the group label only: a command title can be an item the visitor searched for
const trackRun = (command: Command) =>
  track('palette_select', { group: command.group })
// a module-level hook: the provider calls it on every render
const useDynamicGroups = (query: string) => [
  ...useRecentGroups(query),
  ...useItemSearchGroups(query),
]

/** The site's Mod+K palette: saved items, page, region and realm commands plus live item search. */
export function SitePalette({ children }: { children: ReactNode }) {
  const favourites = useFavouriteCommands()
  const site = useSiteCommands()
  const commands = useMemo(() => [...favourites, ...site], [favourites, site])
  return (
    <CommandPaletteProvider
      commands={commands}
      useDynamicGroups={useDynamicGroups}
      onOpen={trackOpen}
      onRun={trackRun}
    >
      {children}
      <CommandPalette />
    </CommandPaletteProvider>
  )
}
