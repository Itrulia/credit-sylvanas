import type { ReactNode } from 'react'
import { CommandPalette } from '../command-palette/command-palette'
import { CommandPaletteProvider } from '../command-palette/command-palette-provider'
import type { Command } from '../command-palette/command'

// Stub: WP4 owns this file and adds the site commands and the live Items group.
const COMMANDS: Command[] = []

export function SitePalette({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider commands={COMMANDS}>
      {children}
      <CommandPalette />
    </CommandPaletteProvider>
  )
}
