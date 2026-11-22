import { useId, useState } from 'react'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import { Icon } from '#/components/icon'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { m } from '#/i18n'
import { cn } from '#/lib/utils'

export interface ItemsSearchInputProps {
  /** the q search param */
  q: string
  /** called with the trimmed text, 250ms after typing stops */
  onSearch: (q: string) => void
  className?: string
}

export function ItemsSearchInput({
  q,
  onSearch,
  className,
}: ItemsSearchInputProps) {
  const id = useId()
  const [value, setValue] = useState(q)
  const [seenQ, setSeenQ] = useState(q)
  // q changed from outside (back button, a link): adopt it unless it is just our own text trimmed
  if (q !== seenQ) {
    setSeenQ(q)
    if (q !== value.trim()) {
      setValue(q)
    }
  }
  const search = useDebouncedCallback((text: string) => onSearch(text.trim()), {
    wait: 250,
  })
  return (
    <div role="search" className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{m.items.searchLabel()}</Label>
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          placeholder={m.items.searchPlaceholder()}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            search(e.target.value)
          }}
          className="h-11 pl-9"
        />
      </div>
    </div>
  )
}
