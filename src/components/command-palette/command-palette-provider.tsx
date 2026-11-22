import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { PropsWithChildren } from 'react'
import { useHotkey } from '@tanstack/react-hotkeys'
import type { Command, DynamicGroup } from './command'

export const COMMAND_PALETTE_HOTKEY = 'Mod+K'

const NO_GROUPS: DynamicGroup[] = []
const useNoGroups = (_query: string) => NO_GROUPS

export interface CommandPaletteValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  commands: Command[]
  /** called as a hook inside the palette with the current query */
  useDynamicGroups: (query: string) => DynamicGroup[]
  onRun?: (command: Command) => void
}

const CommandPaletteContext = createContext<CommandPaletteValue>({
  isOpen: false,
  open: () => undefined,
  close: () => undefined,
  toggle: () => undefined,
  commands: [],
  useDynamicGroups: useNoGroups,
})

export interface CommandPaletteProviderProps {
  commands: Command[]
  /** must be a stable hook (same function every render) */
  useDynamicGroups?: (query: string) => DynamicGroup[]
  enabled?: boolean
  onOpen?: () => void
  /** before a command's perform, e.g. for analytics */
  onRun?: (command: Command) => void
}

export function CommandPaletteProvider({
  commands,
  useDynamicGroups = useNoGroups,
  enabled = true,
  onOpen,
  onRun,
  children,
}: PropsWithChildren<CommandPaletteProviderProps>) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(
    () => (isOpen ? close() : open()),
    [close, isOpen, open],
  )

  useHotkey(
    COMMAND_PALETTE_HOTKEY,
    (event) => {
      if (event.defaultPrevented) {
        return
      }
      event.preventDefault()
      toggle()
    },
    {
      enabled,
      preventDefault: false,
      stopPropagation: false,
      ignoreInputs: false,
    },
  )

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, commands, useDynamicGroups, onRun }),
    [close, commands, isOpen, onRun, open, toggle, useDynamicGroups],
  )

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export const useCommandPalette = () => useContext(CommandPaletteContext)
