import type { ReactNode } from 'react'

// Ported from the wepublish editor palette. The core knows nothing about
// routes or items: commands close over whatever they need (navigate, setTheme).
export interface CommandContext {
  close: () => void
}

export interface Command {
  id: string
  /** visible group label, e.g. "Navigate"; groups keep first-match order */
  group: string
  title: string
  section?: string
  keywords?: string[]
  icon?: ReactNode
  /** replaces the highlighted title, e.g. an item row with its price */
  content?: ReactNode
  perform: (context: CommandContext) => void
}

export interface CommandMatch {
  command: Command
  indices: number[]
}

/** Results that come from outside the fuzzy search, such as live item search. */
export interface DynamicGroup {
  id: string
  label: string
  commands: Command[]
  /** "Searching…", "No items match", shown inside the group, never an option */
  status?: ReactNode
}
