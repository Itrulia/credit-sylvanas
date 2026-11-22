import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { cn } from '#/lib/utils'
import { m } from '#/i18n'
import { Icon } from '../icon'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import type { CommandMatch } from './command'
import { useCommandPalette } from './command-palette-provider'
import { groupMatches } from './group-matches'
import type { GroupedMatch } from './group-matches'
import { searchCommands } from './search-commands'

const LIST_ID = 'command-palette-results'
const rowId = (index: number) => `command-palette-row-${index}`

function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) {
    return <>{text}</>
  }
  const matched = new Set(indices)
  const runs: { text: string; hit: boolean }[] = []
  ;[...text].forEach((character, index) => {
    const hit = matched.has(index)
    const last = runs.at(-1)
    if (last && last.hit === hit) {
      last.text += character
    } else {
      runs.push({ text: character, hit })
    }
  })
  return (
    <>
      {runs.map((run, index) =>
        run.hit ? (
          <mark key={index} className="bg-transparent font-bold text-inherit">
            {run.text}
          </mark>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </>
  )
}

interface RenderGroup {
  id: string
  label: string
  matches: GroupedMatch[]
  status?: React.ReactNode
}

export function CommandPalette() {
  const { isOpen, close, commands, useDynamicGroups, onRun } =
    useCommandPalette()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const resultsRef = useRef<HTMLDivElement>(null)
  const dynamic = useDynamicGroups(query)

  const groups = useMemo<RenderGroup[]>(() => {
    const fixed = groupMatches(searchCommands(commands, query)).map((g) => ({
      id: g.group,
      label: g.group,
      matches: g.matches.map(({ command, indices }) => ({ command, indices })),
    }))
    const extra = dynamic
      .filter((g) => g.commands.length || g.status)
      .map((g) => ({
        id: g.id,
        label: g.label,
        status: g.status,
        matches: g.commands.map((command) => ({ command, indices: [] })),
      }))
    // an empty query shows dynamic groups (recent items) first; typing puts them after the commands
    const ordered = query.trim() ? [...fixed, ...extra] : [...extra, ...fixed]
    let index = 0
    return ordered.map((g) => ({
      ...g,
      matches: g.matches.map((match) => ({ ...match, index: index++ })),
    }))
  }, [commands, dynamic, query])

  const displayed = useMemo(
    () => groups.flatMap((group) => group.matches),
    [groups],
  )

  const trimmedQuery = query.trim()
  const announcement = !trimmedQuery
    ? ''
    : displayed.length
      ? m.palette.resultCount({ n: displayed.length })
      : m.palette.noResultsStatus({ query: trimmedQuery })

  // reset when the dialog opens, without an effect
  const [wasOpen, setWasOpen] = useState(isOpen)
  // Radix only refocuses its own DialogTrigger, and this dialog has none
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setReturnFocus(
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
      )
    }
  }

  const safeIndex = displayed.length
    ? Math.min(activeIndex, displayed.length - 1)
    : 0

  useEffect(() => {
    const row = resultsRef.current?.querySelector(
      `#${CSS.escape(rowId(safeIndex))}`,
    )
    // jsdom has no scrollIntoView
    if (row && 'scrollIntoView' in row) {
      row.scrollIntoView({ block: 'nearest' })
    }
  }, [safeIndex, displayed])

  const run = (match: CommandMatch | undefined) => {
    if (!match) {
      return
    }
    close()
    onRun?.(match.command)
    match.command.perform({ close })
  }

  const move = (delta: number) => {
    if (!displayed.length) {
      return
    }
    setActiveIndex(
      (current) =>
        (Math.min(current, displayed.length - 1) + delta + displayed.length) %
        displayed.length,
    )
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const keys: Partial<Record<string, () => void>> = {
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(Math.max(displayed.length - 1, 0)),
      Enter: () => run(displayed[safeIndex]),
    }
    const handler = keys[event.key]
    if (handler) {
      event.preventDefault()
      handler()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocus?.focus()
        }}
        className="top-[11vh] flex max-h-[min(70vh,560px)] translate-y-0 flex-col gap-0 overflow-hidden p-0 shadow-pop sm:max-w-[640px]"
      >
        <DialogTitle className="sr-only">{m.palette.dialogTitle()}</DialogTitle>
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 border-b px-4 py-3">
          <Icon name="search" size={20} className="text-muted-foreground" />
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={LIST_ID}
            aria-activedescendant={
              displayed.length ? rowId(safeIndex) : undefined
            }
            aria-label={m.palette.inputLabel()}
            autoComplete="off"
            spellCheck={false}
            placeholder={m.palette.inputPlaceholder()}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            className="min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div
          ref={resultsRef}
          className="overflow-y-auto overscroll-contain p-1.5"
        >
          <div
            id={LIST_ID}
            role="listbox"
            aria-label={m.palette.resultsLabel()}
          >
            {groups.map((group) => (
              <div
                key={group.id}
                role="group"
                aria-labelledby={`${LIST_ID}-${group.id}`}
              >
                <div
                  id={`${LIST_ID}-${group.id}`}
                  className="text-label px-2.5 pt-2.5 pb-1.5"
                >
                  {group.label}
                </div>
                {group.matches.map((match) => (
                  <div
                    key={match.command.id}
                    id={rowId(match.index)}
                    role="option"
                    aria-selected={match.index === safeIndex}
                    onMouseMove={() => setActiveIndex(match.index)}
                    onClick={() => run(match)}
                    className={cn(
                      'grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-2.5 py-2 text-sm',
                      match.index === safeIndex
                        ? 'bg-accent'
                        : 'hover:bg-accent/60',
                    )}
                  >
                    <span className="flex w-4 justify-center">
                      {match.command.icon}
                    </span>
                    <span className="truncate font-medium">
                      {match.command.content ?? (
                        <Highlighted
                          text={match.command.title}
                          indices={match.indices}
                        />
                      )}
                    </span>
                    <span className="text-micro text-muted-foreground">
                      {match.command.section}
                    </span>
                  </div>
                ))}
                {group.status && (
                  <div className="px-2.5 py-2 text-sm text-muted-foreground">
                    {group.status}
                  </div>
                )}
              </div>
            ))}
          </div>

          {trimmedQuery &&
            !displayed.length &&
            !groups.some((g) => g.status) && (
              <p className="px-4 py-7 text-center text-sm text-muted-foreground">
                {m.palette.noResultsLead()}
                <strong className="text-foreground">{trimmedQuery}</strong>
              </p>
            )}
        </div>

        <div role="status" className="sr-only">
          {announcement}
        </div>

        <div className="flex flex-wrap gap-4 border-t px-4 py-2.5 text-micro text-muted-foreground">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> {m.palette.hintMove()}
          </span>
          <span>
            <kbd>{m.palette.keyEnter()}</kbd> {m.palette.hintOpen()}
          </span>
          <span>
            <kbd>{m.palette.keyEsc()}</kbd> {m.palette.hintClose()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
