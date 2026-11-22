import { useFormatForDisplay } from '@tanstack/react-hotkeys'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages.js'
import { Icon } from '../icon'
import {
  COMMAND_PALETTE_HOTKEY,
  useCommandPalette,
} from './command-palette-provider'

export function CommandPaletteTrigger({ className }: { className?: string }) {
  const { open } = useCommandPalette()
  // server and hydration render 'linux', then the client re-renders with the real platform
  const format = useFormatForDisplay()
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        'grid h-9 w-full max-w-[480px] grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md border border-input bg-card px-2.5 text-left text-sm text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <Icon name="search" />
      <span className="truncate">{m.palette_triggerLabel()}</span>
      <kbd aria-hidden="true" className="rounded-sm bg-muted px-1.5 text-micro">
        {format(COMMAND_PALETTE_HOTKEY)}
      </kbd>
    </button>
  )
}
