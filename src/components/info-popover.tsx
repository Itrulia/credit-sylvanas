import type { GlossaryKey } from './glossary'
import { GLOSSARY } from './glossary'
import { Icon } from './icon'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

/** Tap and keyboard friendly definition, never a hover-only tooltip. */
export function InfoPopover({ term }: { term: GlossaryKey }) {
  const { label, text } = GLOSSARY[term]
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`What is ${label}?`}
        className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground pointer-coarse:size-11"
      >
        <Icon name="info" />
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm">
        <p className="font-semibold">{label}</p>
        <p>{text}</p>
      </PopoverContent>
    </Popover>
  )
}
